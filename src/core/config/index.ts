// Core configuration for NexusVite Platform

export const config = {
  // Application settings
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'NexusVite Platform',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    description: 'Distributed Apps Platform',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6100',
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL!,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'nexusvite_platform',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  },

  // Authentication configuration
  auth: {
    secret: process.env.AUTH_SECRET!,
    baseUrl: process.env.AUTH_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6100',
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    },
  },

  // API Gateway configuration
  api: {
    prefix: '/api',
    version: 'v1',
    rateLimit: {
      requests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
  },

  // App Store configuration
  apps: {
    manifestVersion: '1.0',
    allowedPermissions: [
      'user:read',
      'user:write',
      'app:read',
      'app:write',
      'database:read',
      'database:write',
      'api:read',
      'api:write',
    ],
    maxAppSize: 50 * 1024 * 1024, // 50MB
    supportedFormats: ['zip', 'tar.gz'],
  },

  // Storage configuration
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    local: {
      uploadDir: process.env.UPLOAD_DIR || './uploads',
    },
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  },

  // Email configuration
  email: {
    provider: process.env.EMAIL_PROVIDER || 'console',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  },

  // Features flags
  features: {
    appStore: process.env.FEATURE_APP_STORE !== 'false',
    oauth: process.env.FEATURE_OAUTH !== 'false',
    analytics: process.env.FEATURE_ANALYTICS !== 'false',
    billing: process.env.FEATURE_BILLING === 'true',
  },

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

export type Config = typeof config;

// Validation helper
export function validateConfig() {
  const required = [
    'DATABASE_URL',
    'AUTH_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return true;
}

export default config;