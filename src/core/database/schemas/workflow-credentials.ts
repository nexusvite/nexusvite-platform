import { pgTable, text, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const workflowCredentials = pgTable('workflow_credentials', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  type: text('type').notNull(), // smtp, database, api, oauth2, etc.
  description: text('description'),

  // Encrypted configuration data
  config: jsonb('config').notNull().default({}),

  // Metadata
  isGlobal: boolean('is_global').default(false), // Global vs user-specific
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Credential types configuration
export const credentialTypes = {
  smtp: {
    name: 'SMTP Email',
    icon: 'Mail',
    fields: [
      { key: 'host', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.gmail.com' },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 587 },
      { key: 'secure', label: 'Use TLS/SSL', type: 'boolean', default: true },
      { key: 'user', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'from', label: 'Default From Address', type: 'email', required: false },
    ]
  },
  postgresql: {
    name: 'PostgreSQL',
    icon: 'Database',
    fields: [
      { key: 'host', label: 'Host', type: 'text', required: true, placeholder: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 5432 },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'user', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'ssl', label: 'Use SSL', type: 'boolean', default: false },
    ]
  },
  mysql: {
    name: 'MySQL',
    icon: 'Database',
    fields: [
      { key: 'host', label: 'Host', type: 'text', required: true, placeholder: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 3306 },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'user', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
    ]
  },
  mongodb: {
    name: 'MongoDB',
    icon: 'Database',
    fields: [
      { key: 'connectionString', label: 'Connection String', type: 'text', required: true, placeholder: 'mongodb://localhost:27017/mydb' },
      { key: 'database', label: 'Database', type: 'text', required: false },
    ]
  },
  http_auth: {
    name: 'HTTP Authentication',
    icon: 'Globe',
    fields: [
      { key: 'authType', label: 'Auth Type', type: 'select', required: true, options: ['basic', 'bearer', 'apikey', 'oauth2'] },
      { key: 'username', label: 'Username', type: 'text', condition: 'authType:basic' },
      { key: 'password', label: 'Password', type: 'password', condition: 'authType:basic' },
      { key: 'token', label: 'Token', type: 'password', condition: 'authType:bearer' },
      { key: 'apiKey', label: 'API Key', type: 'password', condition: 'authType:apikey' },
      { key: 'headerName', label: 'Header Name', type: 'text', condition: 'authType:apikey', default: 'X-API-Key' },
    ]
  },
  openai: {
    name: 'OpenAI',
    icon: 'Zap',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'organization', label: 'Organization ID', type: 'text', required: false },
      { key: 'baseUrl', label: 'Base URL', type: 'text', required: false, placeholder: 'https://api.openai.com/v1' },
    ]
  },
  slack: {
    name: 'Slack',
    icon: 'MessageSquare',
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'text', required: false },
      { key: 'botToken', label: 'Bot Token', type: 'password', required: false },
      { key: 'channel', label: 'Default Channel', type: 'text', required: false, placeholder: '#general' },
    ]
  }
};

export type CredentialType = keyof typeof credentialTypes;
export type WorkflowCredential = typeof workflowCredentials.$inferSelect;
export type NewWorkflowCredential = typeof workflowCredentials.$inferInsert;