-- 05-appointments.sql — appointments journal cols + Google Calendar tokens (D4)
-- Idempotent. Run via `npm run db:migrate`.

-- Journal semantics for appointments (§4)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Caregiver's Google Calendar OAuth tokens (one per user, refresh token stored)
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  access_token   TEXT NOT NULL,
  refresh_token  TEXT,
  expires_at     TIMESTAMPTZ NOT NULL,
  connected_at   TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
