-- ============================================================
-- FleetDesk Driver Documents Migration (idempotent)
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add date_of_birth to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2. Create driver_documents table
CREATE TABLE IF NOT EXISTS driver_documents (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id       UUID NOT NULL,
  org_id          UUID NOT NULL,
  type            TEXT NOT NULL,
  validation_date DATE,
  expiry_date     DATE,
  file_url        TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies

DROP POLICY IF EXISTS "driver_docs_owner"         ON driver_documents;
DROP POLICY IF EXISTS "driver_docs_member_read"   ON driver_documents;
DROP POLICY IF EXISTS "driver_docs_member_insert" ON driver_documents;
DROP POLICY IF EXISTS "driver_docs_member_update" ON driver_documents;
DROP POLICY IF EXISTS "driver_docs_member_delete" ON driver_documents;

-- Org owner: full access
CREATE POLICY "driver_docs_owner" ON driver_documents
  FOR ALL USING (org_id = auth.uid());

-- Active members: read
CREATE POLICY "driver_docs_member_read" ON driver_documents
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Active members: insert
CREATE POLICY "driver_docs_member_insert" ON driver_documents
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Active members: update
CREATE POLICY "driver_docs_member_update" ON driver_documents
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Active members: delete
CREATE POLICY "driver_docs_member_delete" ON driver_documents
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );
