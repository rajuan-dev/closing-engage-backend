import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { openApiDocument } from './openapi';

export const swaggerSpec = swaggerJsdoc({
  definition: openApiDocument,
  apis: [],
});

export const swaggerUiMiddleware = swaggerUi.serve;
export const swaggerUiHandler = swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Closing Engage Backend API Docs',
});
