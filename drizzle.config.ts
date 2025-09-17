import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './src/core/database/schemas/*',
  out: './src/core/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://dev_user:dev_password@localhost:5433/nexusvite_platform_dev',
  },
  verbose: true,
  strict: true,
});