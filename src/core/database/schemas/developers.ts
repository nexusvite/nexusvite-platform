import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';

export const developers = pgTable('developers', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  website: text('website'),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Developer = typeof developers.$inferSelect;
export type NewDeveloper = typeof developers.$inferInsert;