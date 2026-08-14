-- 10-dashboard-mood.sql — dashboard metrics: mood + night events
-- Idempotent. Run via `npm run db:migrate`.

-- Dashboard needs two new metrics (SPEC §13):
--   mood          — estado de ánimo (1–5)
--   night_events  — nº de llamadas/levantadas nocturnas (count, like poo)
ALTER TABLE vitals DROP CONSTRAINT IF EXISTS vitals_type_check;
ALTER TABLE vitals ADD CONSTRAINT vitals_type_check
  CHECK (type IN ('spo2', 'hr', 'bp_systolic', 'bp_diastolic', 'temp', 'poo', 'mood', 'night_events'));
