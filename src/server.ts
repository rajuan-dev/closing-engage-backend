import http from 'http';
import mongoose from 'mongoose';

import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './core/logger';

const server = http.createServer(app);

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
