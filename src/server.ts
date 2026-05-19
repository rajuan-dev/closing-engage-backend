import http from 'http';
import mongoose from 'mongoose';

import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './core/logger';
import { ensureSeedAdmin } from './modules/auth/auth.service';

const server = http.createServer(app);

const isBackendAlreadyRunning = async (): Promise<boolean> =>
  new Promise((resolve) => {
    const request = http.get(
      {
        host: '127.0.0.1',
        port: env.PORT,
        path: `${env.API_PREFIX}/health`,
        timeout: 2000,
      },
      (response) => {
        let body = '';

        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          resolve(response.statusCode === 200 && body.includes('Closing Engage Backend is running'));
        });
      },
    );

    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.on('error', () => resolve(false));
  });

const shutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, 'Shutdown signal received');

  server.close((error) => {
    if (error) {
      logger.error({ err: error }, 'Error during server shutdown');
      process.exit(1);
    }

    void mongoose.connection.close(false).finally(() => {
      logger.info('HTTP server closed gracefully');
      process.exit(0);
    });
  });
};

const bootstrap = async (): Promise<void> => {
  await connectDatabase();
  await ensureSeedAdmin();

  server.on('error', async (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      const alreadyRunning = await isBackendAlreadyRunning();

      if (alreadyRunning) {
        logger.warn(
          {
            port: env.PORT,
            healthUrl: `http://localhost:${env.PORT}${env.API_PREFIX}/health`,
          },
          'Closing Engage backend is already running in another process',
        );
        process.exit(0);
      }
    }

    logger.error({ err: error }, 'HTTP server failed to start');
    process.exit(1);
  });

  server.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        environment: env.NODE_ENV,
        apiPrefix: env.API_PREFIX,
      },
      'Closing Engage backend server started',
    );
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

void bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});
