import { relations } from 'drizzle-orm';
import {
  users,
  accounts,
  sessions,
  apps,
  appVersions,
  appCategories,
  appCategoryMappings,
  developers,
  installations,
  apiRoutes
} from './index';

// User relations
export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  installations: many(installations),
  developer: one(developers, {
    fields: [users.id],
    references: [developers.userId],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Developer relations
export const developersRelations = relations(developers, ({ one, many }) => ({
  user: one(users, {
    fields: [developers.userId],
    references: [users.id],
  }),
  apps: many(apps),
}));

// App relations
export const appsRelations = relations(apps, ({ one, many }) => ({
  developer: one(developers, {
    fields: [apps.developerId],
    references: [developers.id],
  }),
  versions: many(appVersions),
  installations: many(installations),
  categoryMappings: many(appCategoryMappings),
  apiRoutes: many(apiRoutes),
}));

export const appVersionsRelations = relations(appVersions, ({ one }) => ({
  app: one(apps, {
    fields: [appVersions.appId],
    references: [apps.id],
  }),
}));

// Category relations
export const appCategoriesRelations = relations(appCategories, ({ many }) => ({
  appMappings: many(appCategoryMappings),
}));

export const appCategoryMappingsRelations = relations(appCategoryMappings, ({ one }) => ({
  app: one(apps, {
    fields: [appCategoryMappings.appId],
    references: [apps.id],
  }),
  category: one(appCategories, {
    fields: [appCategoryMappings.categoryId],
    references: [appCategories.id],
  }),
}));

// Installation relations
export const installationsRelations = relations(installations, ({ one }) => ({
  app: one(apps, {
    fields: [installations.appId],
    references: [apps.id],
  }),
  user: one(users, {
    fields: [installations.userId],
    references: [users.id],
  }),
}));

// API Route relations
export const apiRoutesRelations = relations(apiRoutes, ({ one }) => ({
  app: one(apps, {
    fields: [apiRoutes.appId],
    references: [apps.id],
  }),
}));