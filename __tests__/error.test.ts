/* eslint-disable @typescript-eslint/no-empty-function */

import LambdaApp from '../src/index'
import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda/trigger/api-gateway-proxy'
import event from './data/APIGatewayProxyEventV2WithJWTAuthorizer.json'
import contextV1 from './data/Context.json'
import { Context } from 'aws-lambda/handler'
const context: Context = contextV1 as Context

interface MyIdentity {
  id: string
  name: string
  email: string
}

class MyAppError extends LambdaApp<APIGatewayProxyEventV2WithJWTAuthorizer, MyIdentity> {
  constructor() {
    super()
    this.options.onAuthorize = () => {
      return Promise.reject(new Error('invalid user'))
    }
  }
}

const appError = new MyAppError()

describe('testing onLoadIdentity errors', () => {
  test('error test', () => {
    appError.init({ event, context, options: { authorize: true } }).catch((error) => {
      expect(error).toBeDefined()
      expect(error.message).toBe('Error: invalid user')
    })
  })
})
