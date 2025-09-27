import { pgTable, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  name: text('name').notNull(),
  description: text('description'),
  key: text('key').notNull().unique(),
  hashedKey: text('hashed_key'),
  prefix: text('prefix').notNull(), // e.g., "nxv_"
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  scopes: jsonb('scopes').notNull().default([]), // permissions/scopes for the key
  metadata: jsonb('metadata').default({}),
  active: boolean('active').default(true),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const apiKeyUsage = pgTable('api_key_usage', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  apiKeyId: text('api_key_id').notNull().references(() => apiKeys.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  statusCode: text('status_code'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  requestId: text('request_id'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Zod schemas
export const selectApiKeySchema = createSelectSchema(apiKeys);
export const insertApiKeySchema = createInsertSchema(apiKeys);
export const selectApiKeyUsageSchema = createSelectSchema(apiKeyUsage);

export type ApiKey = z.infer<typeof selectApiKeySchema>;
export type NewApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKeyUsage = z.infer<typeof selectApiKeyUsageSchema>;