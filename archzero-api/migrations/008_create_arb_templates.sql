-- ARB Templates table for saving and reusing ARB submissions
CREATE TABLE IF NOT EXISTS arb_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  request_type VARCHAR(50) NOT NULL, -- 'application', 'major_change', 'exception'
  card_id UUID,
  template_data JSONB NOT NULL, -- Stores form fields, rationale, etc.
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_arb_templates_type ON arb_templates(request_type);
CREATE INDEX IF NOT EXISTS idx_arb_templates_created_by ON arb_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_arb_templates_card_id ON arb_templates(card_id);

-- Add comment for documentation
COMMENT ON TABLE arb_templates IS 'Templates for ARB submissions to enable reuse';
COMMENT ON COLUMN arb_templates.template_data IS 'JSONB data containing submission fields, rationale, impact areas, etc.';
