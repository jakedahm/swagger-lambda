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
