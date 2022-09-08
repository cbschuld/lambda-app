import LambdaApp, { HttpStatus } from '../src/index'

describe('hook tests', () => {
  test('onResponse', () => {
    const responseHook = jest.fn()
    const app = new LambdaApp()
    app.options.onResponse = responseHook
    const r = app.response(HttpStatus.OK)
    expect(r.statusCode).toBe(200)
    expect(responseHook).toBeCalled()
  })
})
