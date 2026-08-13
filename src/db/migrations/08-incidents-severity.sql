-- 08-incidents-severity.sql — severity on incidents (green/orange/red, SPEC §13)
-- Idempotent. Run via `npm run db:migrate`.

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'green'
  CHECK (severity IN ('green', 'orange', 'red'));
