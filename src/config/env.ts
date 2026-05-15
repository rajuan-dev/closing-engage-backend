import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().trim().min(1).default('/api/v1'),
  MONGODB_URI: z.string().trim().min(1, 'MONGODB_URI is required'),
  MONGODB_DNS_FALLBACK_SERVERS: z.string().trim().optional(),
  CORS_ORIGIN: z.string().trim().min(1, 'CORS_ORIGIN is required'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');

  throw new Error(`Environment validation failed: ${issues}`);
}

const rawEnv = parsedEnv.data;

export const env = {
  ...rawEnv,
  MONGODB_DNS_FALLBACK_SERVERS: rawEnv.MONGODB_DNS_FALLBACK_SERVERS?.split(',')
    .map((server) => server.trim())
    .filter(Boolean) ?? ['1.1.1.1', '8.8.8.8'],
  CORS_ORIGIN: rawEnv.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
} as const;
