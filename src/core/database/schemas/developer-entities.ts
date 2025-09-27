import { pgTable, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const developerEntities = pgTable('developer_entities', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  tableName: text('table_name').notNull().unique(),
  description: text('description'),
  fields: jsonb('fields').notNull(),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const developerEntityData = pgTable('developer_entity_data', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  entityId: text('entity_id').notNull().references(() => developerEntities.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type DeveloperEntity = typeof developerEntities.$inferSelect;
export type NewDeveloperEntity = typeof developerEntities.$inferInsert;
export type DeveloperEntityData = typeof developerEntityData.$inferSelect;
export type NewDeveloperEntityData = typeof developerEntityData.$inferInsert;