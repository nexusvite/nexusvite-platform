import { pgTable, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { apps } from './apps';

export const apiRoutes = pgTable('api_routes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  path: text('path').notNull(),
  method: text('method').notNull(),
  appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
  handler: text('handler').notNull(),
  middleware: jsonb('middleware').notNull().default('[]'),
  rateLimitRequests: integer('rate_limit_requests'),
  rateLimitWindowMs: integer('rate_limit_window_ms'),
  rateLimitMessage: text('rate_limit_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type APIRoute = typeof apiRoutes.$inferSelect;
export type NewAPIRoute = typeof apiRoutes.$inferInsert;