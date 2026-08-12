-- 03-invites.sql — patient sharing via email invites (D16)
-- Idempotent. Run via `npm run db:migrate`.

-- Journal semantics for patients (§4): keep updated_at
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Email invites to share a patient (pending until the invited user accepts)
CREATE TABLE IF NOT EXISTS patient_invites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'caregiver'
             CHECK (role IN ('owner', 'caregiver', 'viewer')),
  status     TEXT NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (patient_id, email)
);

CREATE INDEX IF NOT EXISTS patient_invites_email_idx ON patient_invites (email, status);
