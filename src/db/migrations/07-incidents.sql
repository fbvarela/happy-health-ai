-- 07-incidents.sql — incidents (wounds, issues) with photos + notes (SPEC §13)
-- Idempotent. Run via `npm run db:migrate`.

CREATE TABLE IF NOT EXISTS incidents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS incidents_patient_idx ON incidents (patient_id, created_at DESC);

-- Incident photos reference an incident (or stay patient-level when no incident)
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS uploads_incident_idx ON uploads (incident_id) WHERE incident_id IS NOT NULL;
