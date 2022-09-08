import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda/trigger/api-gateway-proxy'
import { Context } from 'aws-lambda/handler'
import { encode } from 'uuid-base58'
import Log from 'lambda-tree'
import { commaSeparatedString } from 'ts-multitool'
import { capitalize } from 'ts-multitool'
import Ajv, { JSONSchemaType } from 'ajv'

export enum HttpStatus {
  OK = 200,
  Created = 201,
  Accepted = 202,
  NoContent = 204,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  Conflict = 409,
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504
}

export type LoadIdentity<TEvent, TAppIdentity> =
  | ((event: TEvent, context: Context) => Promise<TAppIdentity>)
  | undefined

export interface ApplicationInitOptions<TEvent, TAppIdentity, TCustomOptions, TSchemaType> {
  /**
   * authorize the user when they init, DEFAULT is true
   */
  authorize: boolean
  accessControlAllowOrigin: string
  schema: JSONSchemaType<TSchemaType> | undefined
  require: {
    headers?: string[]
    parameters?: {
      path?: string[]
      querystring?: string[]
    }
  }
  custom: TCustomOptions

  // hooks
  onAuthorize?: LoadIdentity<TEvent, TAppIdentity>
  onResponse?: (result: APIGatewayProxyStructuredResultV2) => void
}

export interface ApplicationInitRequest<TEvent, TAppIdentity, TCustomOptions, TSchemaType> {
  event: TEvent
  context: Context
  options?: Partial<ApplicationInitOptions<TEvent, TAppIdentity, TCustomOptions, TSchemaType>>
}

export interface AppContext {
  awsRequestId: string
  requestId: string
  userAgent: string
  sourceIp: string
}

export interface AppRequest<TEvent> {
  event: TEvent | undefined
  context: Context | undefined
  headers: Record<string, string | undefined>
  parameters: {
    path: Record<string, string | undefined>
    querystring: Record<string, string | undefined>
  }
}

export class LambdaAppError<
  TEvent extends APIGatewayProxyEventV2 = APIGatewayProxyEventV2,
  TAppIdentity = never,
  TCustomOptions extends object = never,
  TSchemaType = never
> extends Error {
  private _app: LambdaApp<TEvent, TAppIdentity, TCustomOptions, TSchemaType> | undefined = undefined
  private _statusCode: HttpStatus = HttpStatus.InternalServerError
  public get app() {
    return this._app
  }
  public get response() {
    return this._app?.response(this._statusCode, { message: this.message })
  }
  constructor(
    app: LambdaApp<TEvent, TAppIdentity, TCustomOptions, TSchemaType>,
    message: string,
    statusCode: HttpStatus
  ) {
    super(message)
    this.name = 'LambdaAppError'
    this._app = app
    this._statusCode = statusCode
  }
}

export default class LambdaApp<
  TEvent extends APIGatewayProxyEventV2 = APIGatewayProxyEventV2,
  TAppIdentity = never,
  TCustomOptions extends object = never,
  TSchemaType = never
> {
  private _request = {
    event: undefined as TEvent | undefined,
    context: undefined as Context | undefined,
    headers: {} as Record<string, string | undefined>,
    parameters: {
      querystring: {} as Record<string, string | undefined>,
      path: {} as Record<string, string | undefined>
    }
  }
  private _options: ApplicationInitOptions<TEvent, TAppIdentity, TCustomOptions, TSchemaType> | null = null
  private _log: Log<object> | null = null
  private _requestId: string | undefined
  private _identity: TAppIdentity = {} as TAppIdentity
  private _startTime: number = new Date().getTime()

  public get request(): AppRequest<TEvent> {
    return this._request
  }
  public get log(): Log<object> {
    return this._log ?? new Log<object>()
  }
  public get identity(): TAppIdentity {
    return this._identity
  }
  public get awsRequestId(): string {
    return this._request.context?.awsRequestId ?? ''
  }
  public get requestId(): string {
    return this._requestId ?? encode(this.awsRequestId || '0')
  }
  public set requestId(v: string) {
    this._requestId = v
  }
  public get userAgent(): string {
    return this._request.event?.requestContext.http.userAgent ?? ''
  }
  public get sourceIp(): string {
    return this._request.event?.requestContext.http.sourceIp ?? ''
  }
  public get duration(): number {
    return new Date().getTime() - this._startTime
  }

  private getDefaultInitOptions(): ApplicationInitOptions<TEvent, TAppIdentity, TCustomOptions, TSchemaType> {
    return {
      authorize: true,
      accessControlAllowOrigin: '*',
      onAuthorize: undefined,
      schema: undefined,
      require: {
        headers: [],
        parameters: {
          path: [],
          querystring: []
        }
      },
      custom: {} as TCustomOptions
    }
  }

  public get options(): ApplicationInitOptions<TEvent, TAppIdentity, TCustomOptions, TSchemaType> {
    if (!this._options) {
      this._options = this.getDefaultInitOptions()
    }
    return this._options
  }

  public getBody<T = never>(): Promise<T> {
    if (this._request.headers['content-type'] === 'application/json') {
      try {
        return Promise.resolve(JSON.parse(this._request.event?.body ?? '{}') as T)
      } catch (e) {
        const message = 'Invalid JSON body'
        return Promise.reject(new LambdaAppError(this, message, HttpStatus.BadRequest))
      }
    } else {
      return Promise.resolve(this._request.event?.body as unknown as T)
    }
  }

  /**
   * @throws LambdaAppError
   * @param param0 {event, context, options}
   * @returns
   */
  public async init({
    event,
    context,
    options
  }: ApplicationInitRequest<TEvent, TAppIdentity, TCustomOptions, TSchemaType>): Promise<
    LambdaApp<TEvent, TAppIdentity, TCustomOptions, TSchemaType>
  > {
    this._request.event = event
    this._request.context = context
    this._options = { ...this.getDefaultInitOptions(), ...this._options, ...options }

    // guarantee headers are lowercase
    Object.keys(event.headers).forEach((key) => {
      this._request.headers[key.toLowerCase()] = event.headers[key]
    })

    const missingHeaders: string[] = []
    if (this._options.require.headers && this._options.require.headers.length > 0) {
      const headers = event.headers
      for (const header of this._options.require.headers) {
        if (!headers[header]) {
          missingHeaders.push(header)
        }
      }
    }
    const missingParametersPath: string[] = []
    const missingParametersQuerystring: string[] = []
    if (
      this._options.require.parameters &&
      this._options.require.parameters.path &&
      this._options.require.parameters.path.length > 0
    ) {
      this._request.parameters.path = event.pathParameters ?? {}
      for (const parameter of this._options.require.parameters.path) {
        if (!this._request.parameters.path[parameter]) {
          missingParametersPath.push(parameter)
        }
      }
    }

    if (
      this._options.require.parameters &&
      this._options.require.parameters.querystring &&
      this._options.require.parameters.querystring.length > 0
    ) {
      this._request.parameters.path = event.queryStringParameters ?? {}
      for (const parameter of this._options.require.parameters.querystring) {
        if (!this._request.parameters.querystring[parameter]) {
          missingParametersQuerystring.push(parameter)
        }
      }
    }
    if (missingHeaders.length > 0 || missingParametersPath.length > 0 || missingParametersQuerystring.length > 0) {
      const errors: string[] = []
      if (missingHeaders.length > 0) {
        errors.push(`missing required headers: ${commaSeparatedString(missingHeaders)}.`)
      }
      if (missingParametersPath.length > 0) {
        errors.push(`missing required path parameters: ${commaSeparatedString(missingParametersPath)}.`)
      }
      if (missingParametersQuerystring.length > 0) {
        errors.push(`missing required querystring parameters: ${commaSeparatedString(missingParametersQuerystring)}.`)
      }
      const error = capitalize(commaSeparatedString(errors))
      return Promise.reject(new LambdaAppError(this, error, HttpStatus.BadRequest))
    }

    if (this._options.schema) {
      const body = await this.getBody()
      const ajv = new Ajv()
      const validate = ajv.compile(this._options.schema)
      const valid = validate(body)
      if (!valid) {
        return Promise.reject(
          new LambdaAppError(this, validate.errors?.map((e) => e.message).join(',') ?? '', HttpStatus.BadRequest)
        )
      }
    }

    if (this._options.authorize && this._options.onAuthorize !== undefined) {
      return await this._options
        .onAuthorize(event, context)
        .then((identity) => {
          this._identity = identity
          return Promise.resolve(this)
        })
        .catch((error) => {
          return Promise.reject(new LambdaAppError(this, error, HttpStatus.Unauthorized))
        })
    }
    return Promise.resolve(this)
  }

  private jsonResponse(httpStatus: number, json: Record<string, unknown>): APIGatewayProxyStructuredResultV2 {
    const responseHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': this.options.accessControlAllowOrigin
    }
    return {
      statusCode: httpStatus,
      body: JSON.stringify(json),
      headers: responseHeaders
    }
  }

  public response(httpStatus: HttpStatus, json?: Record<string, unknown>): APIGatewayProxyStructuredResultV2 {
    // remove context if empty
    const structuredResultV2 = this.jsonResponse(httpStatus, {
      request: {
        id: this.requestId,
        duration: this.duration
      },
      ...{ context: Object.keys(this.identity as unknown as object).length === 0 ? undefined : this.identity },
      ...json
    })

    if (this._options?.onResponse) {
      this._options?.onResponse(structuredResultV2)
    }

    return structuredResultV2
  }
}
