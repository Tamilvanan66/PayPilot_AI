import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../..');

function bool(v: string | undefined, fallback = false) {
  if (v === undefined || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isTest: process.env.NODE_ENV === 'test',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 5000),
  clientOrigin: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  mongoUri: process.env.MONGODB_URI?.trim() ?? '',

  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  cookieName: process.env.COOKIE_NAME ?? 'paypilot_token',
  cookieSecure: bool(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
  resetTtlMinutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 30),

  ai: {
    apiKey: process.env.AI_API_KEY?.trim() ?? '',
    baseUrl: (process.env.AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, ''),
    model: process.env.AI_MODEL ?? 'gpt-4o-mini',
  },

  paypal: {
    envName: (process.env.PAYPAL_ENV ?? 'sandbox') as 'sandbox' | 'live',
    clientId: process.env.PAYPAL_CLIENT_ID?.trim() ?? '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET?.trim() ?? '',
    webhookId: process.env.PAYPAL_WEBHOOK_ID?.trim() ?? '',
    publicApiUrl: (process.env.PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/+$/, ''),
    currency: (process.env.PAYPAL_CURRENCY ?? 'USD').toUpperCase(),
  },

  upload: {
    dir: path.isAbsolute(process.env.UPLOAD_DIR ?? '')
      ? (process.env.UPLOAD_DIR as string)
      : path.resolve(serverRoot, process.env.UPLOAD_DIR ?? 'uploads'),
    maxMb: Number(process.env.MAX_UPLOAD_MB ?? 5),
  },
};

export const paypalConfigured = () =>
  Boolean(env.paypal.clientId && env.paypal.clientSecret);
export const aiConfigured = () => Boolean(env.ai.apiKey);
