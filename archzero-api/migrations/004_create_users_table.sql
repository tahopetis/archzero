-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'Viewer',
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on locked_until for account lockout queries
CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked_until) WHERE locked_until IS NOT NULL;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert test users (passwords are bcrypt hashes)
-- admin@archzero.local / changeme123
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    '01234567-89ab-cdef-0123-456789abcdef',
    'admin@archzero.local',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzW5qsqL3q',  -- changeme123
    'System Administrator',
    'Admin'
) ON CONFLICT (email) DO NOTHING;

-- architect@archzero.local / test123456
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    '12345678-9abc-def0-1234-56789abcdef0',
    'architect@archzero.local',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXe/PZ/Xc9zYFx1r6f3n7zWpLvU8cZqWUi',  -- test123456
    'Enterprise Architect',
    'Architect'
) ON CONFLICT (email) DO NOTHING;

-- editor@archzero.local / test123456
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    '23456789-abcd-ef01-2345-6789abcdef01',
    'editor@archzero.local',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXe/PZ/Xc9zYFx1r6f3n7zWpLvU8cZqWUi',  -- test123456
    'Content Editor',
    'Editor'
) ON CONFLICT (email) DO NOTHING;

-- viewer@archzero.local / test123456
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    '34567890-bcde-f012-3456-789abcdef12',
    'viewer@archzero.local',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXe/PZ/Xc9zYFx1r6f3n7zWpLvU8cZqWUi',  -- test123456
    'Read-only Viewer',
    'Viewer'
) ON CONFLICT (email) DO NOTHING;
