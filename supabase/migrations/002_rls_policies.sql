-- Add auth_id column to link with Supabase auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id OR EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

-- Item types table policies (read-only for users, full access for admins)
CREATE POLICY "Anyone can view item types" ON item_types
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage item types" ON item_types
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

-- Tool instances table policies
CREATE POLICY "Anyone can view available tools" ON tool_instances
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage all tools" ON tool_instances
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

-- Consumable stock table policies
CREATE POLICY "Anyone can view consumable stock" ON consumable_stock
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage consumable stock" ON consumable_stock
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

-- Loans table policies
CREATE POLICY "Users can view their own loans" ON loans
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = loans.user_id AND auth_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create loans for themselves" ON loans
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = user_id AND auth_id = auth.uid()
  ));

CREATE POLICY "Users can update their own loans" ON loans
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM users WHERE id = loans.user_id AND auth_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage all loans" ON loans
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

-- Consumable requests table policies
CREATE POLICY "Users can view their own requests" ON consumable_requests
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = consumable_requests.user_id AND auth_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create requests for themselves" ON consumable_requests
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = user_id AND auth_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all requests" ON consumable_requests
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

-- Audit logs table policies (admin only)
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = notifications.user_id AND auth_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM users WHERE id = notifications.user_id AND auth_id = auth.uid()
  ));

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications" ON notifications
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));