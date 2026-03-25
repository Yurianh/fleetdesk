-- ============================================================
-- FleetDesk Collaboration Migration (idempotent)
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. org_members table (already exists — skip creation)

-- Drop policies before recreating (idempotent)
DROP POLICY IF EXISTS "org_owner_manage_members"  ON org_members;
DROP POLICY IF EXISTS "member_see_own_record"      ON org_members;
DROP POLICY IF EXISTS "member_activate_self"       ON org_members;

CREATE POLICY "org_owner_manage_members" ON org_members
  FOR ALL USING (org_id = auth.uid());

CREATE POLICY "member_see_own_record" ON org_members
  FOR SELECT USING (user_id = auth.uid());

-- Allow collaborator to activate their own pending invite
CREATE POLICY "member_activate_self" ON org_members
  FOR UPDATE USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- 2. activity_log table (already exists — skip creation)

DROP POLICY IF EXISTS "org_access_activity" ON activity_log;

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

-- 3. Fleet data RLS policies for org members
-- Drop first to avoid conflicts

DROP POLICY IF EXISTS "org_member_read_vehicles"  ON vehicles;
DROP POLICY IF EXISTS "org_member_write_vehicles" ON vehicles;
DROP POLICY IF EXISTS "org_member_read_drivers"   ON drivers;
DROP POLICY IF EXISTS "org_member_write_drivers"  ON drivers;
DROP POLICY IF EXISTS "org_member_read_assignments"  ON assignments;
DROP POLICY IF EXISTS "org_member_write_assignments" ON assignments;
DROP POLICY IF EXISTS "org_member_read_mileage"   ON mileage_entries;
DROP POLICY IF EXISTS "org_member_write_mileage"  ON mileage_entries;
DROP POLICY IF EXISTS "org_member_read_maintenance"  ON maintenance_records;
DROP POLICY IF EXISTS "org_member_write_maintenance" ON maintenance_records;
DROP POLICY IF EXISTS "org_member_read_inspections"  ON technical_inspections;
DROP POLICY IF EXISTS "org_member_write_inspections" ON technical_inspections;
DROP POLICY IF EXISTS "org_member_read_washes"    ON wash_records;
DROP POLICY IF EXISTS "org_member_write_washes"   ON wash_records;
DROP POLICY IF EXISTS "org_member_read_schedules" ON maintenance_schedules;
DROP POLICY IF EXISTS "org_member_write_schedules" ON maintenance_schedules;

CREATE POLICY "org_member_read_vehicles" ON vehicles
  FOR SELECT USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "org_member_write_vehicles" ON vehicles
  FOR ALL USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "org_member_read_drivers" ON drivers
  FOR SELECT USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "org_member_write_drivers" ON drivers
  FOR ALL USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "org_member_read_assignments" ON assignments
  FOR SELECT USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "org_member_write_assignments" ON assignments
  FOR ALL USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "org_member_read_mileage" ON mileage_entries
  FOR SELECT USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "org_member_write_mileage" ON mileage_entries
  FOR ALL USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "org_member_read_maintenance" ON maintenance_records
  FOR SELECT USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "org_member_write_maintenance" ON maintenance_records
  FOR ALL USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "org_member_read_inspections" ON technical_inspections
  FOR SELECT USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "org_member_write_inspections" ON technical_inspections
  FOR ALL USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "org_member_read_washes" ON wash_records
  FOR SELECT USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "org_member_write_washes" ON wash_records
  FOR ALL USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "org_member_read_schedules" ON maintenance_schedules
  FOR SELECT USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));
CREATE POLICY "org_member_write_schedules" ON maintenance_schedules
  FOR ALL USING (user_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'));
