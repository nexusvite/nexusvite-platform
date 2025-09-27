import { pgTable, text, boolean, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Main workflows table
export const workflows = pgTable('workflows', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  name: text('name').notNull(),
  description: text('description'),
  canvasState: jsonb('canvas_state').default({}), // React Flow state (nodes, edges, viewport)
  active: boolean('active').default(false),
  triggerType: text('trigger_type'), // webhook, schedule, manual, event
  schedule: text('schedule'), // cron expression if scheduled
  webhookPath: text('webhook_path'), // unique webhook path if webhook trigger
  settings: jsonb('settings').default({}),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Workflow nodes (individual steps)
export const workflowNodes = pgTable('workflow_nodes', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  nodeId: text('node_id').notNull(), // React Flow node ID
  type: text('type').notNull(), // trigger, action, logic, transform
  subType: text('sub_type').notNull(), // webhook, http, condition, etc.
  label: text('label').notNull(),
  positionX: integer('position_x').notNull(),
  positionY: integer('position_y').notNull(),
  config: jsonb('config').default({}), // Node-specific configuration
  inputs: jsonb('inputs').default({}), // Input handles configuration
  outputs: jsonb('outputs').default({}), // Output handles configuration
  createdAt: timestamp('created_at').defaultNow(),
});

// Workflow connections between nodes
export const workflowConnections = pgTable('workflow_connections', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  connectionId: text('connection_id').notNull(), // React Flow edge ID
  sourceNodeId: text('source_node_id').notNull(),
  targetNodeId: text('target_node_id').notNull(),
  sourceHandle: text('source_handle'),
  targetHandle: text('target_handle'),
  label: text('label'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Workflow executions (run history)
export const workflowExecutions = pgTable('workflow_executions', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // pending, running, success, failed
  triggerData: jsonb('trigger_data').default({}),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // milliseconds
  error: text('error'),
  logs: jsonb('logs').default([]),
  nodeExecutions: jsonb('node_executions').default({}), // Execution data per node
});

// Workflow templates
export const workflowTemplates = pgTable('workflow_templates', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(), // marketing, sales, productivity, etc.
  icon: text('icon'),
  templateData: jsonb('template_data').notNull(), // Complete workflow definition
  tags: jsonb('tags').default([]),
  featured: boolean('featured').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Node templates (reusable node configurations)
export const nodeTemplates = pgTable('node_templates', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  subType: text('sub_type').notNull(),
  icon: text('icon'),
  defaultConfig: jsonb('default_config').default({}),
  inputSchema: jsonb('input_schema').default({}),
  outputSchema: jsonb('output_schema').default({}),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Zod schemas
export const selectWorkflowSchema = createSelectSchema(workflows);
export const insertWorkflowSchema = createInsertSchema(workflows);
export const selectWorkflowNodeSchema = createSelectSchema(workflowNodes);
export const selectWorkflowConnectionSchema = createSelectSchema(workflowConnections);
export const selectWorkflowExecutionSchema = createSelectSchema(workflowExecutions);
export const selectWorkflowTemplateSchema = createSelectSchema(workflowTemplates);
export const selectNodeTemplateSchema = createSelectSchema(nodeTemplates);

export type Workflow = z.infer<typeof selectWorkflowSchema>;
export type NewWorkflow = z.infer<typeof insertWorkflowSchema>;
export type WorkflowNode = z.infer<typeof selectWorkflowNodeSchema>;
export type WorkflowConnection = z.infer<typeof selectWorkflowConnectionSchema>;
export type WorkflowExecution = z.infer<typeof selectWorkflowExecutionSchema>;
export type WorkflowTemplate = z.infer<typeof selectWorkflowTemplateSchema>;
export type NodeTemplate = z.infer<typeof selectNodeTemplateSchema>;