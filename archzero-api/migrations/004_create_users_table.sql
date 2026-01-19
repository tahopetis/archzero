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
-- All users use password: changeme123
-- Bcrypt hash: $2b$12$SGW95NLHMSGnRnR.PQ6l7OQlDZkvp/zK3JkTGy1AH2KoSFmUA7AOG

-- admin@archzero.local / changeme123
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    '01234567-89ab-cdef-0123-456789abcdef',
    'admin@archzero.local',
    '$2b$12$SGW95NLHMSGnRnR.PQ6l7OQlDZkvp/zK3JkTGy1AH2KoSFmUA7AOG',
    'System Administrator',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- architect@archzero.local / changeme123
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    '12345678-9abc-def0-1234-56789abcdef0',
    'architect@archzero.local',
    '$2b$12$SGW95NLHMSGnRnR.PQ6l7OQlDZkvp/zK3JkTGy1AH2KoSFmUA7AOG',
    'Enterprise Architect',
    'architect'
) ON CONFLICT (email) DO NOTHING;

-- editor@archzero.local / changeme123
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    '23456789-abcd-ef01-2345-6789abcdef01',
    'editor@archzero.local',
    '$2b$12$SGW95NLHMSGnRnR.PQ6l7OQlDZkvp/zK3JkTGy1AH2KoSFmUA7AOG',
    'Content Editor',
    'editor'
) ON CONFLICT (email) DO NOTHING;

-- viewer@archzero.local / changeme123
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    '34567890-bcde-f012-3456-789abcdef12',
    'viewer@archzero.local',
    '$2b$12$SGW95NLHMSGnRnR.PQ6l7OQlDZkvp/zK3JkTGy1AH2KoSFmUA7AOG',
    'Read-only Viewer',
    'viewer'
) ON CONFLICT (email) DO NOTHING;

-- editor1@archzero.local / changeme123 (for concurrent editing tests)
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    '45678901-cdef-0123-4567-89abcdef1234',
    'editor1@archzero.local',
    '$2b$12$SGW95NLHMSGnRnR.PQ6l7OQlDZkvp/zK3JkTGy1AH2KoSFmUA7AOG',
    'Content Editor 1',
    'editor'
) ON CONFLICT (email) DO NOTHING;

-- editor2@archzero.local / changeme123 (for concurrent editing tests)
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    '56789012-def0-1234-5678-9abcdef12345',
    'editor2@archzero.local',
    '$2b$12$SGW95NLHMSGnRnR.PQ6l7OQlDZkvp/zK3JkTGy1AH2KoSFmUA7AOG',
    'Content Editor 2',
    'editor'
) ON CONFLICT (email) DO NOTHING;

-- auditor@archzero.local / changeme123
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    '67890123-ef01-2345-6789-abcdef123456',
    'auditor@archzero.local',
    '$2b$12$SGW95NLHMSGnRnR.PQ6l7OQlDZkvp/zK3JkTGy1AH2KoSFmUA7AOG',
    'Compliance Auditor',
    'viewer'
) ON CONFLICT (email) DO NOTHING;
