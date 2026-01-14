-- Add account lockout columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE NULL;

-- Create index on locked_until for account lockout queries
CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked_until) WHERE locked_until IS NOT NULL;

-- Insert/update test users with correct bcrypt hashes
-- Password hashes generated with bcrypt cost 12
-- admin@archzero.local / changeme123
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'admin@archzero.local',
    '$2b$12$SGW95NLHMSGnRnR.PQ6l7OQlDZkvp/zK3JkTGy1AH2KoSFmUA7AOG',
    'System Administrator',
    'admin'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- architect@archzero.local / test123456
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'architect@archzero.local',
    '$2b$12$7yTADQNjjCixcbkfZIzuw.16kynQQjFzQ2EanR5y6lGRrIJmKLp96',
    'Enterprise Architect',
    'architect'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- editor@archzero.local / test123456
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'editor@archzero.local',
    '$2b$12$KDThUYvSu9QXB9Yi0hUkheNqxsJ1bIFHhPjm59Q9jgaC0ahXoixtC',
    'Content Editor',
    'editor'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- viewer@archzero.local / test123456
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'viewer@archzero.local',
    '$2b$12$.yvS..KMuuPi1dC/cpWFd.O97g2TjWn7nxY6jwDYMXG6/uRkzGev6',
    'Read-only Viewer',
    'viewer'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
