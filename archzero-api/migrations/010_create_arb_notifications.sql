-- ARB Notifications table for user notifications about ARB events
CREATE TABLE IF NOT EXISTS arb_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id),
  submission_id UUID,
  meeting_id UUID,
  notification_type VARCHAR(50) NOT NULL, -- 'submission_created', 'assigned', 'decision_recorded', 'meeting_scheduled'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_arb_notifications_recipient ON arb_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_arb_notifications_read ON arb_notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arb_notifications_submission ON arb_notifications(submission_id);
CREATE INDEX IF NOT EXISTS idx_arb_notifications_meeting ON arb_notifications(meeting_id);

-- Add comment for documentation
COMMENT ON TABLE arb_notifications IS 'User notifications for ARB events';
COMMENT ON COLUMN arb_notifications.action_url IS 'URL to navigate to related ARB item';
