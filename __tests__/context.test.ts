/* eslint-disable @typescript-eslint/no-empty-function */
import { Context } from 'aws-lambda'
import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda/trigger/api-gateway-proxy'
import LambdaApp, { HttpStatus } from '../src/index'
import event from './APIGatewayProxyEventV2WithJWTAuthorizer.json'
import contextV1 from './Context.json'

const context: Context = contextV1 as Context

interface User {
  id: string
  first: string
  last: string
}

interface MyIdentity {
  user: User
  company: string
  office: string
}

class MyApp extends LambdaApp<MyIdentity, APIGatewayProxyEventV2WithJWTAuthorizer> {
  constructor() {
    super()
    this.onLoadIdentity = (event) => {
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

describe('testing identity without initialization/control', () => {
  test('identity should be an empty object', async () => {
    new LambdaApp().init({ event, context, options: { authorize: true } }).then((app) => {
      expect(Object.keys(app.identity as object).length).toBe(0)
    })
  })
  test('identity should be an empty object', async () => {
    new LambdaApp().init({ event, context, options: { authorize: false } }).then((app) => {
      expect(Object.keys(app.identity as object).length).toBe(0)
    })
  })
})

describe('testing context meta values', () => {
  test('context dump', async () => {
    new MyApp().init({ event, context, options: { authorize: true } }).then((app) => {
      expect(app.identity.user.id).toBe(event.requestContext.requestId)
      expect(app.identity.user.first).toBe('John')
      expect(app.identity.user.last).toBe('Doe')
      expect(app.identity.company).toBe('Acme')
      expect(app.identity.office).toBe('New York')
    })
  })
})

describe('testing empty/missing context', () => {
  test('context should be empty as it was never created', async () => {
    const app = new LambdaApp()
    app.setRequestId('123456')
    const body = JSON.parse(app.response(HttpStatus.OK)?.body ?? '{}')
    expect(body.request.id).toBe('123456')
    expect(body).not.toContain('context')
  })
})

describe('testing empty/missing context', () => {
  test('context should be empty as it was never created', async () => {
    const app = new LambdaApp()
    app.setRequestId('123456')
    const body = JSON.parse(app.response(HttpStatus.OK)?.body ?? '{}')
    expect(body.request.id).toBe('123456')
    expect(body).not.toContain('context')
  })
})
