-- ============================================================================
-- Driver documents: a second file, for the back of the driving licence
-- (permis de conduire recto/verso). file_url = recto, file_url_verso = verso.
-- Run in the Supabase SQL Editor.
-- ============================================================================
alter table public.driver_documents
  add column if not exists file_url_verso text;
