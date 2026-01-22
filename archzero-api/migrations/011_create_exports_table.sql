-- Exports table for tracking export history
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type VARCHAR(50) NOT NULL, -- 'cards', 'relationships', 'principles', 'standards', 'policies', 'risks'
  format VARCHAR(10) NOT NULL, -- 'csv', 'excel', 'json'
  status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'InProgress', 'Completed', 'Failed'
  file_path TEXT, -- Path to exported file
  file_url TEXT, -- URL for downloading the file
  filters JSONB, -- Export filters used
  error_message TEXT, -- Error details if export failed
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_exports_created_by ON exports(created_by);
CREATE INDEX IF NOT EXISTS idx_exports_status ON exports(status);
CREATE INDEX IF NOT EXISTS idx_exports_type ON exports(export_type);
CREATE INDEX IF NOT EXISTS idx_exports_created_at ON exports(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE exports IS 'Export history tracking for all data exports';
COMMENT ON COLUMN exports.export_type IS 'Type of data exported: cards, relationships, principles, standards, policies, risks';
COMMENT ON COLUMN exports.format IS 'Export file format: csv, excel, json';
COMMENT ON COLUMN exports.status IS 'Export status: Pending, InProgress, Completed, Failed';
COMMENT ON COLUMN exports.filters IS 'JSONB filters applied to export (card_type, lifecycle_state, domain, date range)';
COMMENT ON COLUMN exports.file_path IS 'Local filesystem path to exported file';
COMMENT ON COLUMN exports.file_url IS 'URL for downloading the exported file';
COMMENT ON COLUMN exports.error_message IS 'Error details if export failed';
