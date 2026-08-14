-- 11-medications.sql — structured medication schedule and daily taken log

CREATE TABLE IF NOT EXISTS medications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  quantity      TEXT NOT NULL,
  meal_group    TEXT NOT NULL CHECK (meal_group IN ('breakfast', 'lunch', 'supper')),
  active        BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medications_patient_idx
  ON medications (patient_id, active, meal_group, created_at);

CREATE TABLE IF NOT EXISTS medication_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id   UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  taken_on        DATE NOT NULL DEFAULT CURRENT_DATE,
  taken_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by     UUID REFERENCES users(id),
  UNIQUE (medication_id, taken_on)
);

CREATE INDEX IF NOT EXISTS medication_logs_patient_day_idx
  ON medication_logs (patient_id, taken_on);
