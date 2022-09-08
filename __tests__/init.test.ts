import { Context } from 'aws-lambda/handler'
import LambdaApp, { HttpStatus } from '../src/index'
import event from './data/APIGatewayProxyEventV2WithJWTAuthorizer.json'
import contextV1 from './data/Context.json'

const context: Context = contextV1 as Context

describe('testing initialization', () => {
  test('no init empty with response', () => {
    const app = new LambdaApp()
    expect(app.response).toBeDefined()
    expect(app.response(HttpStatus.OK).statusCode).toBe(200)
  })
  test('test with defined accessControlAllowOrigin', () => {
    new LambdaApp()
      .init({
        event,
        context,
        options: {
          accessControlAllowOrigin: 'localhost'
        }
      })
      .then((app) => {
        const response = app.response(HttpStatus.OK)
        expect(app.response).toBeDefined()
        expect(response).toMatchObject(
          expect.objectContaining({
            body: expect.any(String),
            headers: {
              'Access-Control-Allow-Origin': 'localhost',
              'Content-Type': expect.any(String)
            },
            statusCode: 200
          })
        )
      })
  })
})
