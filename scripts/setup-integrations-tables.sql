-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL,
  category TEXT NOT NULL,
  logo TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  config JSONB DEFAULT '{}',
  credentials JSONB DEFAULT '{}',
  webhook_url TEXT,
  last_sync_at TIMESTAMP,
  active BOOLEAN DEFAULT true,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create integration logs table
CREATE TABLE IF NOT EXISTS integration_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create integration providers catalog table
CREATE TABLE IF NOT EXISTS integration_providers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  logo TEXT,
  auth_type TEXT NOT NULL,
  config_schema JSONB NOT NULL,
  features JSONB DEFAULT '[]',
  documentation TEXT,
  available BOOLEAN DEFAULT true,
  beta BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_timestamp ON integration_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_integration_providers_slug ON integration_providers(slug);
CREATE INDEX IF NOT EXISTS idx_integration_providers_category ON integration_providers(category);

-- Create trigger for updated_at on integrations
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
BEFORE UPDATE ON integrations
FOR EACH ROW EXECUTE FUNCTION update_integrations_updated_at();

-- Create trigger for updated_at on integration_providers
DROP TRIGGER IF EXISTS update_integration_providers_updated_at ON integration_providers;
CREATE TRIGGER update_integration_providers_updated_at
BEFORE UPDATE ON integration_providers
FOR EACH ROW EXECUTE FUNCTION update_integrations_updated_at();

-- Insert sample integration providers
INSERT INTO integration_providers (slug, name, description, category, auth_type, config_schema, features) VALUES
('github', 'GitHub', 'Connect your GitHub repositories for version control and CI/CD', 'version-control', 'oauth2',
 '{"type": "object", "properties": {"repo": {"type": "string"}, "branch": {"type": "string"}}}',
 '["repository_sync", "pull_requests", "issues", "actions", "webhooks"]'),

('slack', 'Slack', 'Send notifications and updates to Slack channels', 'communication', 'oauth2',
 '{"type": "object", "properties": {"channel": {"type": "string"}, "webhook_url": {"type": "string"}}}',
 '["notifications", "alerts", "commands", "interactive_messages"]'),

('stripe', 'Stripe', 'Process payments and manage subscriptions', 'payment', 'api_key',
 '{"type": "object", "properties": {"webhook_secret": {"type": "string"}, "currency": {"type": "string"}}}',
 '["payments", "subscriptions", "invoices", "webhooks", "refunds"]'),

('sendgrid', 'SendGrid', 'Send transactional and marketing emails', 'email', 'api_key',
 '{"type": "object", "properties": {"from_email": {"type": "string"}, "from_name": {"type": "string"}}}',
 '["transactional_email", "marketing_campaigns", "templates", "analytics"]'),

('google-analytics', 'Google Analytics', 'Track and analyze website traffic', 'analytics', 'oauth2',
 '{"type": "object", "properties": {"property_id": {"type": "string"}, "view_id": {"type": "string"}}}',
 '["traffic_analytics", "user_behavior", "conversion_tracking", "custom_events"]'),

('aws-s3', 'AWS S3', 'Store and manage files in Amazon S3', 'storage', 'api_key',
 '{"type": "object", "properties": {"bucket": {"type": "string"}, "region": {"type": "string"}}}',
 '["file_storage", "backups", "cdn", "versioning"]')
ON CONFLICT (slug) DO NOTHING;