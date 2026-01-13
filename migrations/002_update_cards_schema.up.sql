-- Update cards table to match Card model
-- Add lifecycle_phase enum column
ALTER TABLE cards ADD COLUMN IF NOT EXISTS lifecycle_phase VARCHAR(50) DEFAULT 'Discovery';

-- Add owner_id column
ALTER TABLE cards ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add status column
ALTER TABLE cards ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);

-- Create index on lifecycle_phase
CREATE INDEX IF NOT EXISTS idx_cards_lifecycle_phase ON cards(lifecycle_phase);
