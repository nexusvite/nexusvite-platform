import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { workflows } from './workflows';
import { user as users } from './better-auth';

export const workflowExecutions = pgTable('workflow_executions', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  status: text('status', {
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled', 'paused'],
  }).notNull().default('pending'),

  startTime: timestamp('start_time').notNull().defaultNow(),
  endTime: timestamp('end_time'),

  inputs: jsonb('inputs').notNull().default({}),
  outputs: jsonb('outputs').notNull().default({}),

  error: text('error'),
  metadata: jsonb('metadata').notNull().default({}),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  workflowIdIdx: index('workflow_executions_workflow_id_idx').on(table.workflowId),
  userIdIdx: index('workflow_executions_user_id_idx').on(table.userId),
  statusIdx: index('workflow_executions_status_idx').on(table.status),
  startTimeIdx: index('workflow_executions_start_time_idx').on(table.startTime),
}));

export const workflowNodeLogs = pgTable('workflow_node_logs', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  executionId: text('execution_id').notNull().references(() => workflowExecutions.id, { onDelete: 'cascade' }),
  nodeId: text('node_id').notNull(),

  timestamp: timestamp('timestamp').notNull().defaultNow(),
  level: text('level', {
    enum: ['debug', 'info', 'warn', 'error'],
  }).notNull().default('info'),

  message: text('message').notNull(),
  data: jsonb('data'),

  executionTime: timestamp('execution_time'),
  nodeType: text('node_type'),
  nodeSubType: text('node_sub_type'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  executionIdIdx: index('workflow_node_logs_execution_id_idx').on(table.executionId),
  nodeIdIdx: index('workflow_node_logs_node_id_idx').on(table.nodeId),
  timestampIdx: index('workflow_node_logs_timestamp_idx').on(table.timestamp),
  levelIdx: index('workflow_node_logs_level_idx').on(table.level),
}));

export const workflowExecutionMetrics = pgTable('workflow_execution_metrics', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  executionId: text('execution_id').notNull().references(() => workflowExecutions.id, { onDelete: 'cascade' }),

  totalExecutionTime: text('total_execution_time'),
  nodeExecutionTimes: jsonb('node_execution_times').notNull().default({}),

  cpuUsage: jsonb('cpu_usage'),
  memoryUsage: jsonb('memory_usage'),

  inputSize: text('input_size'),
  outputSize: text('output_size'),

  errorCount: text('error_count').notNull().default('0'),
  retryCount: text('retry_count').notNull().default('0'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  workflowIdIdx: index('workflow_execution_metrics_workflow_id_idx').on(table.workflowId),
  executionIdIdx: index('workflow_execution_metrics_execution_id_idx').on(table.executionId),
}));

// Relations
export const workflowExecutionsRelations = relations(workflowExecutions, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [workflowExecutions.workflowId],
    references: [workflows.id],
  }),
  user: one(users, {
    fields: [workflowExecutions.userId],
    references: [users.id],
  }),
  logs: many(workflowNodeLogs),
  metrics: one(workflowExecutionMetrics),
}));

export const workflowNodeLogsRelations = relations(workflowNodeLogs, ({ one }) => ({
  execution: one(workflowExecutions, {
    fields: [workflowNodeLogs.executionId],
    references: [workflowExecutions.id],
  }),
}));

export const workflowExecutionMetricsRelations = relations(workflowExecutionMetrics, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowExecutionMetrics.workflowId],
    references: [workflows.id],
  }),
  execution: one(workflowExecutions, {
    fields: [workflowExecutionMetrics.executionId],
    references: [workflowExecutions.id],
  }),
}));

// Types
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;
export type WorkflowNodeLog = typeof workflowNodeLogs.$inferSelect;
export type NewWorkflowNodeLog = typeof workflowNodeLogs.$inferInsert;
export type WorkflowExecutionMetric = typeof workflowExecutionMetrics.$inferSelect;
export type NewWorkflowExecutionMetric = typeof workflowExecutionMetrics.$inferInsert;