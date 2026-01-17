-- ARB Audit Logs table for tracking all ARB-related events
CREATE TABLE IF NOT EXISTS arb_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'submission', 'meeting', 'template', 'decision'
  entity_id UUID NOT NULL, -- ID of the related entity
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed', 'decision_recorded', etc.
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_name VARCHAR(255) NOT NULL, -- Store name for history
  actor_role VARCHAR(50), -- 'admin', 'arbchair', 'arbmember', 'architect'
  changes JSONB, -- Store the actual changes made {field: {old, new}}
  metadata JSONB, -- Additional context
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_arb_audit_logs_entity ON arb_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_arb_audit_logs_actor ON arb_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_arb_audit_logs_action ON arb_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_arb_audit_logs_created_at ON arb_audit_logs(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE arb_audit_logs IS 'Audit trail for all ARB-related activities';
COMMENT ON COLUMN arb_audit_logs.changes IS 'JSONB storing field-level changes for update actions';
COMMENT ON COLUMN arb_audit_logs.metadata IS 'Additional context like meeting details, decision rationale, etc.';
