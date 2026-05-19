import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { swaggerSpec, swaggerUiHandler, swaggerUiMiddleware } from './docs/swagger';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { apiRouter } from './routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLoggerMiddleware);

app.get('/docs.json', (_req, res) => {
  res.json(swaggerSpec);
});
app.use('/docs', swaggerUiMiddleware, swaggerUiHandler);

app.use(env.API_PREFIX, apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
