/* eslint-disable @typescript-eslint/no-empty-function */

import LambdaApp from '../src/index'
import AppLogger from '../src/AppLogger'
import {
  APIGatewayEventRequestContextV2,
  APIGatewayProxyEventV2WithRequestContext
} from 'aws-lambda/trigger/api-gateway-proxy'

class MyApp extends LambdaApp<
  null,
  APIGatewayEventRequestContextV2,
  APIGatewayProxyEventV2WithRequestContext<APIGatewayEventRequestContextV2>
> {
  constructor() {
    super()
    this.log = new AppLogger()
  }
}

const app = new MyApp()

describe('testing logging capability', () => {
  test('info test', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    app.log.info('info message')
    expect(consoleSpy).toHaveBeenCalledWith('info message')
    consoleSpy.mockClear()
  })
  test('warn test', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    app.log.warn('warn message')
    expect(consoleSpy).toHaveBeenCalledWith('warn message')
    consoleSpy.mockClear()
  })
  test('error test', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    app.log.error('error message')
    expect(consoleSpy).toHaveBeenCalledWith('error message')
    consoleSpy.mockClear()
  })
  test('debug test', () => {
    const consoleSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
    app.log.debug('debug message')
    expect(consoleSpy).toHaveBeenCalledWith('debug message')
    consoleSpy.mockClear()
  })
})
