import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda/trigger/api-gateway-proxy'
import { Context } from 'aws-lambda/handler'
import { encode } from 'uuid-base58'

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

export interface AppLoggerInterface {
  info: (message: string) => void
  error: (message: string) => void
  debug: (message: string) => void
  warn: (message: string) => void
}

export type LoadIdentity<TEvent, TAppIdentity> =
  | ((event: TEvent, context: Context) => Promise<TAppIdentity>)
  | undefined

export interface ApplicationInitOptions<TEvent, TAppIdentity> {
  /**
   * authorize the user when they init, DEFAULT is true
   */
  authorize?: boolean
  accessControlAllowOrigin?: string
  onLoadIdentity?: LoadIdentity<TEvent, TAppIdentity>
}

export interface ApplicationInitRequest<TEvent, TAppIdentity> {
  event: TEvent
  context: Context
  options?: ApplicationInitOptions<TEvent, TAppIdentity>
}

export interface AppContext {
  awsRequestId: string
  requestId: string
  userAgent: string
  sourceIp: string
}

export default class LambdaApp<TAppIdentity, TEvent extends APIGatewayProxyEventV2> {
  private _options: ApplicationInitOptions<TEvent, TAppIdentity> | null = null
  private _log: AppLoggerInterface | null = null
  private _context: AppContext = {
    awsRequestId: '',
    requestId: '',
    userAgent: '',
    sourceIp: ''
  }
  private _identity: TAppIdentity = {} as TAppIdentity
  private _error: Error | null = null
  private _startTime: number = new Date().getTime()

  public setRequestId(requestId: string): void {
    this._context.requestId = requestId
  }

  public get error(): Error | null {
    return this._error
  }
  protected set error(e: Error | null) {
    this._error = e
  }

  private getDefaultInitOptions(): ApplicationInitOptions<TEvent, TAppIdentity> {
    return {
      authorize: true,
      accessControlAllowOrigin: '*',
      onLoadIdentity: undefined
    }
  }

  public get log(): AppLoggerInterface {
    return (
      this._log || {
        info(message: string) {
          console.info(message)
        },
        error(message: string) {
          console.error(message)
        },
        debug(message: string) {
          console.debug(message)
        },
        warn(message: string) {
          console.warn(message)
        }
      }
    )
  }

  public set log(l) {
    this._log = l
  }

  private getInitialAppContext(event: TEvent, context: Context): AppContext {
    const awsRequestId = encode(context.awsRequestId)
    const requestId = `${awsRequestId}`
    return {
      awsRequestId,
      requestId,
      userAgent: event.requestContext?.http?.userAgent ?? '',
      sourceIp: event.requestContext?.http?.sourceIp ?? ''
    }
  }

  public get options(): ApplicationInitOptions<TEvent, TAppIdentity> {
    return this._options || this.getDefaultInitOptions()
  }

  /**
   * example context type might be APIGatewayProxyEventV2WithJWTAuthorizer
   * @returns
   */

  // public async onLoadIdentity(requestContext: TEvent['requestContext']): Promise<TAppIdentity> {
  //   return {} as TAppIdentity
  // }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // public onLoadIdentity: (requestContext: TEvent['requestContext']) => Promise<TAppIdentity> = (_requestContext) => {
  //   return Promise.resolve({} as TAppIdentity)
  // }

  public get identity(): TAppIdentity {
    return this._identity
  }
  public set identity(i: TAppIdentity) {
    this._identity = i
  }
  public get context(): AppContext {
    return this._context
  }

  public async init({
    event,
    context,
    options
  }: ApplicationInitRequest<TEvent, TAppIdentity>): Promise<LambdaApp<TAppIdentity, TEvent>> {
    this._options = { ...this.getDefaultInitOptions(), ...this._options, ...options }
    this._context = this.getInitialAppContext(event, context)

    // assert(
    //   this._options.authorize && !this._options.onLoadIdentity,
    //   'onLoadIdentity must be defined if authorize is true'
    // )

    if (this._options.authorize && this._options.onLoadIdentity !== undefined) {
      return await this._options
        .onLoadIdentity(event, context)
        .then((identity) => {
          this._identity = identity
          return Promise.resolve(this)
        })
        .catch((error) => {
          this._error = error
          return Promise.reject(this)
        })
    }
    return Promise.resolve(this)
  }

  public set onLoadIdentity(v: LoadIdentity<TEvent, TAppIdentity>) {
    if (this._options === null) {
      this._options = this.getDefaultInitOptions()
    }
    this._options.onLoadIdentity = v
  }

  private jsonResponse(httpStatus: number, json: Record<string, any>): APIGatewayProxyStructuredResultV2 {
    const responseHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': this.options.accessControlAllowOrigin ?? '*'
    }
    return {
      statusCode: httpStatus,
      body: JSON.stringify(json),
      headers: responseHeaders
    }
  }

  public get duration(): number {
    return new Date().getTime() - this._startTime
  }

  public response(httpStatus: HttpStatus, json?: Record<string, any>): APIGatewayProxyStructuredResultV2 {
    // if (this._options.writeRequestLog) {
    //   Logger.response(this._context, httpStatus)
    // }

    // remove context if empty
    return this.jsonResponse(httpStatus, {
      request: {
        id: this.context.requestId,
        duration: this.duration
      },
      ...{ context: Object.keys(this.identity).length === 0 ? undefined : this.identity },
      ...json
    })
  }
}
