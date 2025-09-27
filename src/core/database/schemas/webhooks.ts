import { pgTable, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const webhooks = pgTable('webhooks', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  secret: text('secret'),
  events: jsonb('events').notNull().$type<string[]>(),
  headers: jsonb('headers').$type<Record<string, string>>(),
  active: boolean('active').default(true),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const webhookLogs = pgTable('webhook_logs', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  webhookId: text('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),
  event: text('event').notNull(),
  status: text('status').notNull(), // 'success', 'failed', 'pending'
  statusCode: text('status_code'),
  request: jsonb('request').notNull(),
  response: jsonb('response'),
  error: text('error'),
  duration: text('duration'), // in ms
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type NewWebhookLog = typeof webhookLogs.$inferInsert;

export const insertWebhookSchema = createInsertSchema(webhooks);
export const selectWebhookSchema = createSelectSchema(webhooks);
export const insertWebhookLogSchema = createInsertSchema(webhookLogs);
export const selectWebhookLogSchema = createSelectSchema(webhookLogs);