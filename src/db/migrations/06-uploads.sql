-- 06-uploads.sql — journal semantics for uploads (SPEC §4)
-- Idempotent. Run via `npm run db:migrate`.

ALTER TABLE uploads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
