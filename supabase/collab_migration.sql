-- ============================================================
-- FleetDesk Collaboration Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. org_members table
CREATE TABLE IF NOT EXISTS org_members (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id      UUID        NOT NULL,
  user_id     UUID,
  email       TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  joined_at   TIMESTAMPTZ,
  UNIQUE(org_id, email)
);

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_owner_manage_members" ON org_members
  FOR ALL USING (org_id = auth.uid());

CREATE POLICY "member_see_own_record" ON org_members
  FOR SELECT USING (user_id = auth.uid());

-- 2. activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id       UUID        NOT NULL,
  user_id      UUID        NOT NULL,
  user_name    TEXT,
  action       TEXT        NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  entity_label TEXT,
  metadata     JSONB       DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_access_activity" ON activity_log
  FOR ALL USING (
    org_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = activity_log.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.status = 'active'
    )
  );

-- 3. RLS policies so org members can access the owner's fleet data
-- (These add to existing user-level policies)

CREATE POLICY "org_member_read_vehicles" ON vehicles
  FOR SELECT USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY "org_member_write_vehicles" ON vehicles
  FOR ALL USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "org_member_read_drivers" ON drivers
  FOR SELECT USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY "org_member_write_drivers" ON drivers
  FOR ALL USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "org_member_read_assignments" ON assignments
  FOR SELECT USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY "org_member_write_assignments" ON assignments
  FOR ALL USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "org_member_read_mileage" ON mileage_entries
  FOR SELECT USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY "org_member_write_mileage" ON mileage_entries
  FOR ALL USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "org_member_read_maintenance" ON maintenance_records
  FOR SELECT USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY "org_member_write_maintenance" ON maintenance_records
  FOR ALL USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "org_member_read_inspections" ON technical_inspections
  FOR SELECT USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY "org_member_write_inspections" ON technical_inspections
  FOR ALL USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "org_member_read_washes" ON wash_records
  FOR SELECT USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY "org_member_write_washes" ON wash_records
  FOR ALL USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "org_member_read_schedules" ON maintenance_schedules
  FOR SELECT USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY "org_member_write_schedules" ON maintenance_schedules
  FOR ALL USING (
    user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active')
  );
