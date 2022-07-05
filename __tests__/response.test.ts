import LambdaApp, { HttpStatus } from '../src/index'
import AppLogger from '../src/AppLogger'
import { APIGatewayProxyEventV2 } from 'aws-lambda/trigger/api-gateway-proxy'

class MyApp extends LambdaApp<null, APIGatewayProxyEventV2> {
  constructor() {
    super()
    this.log = new AppLogger()
  }
}

const app = new MyApp()

describe('testing logging capability', () => {
  test('test OK = 200', () => {
    const response = app.response(HttpStatus.OK, { message: 'OK' })
    expect(response.statusCode).toBe(200)
  })
  test('test Created = 201', () => {
    const response = app.response(HttpStatus.Created, { message: 'OK' })
    expect(response.statusCode).toBe(201)
  })
  test('test Accepted = 202', () => {
    const response = app.response(HttpStatus.Accepted, { message: 'OK' })
    expect(response.statusCode).toBe(202)
  })
  test('test NoContent = 204', () => {
    const response = app.response(HttpStatus.NoContent, { message: 'OK' })
    expect(response.statusCode).toBe(204)
  })
  test('test BadRequest = 400', () => {
    const response = app.response(HttpStatus.BadRequest, { message: 'OK' })
    expect(response.statusCode).toBe(400)
  })
  test('test Unauthorized = 401', () => {
    const response = app.response(HttpStatus.Unauthorized, { message: 'OK' })
    expect(response.statusCode).toBe(401)
  })
  test('test Forbidden = 403', () => {
    const response = app.response(HttpStatus.Forbidden, { message: 'OK' })
    expect(response.statusCode).toBe(403)
  })
  test('test NotFound = 404', () => {
    const response = app.response(HttpStatus.NotFound, { message: 'OK' })
    expect(response.statusCode).toBe(404)
  })
  test('test MethodNotAllowed = 405', () => {
    const response = app.response(HttpStatus.MethodNotAllowed, { message: 'OK' })
    expect(response.statusCode).toBe(405)
  })
  test('test Conflict = 409', () => {
    const response = app.response(HttpStatus.Conflict, { message: 'OK' })
    expect(response.statusCode).toBe(409)
  })
  test('test InternalServerError = 500', () => {
    const response = app.response(HttpStatus.InternalServerError, { message: 'OK' })
    expect(response.statusCode).toBe(500)
  })
  test('test NotImplemented = 501', () => {
    const response = app.response(HttpStatus.NotImplemented, { message: 'OK' })
    expect(response.statusCode).toBe(501)
  })
  test('test BadGateway = 502', () => {
    const response = app.response(HttpStatus.BadGateway, { message: 'OK' })
    expect(response.statusCode).toBe(502)
  })
  test('test ServiceUnavailable = 503', () => {
    const response = app.response(HttpStatus.ServiceUnavailable, { message: 'OK' })
    expect(response.statusCode).toBe(503)
  })
  test('test GatewayTimeout = 504', () => {
    const response = app.response(HttpStatus.GatewayTimeout, { message: 'OK' })
    expect(response.statusCode).toBe(504)
  })
})
