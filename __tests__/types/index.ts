import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda/trigger/api-gateway-proxy'
import LambdaApp from '../../src'

export interface User {
  id: string
  first: string
  last: string
}

export interface MyIdentity {
  user: User
  company: string
  office: string
}

export class MyAppWithUser extends LambdaApp<APIGatewayProxyEventV2WithJWTAuthorizer, MyIdentity> {
  constructor() {
    super()
    this.options.onAuthorize = (event) => {
      return Promise.resolve({
        user: {
          id: event.requestContext.requestId,
          first: 'John',
          last: 'Doe'
        },
        company: 'Acme',
        office: 'New York'
      })
    }
  }
}
