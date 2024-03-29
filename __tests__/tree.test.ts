/* eslint-disable @typescript-eslint/no-empty-function */

import LambdaApp from '../src/index'

class MyApp extends LambdaApp {}

const app = new MyApp()

describe('testing external logging capability', () => {
  test('info test', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    app.log.info('info message')
    expect(consoleSpy).toHaveBeenCalledWith('{"level":"info","message":"info message"}')
    consoleSpy.mockClear()
  })
  test('warn test', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    app.log.warn('warn message')
    expect(consoleSpy).toHaveBeenCalledWith('{"level":"warn","message":"warn message"}')
    consoleSpy.mockClear()
  })
  test('error test', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    app.log.error('error message')
    expect(consoleSpy).toHaveBeenCalledWith('{"level":"error","message":"error message"}')
    consoleSpy.mockClear()
  })
  test('debug test', () => {
    const consoleSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
    app.log.debug('debug message')
    expect(consoleSpy).toHaveBeenCalledWith('{"level":"debug","message":"debug message"}')
    consoleSpy.mockClear()
  })
})
