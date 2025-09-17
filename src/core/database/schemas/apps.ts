import { pgTable, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const appStatusEnum = pgEnum('app_status', ['active', 'inactive', 'pending', 'suspended']);

export const apps = pgTable('apps', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  version: text('version').notNull(),
  description: text('description').notNull(),
  author: text('author').notNull(),
  developerId: text('developer_id').notNull(),
  manifest: jsonb('manifest').notNull(),
  status: appStatusEnum('status').notNull().default('pending'),
  permissions: jsonb('permissions').notNull().default('[]'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const appVersions = pgTable('app_versions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
  version: text('version').notNull(),
  manifest: jsonb('manifest').notNull(),
  changelog: text('changelog'),
  downloadUrl: text('download_url'),
  fileSize: text('file_size'),
  checksum: text('checksum'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const appCategories = pgTable('app_categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const appCategoryMappings = pgTable('app_category_mappings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => appCategories.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type AppVersion = typeof appVersions.$inferSelect;
export type NewAppVersion = typeof appVersions.$inferInsert;
export type AppCategory = typeof appCategories.$inferSelect;
export type NewAppCategory = typeof appCategories.$inferInsert;