import dns from 'node:dns';
import mongoose from 'mongoose';

import { logger } from '../core/logger';
import { env } from './env';

const shouldRetryWithFallbackDns = (error: unknown): error is NodeJS.ErrnoException => {
  if (!(error instanceof Error)) {
    return false;
  }

  const dnsError = error as NodeJS.ErrnoException;

  return (
    dnsError.syscall === 'querySrv' &&
    ['ECONNREFUSED', 'EAI_AGAIN', 'ENOTFOUND', 'ETIMEOUT'].includes(dnsError.code ?? '')
  );
};

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('MongoDB connection established');
  } catch (error) {
    if (shouldRetryWithFallbackDns(error)) {
      const originalDnsServers = dns.getServers();

      logger.warn(
        {
          originalDnsServers,
          fallbackDnsServers: env.MONGODB_DNS_FALLBACK_SERVERS,
        },
        'MongoDB SRV lookup failed, retrying with fallback DNS servers',
      );

      dns.setServers(env.MONGODB_DNS_FALLBACK_SERVERS);

      try {
        await mongoose.connect(env.MONGODB_URI);
        logger.info(
          {
            dnsServers: dns.getServers(),
          },
          'MongoDB connection established with fallback DNS servers',
        );
        return;
      } catch (retryError) {
        logger.error({ err: retryError }, 'MongoDB connection failed after fallback DNS retry');
        throw retryError;
      }
    }

    logger.error({ err: error }, 'MongoDB connection failed');
    throw error;
  }
};
