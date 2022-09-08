/* eslint-disable @typescript-eslint/no-empty-function */
import { Context } from 'aws-lambda'
import LambdaApp, { HttpStatus } from '../src/index'
import event from './data/APIGatewayProxyEventV2WithJWTAuthorizer.json'
import contextV1 from './data/Context.json'
import { MyAppWithUser } from './types'

const context: Context = contextV1 as Context

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
    new MyAppWithUser().init({ event, context, options: { authorize: true } }).then((app) => {
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
    app.requestId = '123456'
    const body = JSON.parse(app.response(HttpStatus.OK)?.body ?? '{}')
    expect(body.request.id).toBe('123456')
    expect(body).not.toContain('context')
  })
})

describe('testing empty/missing context', () => {
  test('context should be empty as it was never created', async () => {
    const app = new LambdaApp()
    app.requestId = '123456'
    const body = JSON.parse(app.response(HttpStatus.OK)?.body ?? '{}')
    expect(body.request.id).toBe('123456')
    expect(body).not.toContain('context')
  })
})
