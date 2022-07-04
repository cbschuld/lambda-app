import {
  APIGatewayEventRequestContextV2,
  APIGatewayProxyEventV2WithRequestContext,
  APIGatewayProxyStructuredResultV2
} from 'aws-lambda/trigger/api-gateway-proxy'
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

export interface ApplicationInitOptions {
  /**
   * authorize the user when they init, DEFAULT is true
   */
  authorize?: boolean
  accessControlAllowOrigin?: string
}

export interface ApplicationInitRequest<TEvent> {
  event: TEvent
  context: Context
  options?: ApplicationInitOptions
}

export interface AppContext {
  awsRequestId: string
  requestId: string
  userAgent: string
  sourceIp: string
}

export default class LambdaApp<
  AppIdentity,
  TRequestContext extends APIGatewayEventRequestContextV2,
  TEvent extends APIGatewayProxyEventV2WithRequestContext<TRequestContext>
> {
  private _options: ApplicationInitOptions | null = null
  private _log: AppLoggerInterface | null = null
  private _context: AppContext = {
    awsRequestId: '',
    requestId: '',
    userAgent: '',
    sourceIp: ''
  }
  private _identity: AppIdentity = {} as AppIdentity
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

  private getDefaultInitOptions(): ApplicationInitOptions {
    return {
      authorize: true,
      accessControlAllowOrigin: '*'
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

  public get options(): ApplicationInitOptions {
    return this._options || this.getDefaultInitOptions()
  }

  /**
   * example context type might be APIGatewayProxyEventV2WithJWTAuthorizer
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async onLoadIdentity(requestContext: TRequestContext): Promise<AppIdentity> {
    return {} as AppIdentity
  }

  public get identity(): AppIdentity {
    return this._identity
  }
  public set identity(i: AppIdentity) {
    this._identity = i
  }
  public get context(): AppContext {
    return this._context
  }

  public async init({
    event,
    context,
    options
  }: ApplicationInitRequest<TEvent>): Promise<LambdaApp<AppIdentity, TRequestContext, TEvent>> {
    this._options = { ...this.getDefaultInitOptions(), ...options }
    this._context = this.getInitialAppContext(event, context)

    if (this.options.authorize) {
      return await this.onLoadIdentity(event.requestContext)
        .then((identity) => {
          this._identity = identity
          return this
        })
        .catch((error) => {
          this.error = error
          return this
        })
    }
    return Promise.resolve(this)
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
