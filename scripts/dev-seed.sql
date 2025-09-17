-- Development seed data for NexusVite Platform
-- This file is automatically executed in development environment

-- Log seed data initialization
DO $$
BEGIN
    RAISE NOTICE 'Development seed data initialized for NexusVite Platform';
    RAISE NOTICE 'Database: nexusvite_platform_dev';
    RAISE NOTICE 'Extensions available: uuid-ossp, pgcrypto, pg_trgm, vector';
END $$;

-- Example: Create development-specific data
-- Note: Actual seed data should be created through your Drizzle ORM seed scripts
-- This file is mainly for development environment setup and debugging