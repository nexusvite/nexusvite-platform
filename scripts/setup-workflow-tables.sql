-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  canvas_state JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT false,
  trigger_type TEXT,
  schedule TEXT,
  webhook_path TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create workflow nodes table
CREATE TABLE IF NOT EXISTS workflow_nodes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  type TEXT NOT NULL,
  sub_type TEXT NOT NULL,
  label TEXT NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  config JSONB DEFAULT '{}',
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workflow_id, node_id)
);

-- Create workflow connections table
CREATE TABLE IF NOT EXISTS workflow_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  source_handle TEXT,
  target_handle TEXT,
  label TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workflow_id, connection_id)
);

-- Create workflow executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  trigger_data JSONB DEFAULT '{}',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration INTEGER,
  error TEXT,
  logs JSONB DEFAULT '[]',
  node_executions JSONB DEFAULT '{}'
);

-- Create workflow templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  template_data JSONB NOT NULL,
  tags JSONB DEFAULT '[]',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create node templates table
CREATE TABLE IF NOT EXISTS node_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  sub_type TEXT NOT NULL,
  icon TEXT,
  default_config JSONB DEFAULT '{}',
  input_schema JSONB DEFAULT '{}',
  output_schema JSONB DEFAULT '{}',
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(active);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_connections_workflow_id ON workflow_connections(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_node_templates_type ON node_templates(type);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON workflows
FOR EACH ROW EXECUTE FUNCTION update_workflows_updated_at();

DROP TRIGGER IF EXISTS update_workflow_templates_updated_at ON workflow_templates;
CREATE TRIGGER update_workflow_templates_updated_at
BEFORE UPDATE ON workflow_templates
FOR EACH ROW EXECUTE FUNCTION update_workflows_updated_at();

-- Insert sample node templates
INSERT INTO node_templates (name, type, sub_type, icon, default_config, category) VALUES
-- Trigger nodes
('Manual Trigger', 'trigger', 'manual', 'Play', '{}', 'triggers'),
('Webhook', 'trigger', 'webhook', 'Webhook', '{"method": "POST", "authentication": "none"}', 'triggers'),
('Schedule', 'trigger', 'schedule', 'Clock', '{"cron": "0 0 * * *", "timezone": "UTC"}', 'triggers'),
('Email Received', 'trigger', 'email', 'Mail', '{"mailbox": "inbox"}', 'triggers'),

-- Action nodes
('HTTP Request', 'action', 'http', 'Globe', '{"method": "GET", "headers": {}, "timeout": 30000}', 'actions'),
('Database Query', 'action', 'database', 'Database', '{"operation": "select"}', 'actions'),
('Send Email', 'action', 'email', 'Send', '{"from": "", "subject": "", "body": ""}', 'actions'),
('Slack Message', 'action', 'slack', 'MessageSquare', '{"channel": "", "message": ""}', 'actions'),
('Create Entity', 'action', 'entity', 'Plus', '{"entityName": "", "data": {}}', 'actions'),

-- Logic nodes
('If/Else', 'logic', 'condition', 'GitBranch', '{"condition": "", "operator": "equals"}', 'logic'),
('Switch', 'logic', 'switch', 'GitPullRequest', '{"cases": []}', 'logic'),
('Loop', 'logic', 'loop', 'Repeat', '{"loopType": "forEach", "items": []}', 'logic'),
('Delay', 'logic', 'delay', 'Timer', '{"duration": 1000, "unit": "ms"}', 'logic'),

-- Transform nodes
('Set Variable', 'transform', 'set', 'Variable', '{"variables": {}}', 'transform'),
('Code', 'transform', 'code', 'Code', '{"language": "javascript", "code": ""}', 'transform'),
('Merge Data', 'transform', 'merge', 'GitMerge', '{"mergeStrategy": "combine"}', 'transform'),
('Filter', 'transform', 'filter', 'Filter', '{"filterExpression": ""}', 'transform')
ON CONFLICT DO NOTHING;

-- Insert sample workflow templates
INSERT INTO workflow_templates (name, description, category, template_data, featured, tags) VALUES
('Welcome Email Automation', 'Send welcome emails to new users', 'marketing',
 '{"nodes": [{"id": "trigger1", "type": "trigger", "data": {"label": "New User Signup"}}, {"id": "action1", "type": "action", "data": {"label": "Send Welcome Email"}}], "edges": [{"id": "e1", "source": "trigger1", "target": "action1"}]}',
 true, '["email", "onboarding", "automation"]'),

('Daily Data Backup', 'Backup database data to cloud storage daily', 'maintenance',
 '{"nodes": [{"id": "trigger1", "type": "trigger", "data": {"label": "Daily at 2 AM"}}, {"id": "action1", "type": "action", "data": {"label": "Export Database"}}, {"id": "action2", "type": "action", "data": {"label": "Upload to S3"}}], "edges": [{"id": "e1", "source": "trigger1", "target": "action1"}, {"id": "e2", "source": "action1", "target": "action2"}]}',
 true, '["backup", "database", "schedule"]'),

('Slack Notifications', 'Send Slack notifications for important events', 'communication',
 '{"nodes": [{"id": "trigger1", "type": "trigger", "data": {"label": "Webhook Event"}}, {"id": "logic1", "type": "logic", "data": {"label": "Check Priority"}}, {"id": "action1", "type": "action", "data": {"label": "Send to Slack"}}], "edges": [{"id": "e1", "source": "trigger1", "target": "logic1"}, {"id": "e2", "source": "logic1", "target": "action1"}]}',
 false, '["slack", "notifications", "webhook"]')
ON CONFLICT DO NOTHING;