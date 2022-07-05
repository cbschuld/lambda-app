/* eslint-disable @typescript-eslint/no-empty-function */

import LambdaApp from '../src/index'
import AppLogger from '../src/AppLogger'
import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda/trigger/api-gateway-proxy'
import event from './APIGatewayProxyEventV2WithJWTAuthorizer.json'
import contextV1 from './Context.json'
import { Context } from 'aws-lambda/handler'
const context: Context = contextV1 as Context

interface MyIdentity {
  id: string
  name: string
  email: string
}

class MyAppError extends LambdaApp<MyIdentity, APIGatewayProxyEventV2WithJWTAuthorizer> {
  constructor() {
    super()
    this.log = new AppLogger()
    this.onLoadIdentity = () => {
      // this.identity = {
      //   id: event.requestContext.authorizer.jwt.claims.sub?.toString(),
      //   name: '',
      //   email: ''
      // }
      return Promise.reject(new Error('invalid user'))
    }
  }
}

const appError = new MyAppError()

describe('testing onLoadIdentity errors', () => {
  test('error test', () => {
    appError.init({ event, context, options: { authorize: true } }).catch((app) => {
      expect(app.error).toBeDefined()
      expect(app.error.message).toBe('invalid user')
    })
  })
})
