-- Scheduled exports table for recurring export jobs
CREATE TABLE IF NOT EXISTS scheduled_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  export_type VARCHAR(50) NOT NULL, -- 'cards', 'relationships', 'principles', 'standards', 'policies', 'risks'
  schedule VARCHAR(100) NOT NULL, -- JSON string: '{"Daily":{}}', '{"Weekly":{}}', '{"Monthly":{}}', '{"Cron":"0 9 * * 1"}'
  filters JSONB, -- Export filters (JSONB for flexibility)
  format VARCHAR(10) NOT NULL, -- 'csv', 'excel', 'json'
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_created_by ON scheduled_exports(created_by);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_is_active ON scheduled_exports(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_next_run_at ON scheduled_exports(next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_type ON scheduled_exports(export_type);

-- Add comments for documentation
COMMENT ON TABLE scheduled_exports IS 'Scheduled recurring export jobs with cron-like scheduling';
COMMENT ON COLUMN scheduled_exports.schedule IS 'Schedule as JSON string: Daily, Weekly, Monthly, or Cron expression';
COMMENT ON COLUMN scheduled_exports.filters IS 'JSONB filters applied to scheduled exports';
COMMENT ON COLUMN scheduled_exports.next_run_at IS 'Next scheduled execution time';
COMMENT ON COLUMN scheduled_exports.last_run_at IS 'Last execution time (null if never run)';
COMMENT ON COLUMN scheduled_exports.is_active IS 'Whether the scheduled export is active/paused';
