import { pgTable, text, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { user } from './better-auth';
import { relations } from 'drizzle-orm';

// Enum for team member roles
export const teamRoleEnum = pgEnum('team_role', ['owner', 'admin', 'member', 'viewer']);

// Enum for invitation status
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'declined', 'expired']);

// Teams table
export const teams = pgTable('teams', {
  id: text('id').primaryKey().$defaultFn(() => `team_${Math.random().toString(36).substring(2, 15)}`),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // URL-friendly identifier
  description: text('description'),
  logo: text('logo'), // Team logo URL
  ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  settings: jsonb('settings').default({
    allowInvitations: true,
    requireApproval: false,
    maxMembers: null,
  }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// Team members junction table
export const teamMembers = pgTable('team_members', {
  id: text('id').primaryKey().$defaultFn(() => `member_${Math.random().toString(36).substring(2, 15)}`),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: teamRoleEnum('role').notNull().default('member'),
  permissions: jsonb('permissions').default({
    canInviteMembers: false,
    canRemoveMembers: false,
    canEditTeam: false,
    canManageApps: true,
    canViewBilling: false,
  }),
  joinedAt: timestamp('joined_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// Team invitations table
export const teamInvitations = pgTable('team_invitations', {
  id: text('id').primaryKey().$defaultFn(() => `invite_${Math.random().toString(36).substring(2, 15)}`),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: teamRoleEnum('role').notNull().default('member'),
  invitedBy: text('invited_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique().$defaultFn(() => Math.random().toString(36).substring(2, 32)),
  status: invitationStatusEnum('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull().$defaultFn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
  acceptedAt: timestamp('accepted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// Activity logs for teams
export const teamActivityLogs = pgTable('team_activity_logs', {
  id: text('id').primaryKey().$defaultFn(() => `log_${Math.random().toString(36).substring(2, 15)}`),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // e.g., 'member_added', 'member_removed', 'role_changed', 'settings_updated'
  targetUserId: text('target_user_id').references(() => user.id, { onDelete: 'set null' }),
  details: jsonb('details').default({}),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// Define relations
export const teamsRelations = relations(teams, ({ many, one }) => ({
  owner: one(user, {
    fields: [teams.ownerId],
    references: [user.id],
  }),
  members: many(teamMembers),
  invitations: many(teamInvitations),
  activityLogs: many(teamActivityLogs),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(user, {
    fields: [teamMembers.userId],
    references: [user.id],
  }),
}));

export const teamInvitationsRelations = relations(teamInvitations, ({ one }) => ({
  team: one(teams, {
    fields: [teamInvitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(user, {
    fields: [teamInvitations.invitedBy],
    references: [user.id],
  }),
}));

export const teamActivityLogsRelations = relations(teamActivityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [teamActivityLogs.teamId],
    references: [teams.id],
  }),
  user: one(user, {
    fields: [teamActivityLogs.userId],
    references: [user.id],
  }),
  targetUser: one(user, {
    fields: [teamActivityLogs.targetUserId],
    references: [user.id],
  }),
}));