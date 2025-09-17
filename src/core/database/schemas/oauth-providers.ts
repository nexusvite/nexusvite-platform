import { pgTable, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const oauthProviders = pgTable('oauth_providers', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  clientId: text('client_id').notNull(),
  clientSecret: text('client_secret').notNull(),
  redirectUri: text('redirect_uri').notNull(),
  scopes: jsonb('scopes').notNull().default('[]'),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type OAuthProvider = typeof oauthProviders.$inferSelect;
export type NewOAuthProvider = typeof oauthProviders.$inferInsert;