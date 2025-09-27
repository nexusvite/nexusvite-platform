-- Create developer_entities table if it doesn't exist
CREATE TABLE IF NOT EXISTS developer_entities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  table_name TEXT NOT NULL UNIQUE,
  description TEXT,
  fields JSONB NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create developer_entity_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS developer_entity_data (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id TEXT NOT NULL REFERENCES developer_entities(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_developer_entities_updated_at ON developer_entities;
CREATE TRIGGER update_developer_entities_updated_at
BEFORE UPDATE ON developer_entities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_developer_entity_data_updated_at ON developer_entity_data;
CREATE TRIGGER update_developer_entity_data_updated_at
BEFORE UPDATE ON developer_entity_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();