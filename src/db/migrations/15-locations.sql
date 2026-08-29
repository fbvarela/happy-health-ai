CREATE TABLE IF NOT EXISTS locations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  address          TEXT,
  notes            TEXT,
  created_by       UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS locations_patient_idx ON locations (patient_id);

CREATE TABLE IF NOT EXISTS location_contacts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id      UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  phone            TEXT NOT NULL,
  kind             TEXT NOT NULL DEFAULT 'emergency',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS location_contacts_location_idx ON location_contacts (location_id);

CREATE TABLE IF NOT EXISTS location_moves (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  to_location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  moved_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS location_moves_patient_time_idx
  ON location_moves (patient_id, moved_at DESC);