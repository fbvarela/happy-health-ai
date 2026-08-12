-- 01-oauth.sql — Google OAuth + admin approval (D1)
-- Idempotent (IF NOT EXISTS). Run via `npm run db:migrate`.

-- Users: Google identity, approval status, role
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id  TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'denied'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS role       TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('admin', 'member'));

CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON users (google_id) WHERE google_id IS NOT NULL;

-- Approvals log: who approved/denied whom, when (audit trail)
CREATE TABLE IF NOT EXISTS approvals (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id   UUID REFERENCES users(id),
  action     TEXT NOT NULL CHECK (action IN ('approve', 'deny')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS approvals_user_idx ON approvals (user_id, created_at DESC);

-- Magic links are gone (D1 — no magic links, no password auth)
DROP TABLE IF EXISTS magic_links;
