const AWS = require('aws-sdk');
const debug = require('debug')('swagger-lambda');

const lambda = new AWS.Lambda();
const { AWS_LAMBDA_ALIAS = '$LATEST', AWS_LAMBDA_DRYRUN = false } = process.env;

module.exports = (req, res, next) => {
  const { operation, params } = req.swagger;
  const alias = operation['x-lambda-function-alias'] || AWS_LAMBDA_ALIAS;
  const arn = operation['x-lambda-function-name'];
  const dyrRun = AWS_LAMBDA_DRYRUN || operation['x-lambda-dryrun'];
  const payload = {};

  // Map the swagger params to the payload object
  Object.keys(params).forEach(key => {
    if (typeof params[key].value !== 'undefined' && key !== 'body') {
      payload[key] = params[key].value;
    }
  });

  // Extend the payload object with the contents of the request body.
  // This moves the body param to the root of the request payload
  const lambdaPayload = Object.assign({}, payload, params.body ? params.body.value : {});
  const lambdaParams = {
    FunctionName: arn,
    Payload: new Buffer(JSON.stringify(lambdaPayload)),
    Qualifier: alias,
    InvocationType: dyrRun ? 'DryRun' : 'RequestResponse'
  };

  debug('Lambda.invoke() request');
  debug(JSON.stringify(Object.assign({}, lambdaParams, { Payload: lambdaPayload }), null, 2));

  lambda.invoke(lambdaParams, (err, data) => {
    if (err) return next(err);

    debug('Lambda.invoke() response');
    debug(JSON.stringify(data, null, 2));

    let payload = {};

    try {
      payload = JSON.parse(data.Payload);
    } catch (e) {
      payload = data.Payload;
    }

    if (payload.errorMessage) {
      const error = new Error(payload.errorMessage);
      error.code = data.StatusCode || payload.statusCode || 400;
      return next(error);
    }
    res.send(payload);
  });
};
