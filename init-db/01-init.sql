-- FlowSet PostgreSQL Database Initialization Script
-- This script runs automatically when the container first starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- Example: Create a users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Example: Create an index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add your additional tables and initialization logic here

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO flowset_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO flowset_user;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully!';
END $$;
