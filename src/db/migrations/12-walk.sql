-- 12-walk.sql — daily walk check (no distance or duration)

ALTER TABLE vitals DROP CONSTRAINT IF EXISTS vitals_type_check;
ALTER TABLE vitals ADD CONSTRAINT vitals_type_check
  CHECK (type IN ('spo2', 'hr', 'bp_systolic', 'bp_diastolic', 'temp', 'poo', 'mood', 'night_events', 'walk'));
