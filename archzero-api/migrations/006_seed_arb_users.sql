-- Seed ARB test users with appropriate roles
-- Password is 'changeme123' for all test users (hashed with bcrypt)

-- Insert arb-chair user (can approve ARB requests)
INSERT INTO users (id, email, full_name, role, password_hash, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'arb-chair@archzero.local',
  'ARB Chair',
  'arbchair',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9SjKEq7.1W', -- changeme123
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert arb-member user (can review but not approve)
INSERT INTO users (id, email, full_name, role, password_hash, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'arb-member@archzero.local',
  'ARB Member',
  'arbmember',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9SjKEq7.1W', -- changeme123
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Update viewer user role if exists
UPDATE users SET role = 'viewer' WHERE email = 'viewer@archzero.local';
