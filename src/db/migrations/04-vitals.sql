-- 04-vitals.sql — vitals phase: poo log, journal columns, alert thresholds
-- Idempotent. Run via `npm run db:migrate`.

-- Poo log needs a type + count (SPEC §4.1: "check and number")
ALTER TABLE vitals DROP CONSTRAINT IF EXISTS vitals_type_check;
ALTER TABLE vitals ADD CONSTRAINT vitals_type_check
  CHECK (type IN ('spo2', 'hr', 'bp_systolic', 'bp_diastolic', 'temp', 'poo'));

-- Journal semantics for vitals (§4): editable + soft-deletable
ALTER TABLE vitals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE vitals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Poo entries store a count (nullable, only used for type='poo')
ALTER TABLE vitals ADD COLUMN IF NOT EXISTS count NUMERIC;

-- Alert thresholds per metric (SPEC §4.4 anomaly flagging)
ALTER TABLE patient_settings ADD COLUMN IF NOT EXISTS temp_min   NUMERIC DEFAULT 36;
ALTER TABLE patient_settings ADD COLUMN IF NOT EXISTS temp_max   NUMERIC DEFAULT 37.5;
ALTER TABLE patient_settings ADD COLUMN IF NOT EXISTS bp_sys_max NUMERIC DEFAULT 140;
ALTER TABLE patient_settings ADD COLUMN IF NOT EXISTS bp_dia_max NUMERIC DEFAULT 90;

-- Notes journal semantics
ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
