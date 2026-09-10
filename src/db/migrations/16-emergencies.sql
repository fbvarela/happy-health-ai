-- 10-emergencies.sql — emergency history log
-- Idempotent. Run via `npm run db:migrate`.

CREATE TABLE IF NOT EXISTS emergencies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,  -- Emergency type (caída, desmayo, etc.)
  details     TEXT,           -- Additional details from free-text field
  resolved    BOOLEAN NOT NULL DEFAULT false,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS emergencies_patient_idx ON emergencies (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS emergencies_created_by_idx ON emergencies (created_by);