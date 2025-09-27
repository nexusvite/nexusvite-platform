-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  key TEXT NOT NULL UNIQUE,
  hashed_key TEXT,
  prefix TEXT NOT NULL,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  scopes JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create API key usage tracking table
CREATE TABLE IF NOT EXISTS api_key_usage (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id TEXT NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code TEXT,
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_api_key_id ON api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_timestamp ON api_key_usage(timestamp DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON api_keys
FOR EACH ROW EXECUTE FUNCTION update_api_keys_updated_at();