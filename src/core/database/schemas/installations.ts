import { pgTable, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';
import { apps } from './apps';

export const installationStatusEnum = pgEnum('installation_status', ['active', 'inactive']);

export const installations = pgTable('installations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  settings: jsonb('settings').notNull().default('{}'),
  status: installationStatusEnum('status').notNull().default('active'),
  installedAt: timestamp('installed_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Installation = typeof installations.$inferSelect;
export type NewInstallation = typeof installations.$inferInsert;