-- Migration 037: Add RLS policies for consumable_returns
ALTER TABLE consumable_returns ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own returns
CREATE POLICY "Users can view their own consumable returns" ON consumable_returns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = consumable_returns.user_id AND auth_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can create consumable returns for themselves
CREATE POLICY "Users can insert their own consumable returns" ON consumable_returns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = user_id AND auth_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can manage all consumable returns
CREATE POLICY "Admins can manage all consumable returns" ON consumable_returns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );
