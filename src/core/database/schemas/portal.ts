import { pgTable, text, timestamp, jsonb, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { user } from './better-auth';
import { apps } from './apps';
import { teams } from './teams';

// Portal access level enum
export const portalAccessLevelEnum = pgEnum('portal_access_level', [
  'admin',    // Full platform access
  'manager',  // Team management + apps
  'user',     // Basic app access
  'viewer',   // Read-only access
]);

// Portal preferences for each user
export const portalPreferences = pgTable('portal_preferences', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }).unique(),
  theme: text('theme').notNull().default('system'), // light, dark, system
  sidebarCollapsed: boolean('sidebar_collapsed').notNull().default(false),
  favoriteApps: jsonb('favorite_apps').notNull().default('[]'), // Array of app IDs
  defaultView: text('default_view').notNull().default('dashboard'), // dashboard, apps, team
  navigationOrder: jsonb('navigation_order').notNull().default('[]'), // Custom nav order
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// App permissions - who can access which apps
export const appPermissions = pgTable('app_permissions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  accessLevel: portalAccessLevelEnum('access_level').notNull().default('viewer'),
  permissions: jsonb('permissions').notNull().default('{}'), // App-specific permissions
  grantedBy: text('granted_by').notNull().references(() => user.id),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Portal navigation items - platform features available in portal
export const portalNavigation = pgTable('portal_navigation', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  icon: text('icon'), // Icon name from lucide-react
  path: text('path').notNull(),
  category: text('category').notNull(), // platform, apps, team, settings
  requiredPermission: text('required_permission'), // Permission needed to view
  parent: text('parent'), // For nested navigation
  order: text('order').notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata').notNull().default('{}'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// App usage tracking for portal
export const appUsageTracking = pgTable('app_usage_tracking', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
  lastAccessedAt: timestamp('last_accessed_at').notNull().defaultNow(),
  accessCount: text('access_count').notNull().default('1'),
  totalTimeSpent: text('total_time_spent').notNull().default('0'), // in seconds
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Portal announcements/notifications
export const portalAnnouncements = pgTable('portal_announcements', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull().default('info'), // info, warning, success, error
  targetUsers: jsonb('target_users').notNull().default('[]'), // Specific user IDs or 'all'
  targetTeams: jsonb('target_teams').notNull().default('[]'), // Specific team IDs
  targetRoles: jsonb('target_roles').notNull().default('[]'), // Target specific roles
  isActive: boolean('is_active').notNull().default(true),
  priority: text('priority').notNull().default('normal'), // low, normal, high, urgent
  expiresAt: timestamp('expires_at'),
  createdBy: text('created_by').notNull().references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// User portal sessions for activity tracking
export const portalSessions = pgTable('portal_sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type PortalPreferences = typeof portalPreferences.$inferSelect;
export type NewPortalPreferences = typeof portalPreferences.$inferInsert;
export type AppPermission = typeof appPermissions.$inferSelect;
export type NewAppPermission = typeof appPermissions.$inferInsert;
export type PortalNavigation = typeof portalNavigation.$inferSelect;
export type NewPortalNavigation = typeof portalNavigation.$inferInsert;
export type AppUsageTracking = typeof appUsageTracking.$inferSelect;
export type NewAppUsageTracking = typeof appUsageTracking.$inferInsert;
export type PortalAnnouncement = typeof portalAnnouncements.$inferSelect;
export type NewPortalAnnouncement = typeof portalAnnouncements.$inferInsert;
export type PortalSession = typeof portalSessions.$inferSelect;
export type NewPortalSession = typeof portalSessions.$inferInsert;