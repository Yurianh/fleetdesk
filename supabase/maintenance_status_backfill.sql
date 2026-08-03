-- Backfill: normalize maintenance_records.status to the canonical uppercase enum.
-- Records created via the Vehicles-page quick-add were written as 'ok' / 'problem'
-- (lowercase) while every other write path uses 'OK' / 'PROBLEM'. Lowercase rows
-- displayed with the wrong badge and escaped the status filters and the
-- "Problèmes ouverts" KPI. The app now writes uppercase everywhere; this
-- normalizes historical rows. Run once in the Supabase SQL Editor.

UPDATE maintenance_records
SET status = UPPER(status)
WHERE status IN ('ok', 'problem');

-- Verify: should return 0 rows
SELECT id, status FROM maintenance_records
WHERE status IS NOT NULL AND status <> UPPER(status);
