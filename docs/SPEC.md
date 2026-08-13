# Happy Health AI — Product Specification

> **Status:** Draft — work in progress. All §9 open questions are **decided** (see §9 annotations and `DECISIONS.md`).
> **Location note:** the Happy Factory template places this file at `docs/SPEC.md` (next to `PLAN.md` and `DECISIONS.md`). Consider moving it there once the repo is scaffolded.

---

## 1. Motivation

- A caregiver needs a way to track health care information (specially for elder people) that is used by different people (family members, professional caregivers, nurses).
- For family use, not premium features for tha moment.
---

## 2. Overview

Happy Health AI is a shared health-tracking app for elders and their care network. It lets multiple caregivers record and read vitals (SpO₂, heart rate, blood pressure, temperature), keep care notes, manage medical appointments, get notified about anomalies, and consult an AI assistant that helps interpret the records — never diagnose.

Key properties:

- **Shared, not personal:** the unit of data is a *patient profile* (the elder), and multiple users (owner + caregivers + viewers) access it with different permissions.
- **Mobile-first PWA:** caregivers record data on a phone at the elder's home.
- **Trust is the product:** sensitive health data, access control, clear disclaimers. This app is a *tracking* tool, not a medical device.

---

## 3. Personas

| Persona | Goal | Typical behavior |
|---------|------|------------------|
| **Primary caregiver** (son/daughter, partner) | Track vitals daily, spot trends, prepare info for doctor visits | Records 1–3 readings/day, writes notes, checks history |
| **Professional caregiver / nurse** | Quick, reliable recording; glanceable current state | Records vitals on the go, reads pinned notes |
| **Family viewer** (other relatives) | Stay informed without editing anything | Reads dashboard, receives notifications |
| **The elder** (optional) | See their own data in a simple way | Large-text read-only view (future) |

---

## 4. Features

The app is a **journal log**: every record (vital, note, appointment, photo) is an entry on a day-by-day timeline that can be **created, updated and deleted** at any time. Each day groups its entries; the user reviews "today", edits mistakes (e.g. a wrongly typed reading), and removes obsolete entries. Every entry records who created it and when; edits are kept as updated-at timestamps (full edit history is a future enhancement).

### 4.1 Vitals tracking (core)
- Record **SpO₂, heart rate, blood pressure, temperature** (v1: manual entry with timestamp + optional device/context note).
- **Multiple measures per day** are supported and shown as a **time line**: each day view lists readings in chronological order, with the latest value highlighted.
- Day view shows count + min/max per metric (e.g. "SpO₂: 5 readings, 91–97%").
- History per patient with **trend charts** (last 24h / 7d / 30d / 90d).
- Reference ranges shown as context (e.g. SpO₂ ≥ 95%, HR 60–100 bpm) — informational only.
- Optional weight and glucose later.
- Log the times a patient poo (check and number.)

### 4.2 Care notes
- Free-form notes per patient, categorized (`medication`, `doctor`, `behavior/mood`, `general`).
- Pinned notes (e.g. allergies, current prescriptions) always visible on the dashboard.

### 4.3 Medical appointments
- Upcoming/past appointments per patient (title, doctor, location, datetime).
- **Google Calendar connection** (see doubt §9.6) — sync appointments and reminders.

### 4.4 Notifications (in-app, v1)
- Anomaly alerts based on configurable per-patient thresholds (e.g. "SpO₂ below 92% — flagged").
- Appointment reminders.
- Share/access invites.
- Open doubt: web push (PWA) vs in-app only — see §9.9.

### 4.5 Photo & video uploads
- Photos/videos attached to a patient: wounds, medication boxes, doctor notes, receipts.
- Stored in **Cloudflare R2** (see doubt §9.5), private by default, no public URLs.
- Video uploads from mobile need chunked upload — effort estimate needed.
- the user might create a photo carrousel, with photos showing a wound or any other issue by datetime with arrows and notes per photo.

### 4.6 AI chat
- Contextual assistant following the platform **CHAT-SPEC** pattern (embedded panel, streaming, ReactMarkdown, suggested questions).
- Domain: understanding readings, spotting trends, explaining ranges, drafting questions for the doctor, organizing care notes.
- **Strict safety guardrail:** the system prompt must state it gives *information, not medical advice*; refuses to diagnose, prescribe, or handle emergencies (redirect to a doctor / emergency services). This is a non-negotiable difference from other Happy Factory apps.
- Suggested questions: *"What does a 91% SpO₂ reading mean?"*, *"Show me the trend in mom's heart rate this week"*, *"Draft questions to ask the cardiologist"*.
- Use cohere or groq as the ai provider (free tier).

### 4.7 Shared access
- Patient profiles invite users by email with roles: `owner` (manage members, delete data), `caregiver` (record + edit), `viewer` (read-only).

### 4.8 Multi-patient
- The app might manage more that one patient with independent and isolated data.

### 4.9 Language 
- The whole app should be in Spanish of Spain for the moment

### 4.10
- Control dashboard with the last measures, notes, warnings, etc. Easy to see in one sight to state the current situation.
- Clicking on an element should show the time-line measures or notes.
- AI score: based on O2 saturation (main measure), other measures (if any) and notes, the AI should give a health score with different colors according to the data

### 4.11 Usability (design principle, applies to every screen)
- **Easy to use:** plain **text input** for values and notes everywhere — no complex widgets, sliders or multi-step forms. A reading is "type a number → save".
- **Moderate/big elements:** large buttons and readable font sizes (tap targets ≥ 44px, inputs ≥ 48px), generous spacing — users are often older, in a hurry, or on a small phone.
- **Clear and organized:** one obvious action per screen, visible labels, consistent hierarchy; the dashboard answers "how is she today?" in one glance without reading anything extra.
---

## 5. Proposed Data Model (Neon / Postgres — draft)

Standard tables from the platform: `users`, `sessions` (copy from the Happy Factory auth pattern).

App-specific:

```sql
patients (
  id          UUID PK,
  name        TEXT NOT NULL,
  dob         DATE,
  gender      TEXT,
  allergies   TEXT,               -- pinned, shown on dashboard
  medications TEXT,               -- pinned
  avatar_key  TEXT,               -- R2 key
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

patient_members (
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'caregiver',  -- owner | caregiver | viewer
  PRIMARY KEY (patient_id, user_id)
);

vitals (
  id          UUID PK,
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,      -- spo2 | hr | bp_systolic | bp_diastolic | temp
  value       NUMERIC NOT NULL,
  unit        TEXT NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL,
  device      TEXT,               -- manual | pulse_oximeter | ...
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

notes (
  id          UUID PK,
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  category    TEXT NOT NULL DEFAULT 'general',
  content     TEXT NOT NULL,
  pinned      BOOLEAN DEFAULT false,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

appointments (
  id             UUID PK,
  patient_id     UUID REFERENCES patients(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  doctor_name    TEXT,
  location       TEXT,
  starts_at      TIMESTAMPTZ NOT NULL,
  ends_at        TIMESTAMPTZ,
  google_event_id TEXT,           -- for calendar sync
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT now()
);

uploads (
  id             UUID PK,
  patient_id     UUID REFERENCES patients(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL,   -- photo | video | document
  r2_key         TEXT NOT NULL,
  mime_type      TEXT,
  size_bytes     BIGINT,
  thumbnail_key  TEXT,
  caption        TEXT,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT now()
);

notifications (
  id          UUID PK,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,      -- vital_alert | appointment | share_invite | system
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

patient_settings (                -- per-patient alert thresholds
  patient_id UUID PK REFERENCES patients(id) ON DELETE CASCADE,
  spo2_min   NUMERIC DEFAULT 92,
  hr_min     NUMERIC DEFAULT 50,
  hr_max     NUMERIC DEFAULT 120,
  ...
);

chat_messages (                   -- future (per CHAT-SPEC §11)
  id          UUID PK,
  user_id     UUID REFERENCES users(id),
  patient_id  UUID REFERENCES patients(id),
  role        TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

> **Journal semantics:** because every entry is editable and deletable (see §4), all entry tables (`vitals`, `notes`, `appointments`, `uploads`) get `updated_at TIMESTAMPTZ DEFAULT now()` and `deleted_at TIMESTAMPTZ` (soft delete — deleted entries disappear from the timeline but are recoverable for a short window). The day timeline groups entries by `measured_at` / `starts_at` / `created_at` date.
>
> **Open questions affecting the schema:** multi-patient v1 (§9.3), calendar sync direction (§9.6), field-level encryption (§9.7), uploads size limits (§9.8). Neon in v1

---

## 6. Deviations from the Happy Factory Standard

These are intentional deviations from the platform golden rules — **each must be justified in a team decision** (they are listed as doubts in §9):

| Area | Standard | This app proposes | Doubt |
|------|----------|-------------------|-------|
| Auth | Magic links via Resend, no OAuth | **Google OAuth** | §9.2 |
| Storage | Vercel Blob / Supabase storage | **Cloudflare R2 + Images/Stream** | §9.5 |
| Data protection | Encryption at rest (Neon default) | Field-level encryption requested | §9.7 |
| Chat scope | App domain + off-topic redirect | Health domain **+ no-medical-advice guardrail** | §9.10 |
| Notifications | In-app only (CHAT-SPEC) | Web push considered | §9.9 |

Everything else follows the platform: Next.js 16, Tailwind v4 + shelter tokens, DM Sans + Fraunces, bark/sun palette, dark sidebar + bottom nav, PWA, Vercel + Neon, `--webpack` build, `vercel.json` headers, `iad1` region.

---

## 7. Technologies

- Part of the Happy Factory ecosystem.
- **Web app, Next.js v16** (App Router), Vercel deployments.
- **Neon DB** (Postgres).
- **Cloudflare** (R2) for photo/video storage — verify vs Vercel Blob (§9.5).
- Auth: Google OAuth (proposed — §9.2) or magic links (standard).
- AI: Cohere or Groq

---

## 8. Monetization
- None. Personal/family use only — no tiers, no plans, no payments (DECISION D13).

## 9. Open Questions & Doubts

These are the decisions that must be made before (or early in) implementation:

### 9.1 Is this app for one elder or many?
"Tracking health info of elder people" could mean a single-family tool or a platform where one caregiver manages several elders. This changes the whole data model (patient profiles + members vs a flat "my elder" model). **My recommendation:** patient profiles from day one — it is only a little more work and avoids a painful migration. the app is meant to track 2 or more elders.

### 9.2 Google OAuth vs platform-standard magic links (biggest deviation)
The platform rule is *no OAuth* unless there is a strong product reason. Possible reasons here: (a) caregivers may not check email for a magic link while standing in a doctor's office; (b) the elderly user is familiar with their Google account; (c) we already need Google OAuth for Calendar sync anyway — one auth flow for both. **Doubts:** Google consent screen verification (Sensitive scopes require review), account takeover of a health profile if the Google account is lost, and `session` handling differences vs iron-session. **Decision needed:** magic links (standard, ship faster) or Google OAuth (better UX, more review work). Hybrid (Google login + magic link fallback) is possible.
Google auth but the caregiver should be approved by an admin. Keep in mind this app is not gonna be used by elders at all.

### 9.3 Shared access model
Who owns the data, and can two different families ever share? Invites by email with roles (owner/caregiver/viewer) is my proposal — but it adds invite UI, role enforcement, and audit. Simplest v1: the elder belongs to one account, and the account owner shares read access via link? **Decision needed on scope.**
- **Decision:** invites by email with roles (owner/caregiver/viewer).

### 9.4 How do vitals get in?
Manual entry only for v1, or integrate devices (Bluetooth pulse oximeters, smartwatches, blood pressure cuffs)? Device integrations are expensive and platform-fragmented (Android/iOS/PWA limitations). **My recommendation:** manual entry v1 with a fast "last value" UI, device APIs as a future enhancement. **Doubt:** is recording by hand acceptable to the caregiver in practice?
- **Decision:** manual entry only for v1, with a fast "last value" UI.

### 9.5 Cloudflare storage vs Vercel Blob
- The platform standard elsewhere is Vercel Blob (`BLOB_READ_WRITE_TOKEN`), but this app proposes Cloudflare. Cloudflare **R2 + Images + Stream** is genuinely better for this use case (cheaper egress, video streaming via Stream, image variants). **Doubts:** R2 requires signed URLs / direct-upload presigned posts (more code); Stream adds a second service + billing. **Decision:** Cloudflare R2 for photos + Stream for video (my recommendation), or Vercel Blob for everything (simpler, consistent with platform).
- Use R2, other apps use it like garden

### 9.6 Google Calendar integration details
- **Whose calendar?** The caregiver's personal calendar is the realistic choice (the elder often has no Google account). This means the OAuth consent is tied to the *caregiver's* account — role conflicts with §9.2.
- **Direction:** one-way (app → calendar) for v1 or two-way sync? One-way is far simpler (create/update/delete events via the Calendar API). Two-way (importing existing appointments) needs polling/webhooks.
- **Refresh tokens:** must be stored encrypted (§9.7) and refreshed; token expiry handling.
- **Decision:** one-way (app → calendar), on the caregiver's personal Google account.

### 9.7 "Data encryption on database" — what exactly?
Neon already encrypts **at rest** by default. If the requirement means **field-level encryption** (e.g. vitals values, notes), options are: `pgcrypto` in Postgres (key in Neon env — mostly security theater if the key lives with the data) or application-level AES-GCM (key in Vercel env; real protection, but breaks search/aggregation, sorting, and SQL queries on encrypted columns). **Doubts:** what threat model? Compliance (GDPR special-category data, or HIPAA if US users) is handled differently from encryption — a legal/scope question. **My recommendation:** at-rest encryption + strict access control + audit log; field-level only if there is a concrete reason (e.g. DB shared with other apps). The app is not shared, and is in Spain: GDPR

### 9.8 Upload limits & media handling
Photo/video sizes, per-upload and total quotas, thumbnail generation (Cloudflare Images variants vs manual), video transcoding (Stream does this), and how the PWA handles uploads on flaky connections (chunked/resumable). Also: what media is actually useful in v1 (wound photos, medication boxes, prescriptions as documents) vs video. Photo and video.

### 9.9 Push notifications vs in-app only
Platform chat spec says in-app only. But anomaly alerts are the killer feature for a caregiver app — a low SpO₂ alert you only see when you open the app is weak. **Web Push** (VAPID + service worker) works with PWA on Android but **not iOS Safari** (no Web Push on iOS until 16.4+ — actually supported now, but with caveats). **Decision:** v1 in-app + web push, or in-app only? in-app for the moment.

### 9.10 AI chat — medical safety scope
- The chat must follow the platform CHAT-SPEC (domain restriction, streaming, markdown) **plus** a strict *no medical advice* guardrail: no diagnoses, no dosage recommendations, no emergency handling; always disclaim and suggest consulting a professional.
- **Doubts:** should the chat see the patient's actual vitals as context (privacy within the care circle is fine — members already see the data) or only explain generically? Liability wording — needs a lawyer-ish review at least once.
- Which provider: platform default (Cohere or Groq) or a medically-pretuned model? Platform default is my recommendation.

### 9.11 i18n — language(s) for v1
Platform apps vary; several are Spanish-first (prepper, garden). For a caregiver app, ES + EN at launch seems right (our users are in Spain). **Decision needed:** v1 Spanish ES/ES only, 

### 9.12 The elder's own experience
Do elders log in and see their own data (big-text mode), or is this app strictly for caregivers? A read-only "for mom/dad" view is a nice differentiator but doubles UI work. **My recommendation:** defer to v2; v1 is caregiver-only. Strictly for caregivers.

### 9.13 Naming & branding
Proposed per platform conventions: directory `happy-health-ai` ✓, domain `health.happyfactory.app`, PWA name "Happy Health AI", Neon DB `health_db`. Confirm nothing already uses the `health` subdomain.

---

## 10. Out of Scope (v1)

- Medical device integrations (Bluetooth/wearables) — future enhancement.
- Telemedicine / contact with professionals through the app.
- Emergency alerts to SMS/phone calls.
- Multi-language elder UI.
- Medication reminders (appointments cover this partially — confirm).
- Cross-app data sharing (e.g. with future Happy Factory health-adjacent apps).

---

## 11. Memory docs

- `\\wsl.localhost\Ubuntu-24.04\home\fernando\happy-factory\projects\memory`


## 12. Final thoughts

- The app should be a journal log for caregivers to annotate and consult health state data in one sight.

## 13. Dashboard issues
- It might be as simple as possible, making the best use of space as possible without scrolling.
- The main measures should be put on top, showing the last measures. eg: O2 89% with different colors according to the measure: green, orange, red
  It should be a photograph of the last state.s
- Poo stuff should be simple: clicking the icon should increment the number and add an editable log in history with the current datetime. Do not open a modal to fill data in.
- Measure limits should be removed from dashboard. It might be a menu option.
- Buttons with text should not occupy the whole screen, the text should fit the element with no spaces.
- use lucide icons instead of text as much as possible.
- the patient name should be bigger and have a thumbnail associated.
- also on the dashboard should show the option of adding an incident: wound, or any other, that allows to upload photos and see them on a carousel with manual notes.
> **Done (impl/dashboard-refinements):** measures on top color-coded (green/orange/red) via `VitalTiles`; poo one-tap increment → log entry; thresholds moved to `/settings`; full-width text buttons removed; lucide icons in QuickRecord + empty states; PWA icons regenerated to a red cross (`scripts/gen-icons.mjs`); **patient name bigger + thumbnail** (avatar via R2, `07-incidents.sql`); **incidents on the dashboard** (wound/other with photo upload + carrousel + manual notes, `IncidentsSection`).
