CREATE TABLE IF NOT EXISTS caregiver_handoffs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  from_user_id     UUID NOT NULL REFERENCES users(id),
  to_user_id       UUID NOT NULL REFERENCES users(id),
  created_by       UUID NOT NULL REFERENCES users(id),
  transferred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  note             TEXT
);

CREATE INDEX IF NOT EXISTS caregiver_handoffs_patient_time_idx
  ON caregiver_handoffs (patient_id, transferred_at DESC);
