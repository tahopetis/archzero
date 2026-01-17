-- Drop existing role check constraint if it exists
DO $$ BEGIN
    DROP CONSTRAINT IF EXISTS users_role_check ON users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Add new check constraint with all valid roles including ARB roles
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'architect', 'editor', 'viewer', 'arbchair', 'arbmember'));
