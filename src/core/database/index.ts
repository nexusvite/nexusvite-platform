import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '@/core/config';
import * as schema from './schemas';

// Create the connection
const connectionString = config.database.url;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, {
  prepare: false,
  max: 20,
  idle_timeout: 30,
  connect_timeout: 30
});

// Create drizzle instance
export const db = drizzle(client, { schema });

export * from './schemas';
export type { DatabaseConfig } from '@/core/types';

// Connection test helper
export async function testConnection() {
  try {
    const result = await client`SELECT 1 as test`;
    return result.length === 1 && result[0]?.test === 1;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnection() {
  await client.end();
}