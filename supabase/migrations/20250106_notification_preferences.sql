-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loan_confirmation BOOLEAN DEFAULT true,
  return_confirmation BOOLEAN DEFAULT true,
  loan_reminder BOOLEAN DEFAULT true,
  overdue_notice BOOLEAN DEFAULT true,
  consumable_fulfilled BOOLEAN DEFAULT true,
  consumable_backorder BOOLEAN DEFAULT true,
  system_announcement BOOLEAN DEFAULT true,
  stock_alert BOOLEAN DEFAULT true,
  system_maintenance BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Insert default preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences);

-- Create trigger to auto-create preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_notification_preferences
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_preferences();

-- Add comment
COMMENT ON TABLE notification_preferences IS 'User notification preferences and settings';
