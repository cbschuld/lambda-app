# Lambda App - Opinionated Lambda App Initialization, Management and Response System

A simplistic and opinionated way to initialize a lambda-based application on AWS, log consistently to CloudWatch and respond to requests from users. The Lambda App system is designed to help minimize app-start and app-response code in serverless applications both through frameworks like serverless.com or the AWS CDK.

## Example Usage

simplistic construction and response

```typescript
export const main: APIGatewayProxyHandlerV2 = async (event, context) => {
  const app = new App()
  return app.response(HttpStatus.OK)
}
```

## Identity Management

Identity request is called by the App runtime via overloading the function `onLoadIdentity`. It is called when the user invokes `init()` from the App instance.

```typescript
class MyApp extends LambdaApp<
  MyIdentity,
  APIGatewayEventRequestContextV2,
  APIGatewayProxyEventV2WithRequestContext<APIGatewayEventRequestContextV2>
> {
  public async onLoadIdentity(request: APIGatewayEventRequestContextV2): Promise<MyIdentity> {
    return Promise.resolve({
      user: {
        id: 'abc123',
        first: 'John',
        last: 'Doe'
      },
      company: 'Acme',
      office: 'New York'
    })
  }
}

export const main: APIGatewayProxyHandlerV2 = async (event, context) => {
  return new MyApp()
    .init({ event, context, options: { authorize: true } })
    .then((app) => app.response(HttpStatus.OK))
    .catch((app) => app.response(HttpStatus.Forbidden, { error: app.error.message }))
}
```

## Tests

Tests are executed via Jest.

```shell script
npm run test
```
