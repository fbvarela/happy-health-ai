-- 09-incidents-active.sql — active flag on incidents (active = ongoing, dashboard shows only active)
-- Idempotent. Run via `npm run db:migrate`.

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS incidents_patient_active_idx ON incidents (patient_id, active) WHERE deleted_at IS NULL;
