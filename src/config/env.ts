import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().trim().min(1).default('/api/v1'),
  MONGODB_URI: z.string().trim().min(1, 'MONGODB_URI is required'),
  MONGODB_DNS_FALLBACK_SERVERS: z.string().trim().optional(),
  JWT_SECRET: z.string().trim().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().trim().min(1).default('1d'),
  ADMIN_SEED_EMAIL: z.string().trim().email().default('quantumerrors@gmail.com'),
  ADMIN_SEED_PASSWORD: z.string().trim().min(1).default('admin@123'),
  ACCESS_REQUEST_NOTIFICATION_EMAILS: z.string().trim().optional(),
  AWS_REGION: z.string().trim().min(1, 'AWS_REGION is required'),
  AWS_ACCESS_KEY_ID: z.string().trim().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().trim().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_S3_BUCKET: z.string().trim().min(1, 'AWS_S3_BUCKET is required'),
  RESEND_API_KEY: z.string().trim().optional(),
  RESEND_FROM_EMAIL: z.string().trim().optional(),
  WEBSITE_BASE_URL: z.string().trim().default('http://localhost:5173'),
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
  ACCESS_REQUEST_NOTIFICATION_EMAILS: rawEnv.ACCESS_REQUEST_NOTIFICATION_EMAILS?.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean) ?? [],
  MONGODB_DNS_FALLBACK_SERVERS: rawEnv.MONGODB_DNS_FALLBACK_SERVERS?.split(',')
    .map((server) => server.trim())
    .filter(Boolean) ?? ['1.1.1.1', '8.8.8.8'],
} as const;
