# swagger-lambda

Swagger Lambda is an alternative solution to AWS API Gateway's lambda invokation built on NodeJS, Express, and the Swagger Tools Middleware.

[![npm](https://img.shields.io/npm/v/swagger-lambda.svg)](https://www.npmjs.com/package/swagger-lambda)
[![npm](https://img.shields.io/npm/l/swagger-lambda.svg)](https://github.com/jakedahm/swagger-lambda/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/dt/swagger-lambda.svg)](https://www.npmjs.com/package/swagger-lambda)

## Installation

```sh
npm install --save swagger-lambda
```

**/controllers/lambda.js**

```js
const swaggerLambda = require('swagger-lambda');

exports.invoke = swaggerLambda;
```

## Configuration

See example for a more detailed implementation. The swagger-lambda controller can be configured through the swagger route definition, and by using environment variables. In all cases the properties defined in the swagger definition will be used instead of environment variables.

### Swagger Route Configuration

- **x-swagger-router-controller**: Name of lambda controller. Example `lambda`
- **operationId**: Name of method to call. Example `invoke`
- **x-lambda-function-name**: **Required** Name or ARN of the lambda function to invoke. Example `getGreeting`
- **x-lambda-function-alias**: Controls which version of your lambda function to invoke. Default **$LATEST** 
- **x-lambda-dryrun**: Invoke the function call without executing the lambda function. Good for testing. Default **false**

### swagger-lambda ENV variables

- **AWS_LAMBDA_ALIAS**: Controls which version of your lambda function to invoke. Default **$LATEST**
- **AWS_LAMBDA_DRYRUN**: Invoke the function call without executing the lambda function. Good for testing. Default **false**

## Debugging

To debug the lambda controller set the environment variable `DEBUG=swagger-lambda`

### Required AWS ENV variables

```sh
# AWS required params
AWS_PROFILE=my-account
# OR
AWS_ACCESS_KEY_ID=yourKey
AWS_SECRET_ACCESS_KEY=yourSecret

AWS_REGION=us-west-2
```

## Example

In this example we will use Express and Swagger Tools to scaffold our API from our swagger.yml. First we need to create the lambda controller `controllers/lambda.js`. We then need to update our  `swagger.yml` with `x-swagger-router-controller, x-lambda-function-name, operationId`. The swagger-lambda module will read the custom `x-lambda-*` properties to build the lambda invoke request.

**/controllers/lambda.js**

```js
const swaggerLambda = require('swagger-lambda');

exports.invoke = swaggerLambda;
```

**swagger.yml**

```yaml
swagger: '2.0'
info:
  version: 1.0.0
  title: Swagger Lambda Example
basePath: /api/v1
paths:
  /hello:
    get:
      x-swagger-router-controller: lambda
      x-lambda-function-name: getGreeting
      operationId: invoke
      summary: Returns greeting
      parameters:
        - name: name
          in: query
          type: string
      responses:
        200:
          description: Success
```

**index.js**

```js
const express = require('express');
const swaggerTools = require('swagger-tools');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const { PORT = 3000 } = process.env;
const schema = yaml.safeLoad(
  fs.readFileSync(path.join(__dirname, 'swagger.yml'), 'utf8')
);
const app = express();

swaggerTools.initializeMiddleware(schema, middleware => {
  app.use(middleware.swaggerMetadata());
  app.use(middleware.swaggerValidator());
  app.use(
    middleware.swaggerRouter({
      controllers: path.join(__dirname, 'controllers')
    })
  );

  app.use(
    middleware.swaggerUi({
      apiDocs: '/api/v1/api-docs',
      swaggerUi: '/api/v1/docs'
    })
  );

  // Start the server on the specified port
  app.listen(PORT, () => {
    /* eslint no-console: 0 */
    console.log(`Server running on port ${PORT}`);
  });
});
```

**Example Lambda Function**

```js
exports.handler = (event, context, callback) => {
  const { name } = event;

  callback(null, `Hello, ${name}`);
};
```
