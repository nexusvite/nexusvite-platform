-- PostgreSQL Extensions for NexusVite Platform
-- This file is automatically executed when the PostgreSQL container is initialized

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable trigram similarity searching
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable vector similarity search (for AI/ML features)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Optional: Enable additional useful extensions
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- For text search without accents
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For GIN indexes on btree-indexable types
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For GiST indexes on btree-indexable types

-- Create indexes for better performance
-- Note: These will be created after tables are created by Drizzle migrations

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL extensions initialized successfully for NexusVite Platform';
END $$;