import { pgTable, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const integrations = pgTable('integrations', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  name: text('name').notNull(),
  description: text('description'),
  provider: text('provider').notNull(), // e.g., "github", "slack", "stripe"
  category: text('category').notNull(), // e.g., "version-control", "communication", "payment"
  logo: text('logo'), // URL to logo image
  status: text('status').notNull().default('disconnected'), // connected, disconnected, error
  config: jsonb('config').default({}), // integration-specific configuration
  credentials: jsonb('credentials').default({}), // encrypted credentials
  webhookUrl: text('webhook_url'),
  lastSyncAt: timestamp('last_sync_at'),
  active: boolean('active').default(true),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const integrationLogs = pgTable('integration_logs', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  integrationId: text('integration_id').notNull().references(() => integrations.id, { onDelete: 'cascade' }),
  event: text('event').notNull(), // e.g., "sync", "webhook_received", "auth_refresh"
  status: text('status').notNull(), // success, error, warning
  message: text('message'),
  metadata: jsonb('metadata').default({}),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Available integrations catalog
export const integrationProviders = pgTable('integration_providers', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  slug: text('slug').notNull().unique(), // e.g., "github", "slack"
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  logo: text('logo'),
  authType: text('auth_type').notNull(), // oauth2, api_key, webhook
  configSchema: jsonb('config_schema').notNull(), // JSON schema for configuration
  features: jsonb('features').default([]),
  documentation: text('documentation'),
  available: boolean('available').default(true),
  beta: boolean('beta').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Zod schemas
export const selectIntegrationSchema = createSelectSchema(integrations);
export const insertIntegrationSchema = createInsertSchema(integrations);
export const selectIntegrationLogSchema = createSelectSchema(integrationLogs);
export const selectIntegrationProviderSchema = createSelectSchema(integrationProviders);

export type Integration = z.infer<typeof selectIntegrationSchema>;
export type NewIntegration = z.infer<typeof insertIntegrationSchema>;
export type IntegrationLog = z.infer<typeof selectIntegrationLogSchema>;
export type IntegrationProvider = z.infer<typeof selectIntegrationProviderSchema>;