-- 00-schema.sql — Happy Health AI initial schema
-- Idempotent (IF NOT EXISTS everywhere). Run via `npm run db:migrate`.

-- ── Platform base: auth ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  locale     TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magic_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS magic_links_email_created_idx
  ON magic_links (email, created_at);

CREATE TABLE IF NOT EXISTS sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── App: patients & shared access ────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  dob         DATE,
  gender      TEXT,
  allergies   TEXT,
  medications TEXT,
  avatar_key  TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_members (
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'caregiver'
             CHECK (role IN ('owner', 'caregiver', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (patient_id, user_id)
);

CREATE INDEX IF NOT EXISTS patient_members_user_idx ON patient_members (user_id);

-- ── App: vitals ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vitals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
              CHECK (type IN ('spo2', 'hr', 'bp_systolic', 'bp_diastolic', 'temp')),
  value       NUMERIC NOT NULL,
  unit        TEXT NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL,
  device      TEXT,
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vitals_patient_time_idx
  ON vitals (patient_id, type, measured_at DESC);

CREATE TABLE IF NOT EXISTS patient_settings (
  patient_id UUID PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
  spo2_min   NUMERIC DEFAULT 92,
  hr_min     NUMERIC DEFAULT 50,
  hr_max     NUMERIC DEFAULT 120,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── App: notes ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  category   TEXT NOT NULL DEFAULT 'general'
             CHECK (category IN ('general', 'medication', 'doctor', 'behavior')),
  content    TEXT NOT NULL,
  pinned     BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_patient_idx ON notes (patient_id, pinned DESC, created_at DESC);

-- ── App: appointments ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  doctor_name     TEXT,
  location        TEXT,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  google_event_id TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_patient_time_idx
  ON appointments (patient_id, starts_at);

-- ── App: uploads ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('photo', 'video', 'document')),
  r2_key        TEXT NOT NULL,
  mime_type     TEXT,
  size_bytes    BIGINT,
  thumbnail_key TEXT,
  caption       TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uploads_patient_idx ON uploads (patient_id, created_at DESC);

-- ── App: notifications ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL
             CHECK (type IN ('vital_alert', 'appointment', 'share_invite', 'system')),
  title      TEXT NOT NULL,
  body       TEXT,
  data       JSONB,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_read_idx
  ON notifications (user_id, read_at) WHERE read_at IS NULL;

-- ── App: chat history (future) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
