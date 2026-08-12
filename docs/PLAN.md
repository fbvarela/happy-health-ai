# Happy Health AI — Implementation Plan

> Companion to `docs/SPEC.md`. Phases are ordered so each one ends in a deployable, testable state.
> Effort estimates are rough (days, dev-time). Review before starting each phase.

---

## Phase 0 — Scaffold & Foundation (3–5 days)

**Goal:** empty app on Vercel, branded, PWA-installable, builds green.

- [x] Copy `globals.css` from happy-shelter-ai (token system)
- [x] Root config: `package.json`, `next.config.js` (PWA + security headers), `vercel.json`, `postcss.config.mjs`, `jsconfig.json`, `.gitignore`, `.env.example`
- [x] Base layout (fonts, viewport, PWA metadata), landing page → redirect to `/dashboard`
- [x] `public/manifest.json` + icons + `offline.html`
- [ ] Deploy to Vercel, add `health.happyfactory.app` domain, verify PWA installs (blocked on scaffold PR merge + env vars)
- [x] `docs/SPEC.md`, `docs/PLAN.md`, `docs/DECISIONS.md`, root `CLAUDE.md`

**Exit criteria:** `npm run build` passes (✓); app installable; landing + login reachable (pending deploy).

---

## Phase 1 — Auth (3–5 days)

**Goal:** Google OAuth login + admin approval (DECIDED §9.2 / D1).

- [x] `01-oauth.sql`: users + `google_id`/`avatar_url`/`status`/`role`, `approvals` log, drop `magic_links` (applied to dev DB ✓)
- [x] Google OAuth flow: `GET /api/auth/google` (state cookie) → consent → `GET /api/auth/callback` (code exchange, upsert, session)
- [x] iron-session reused (`src/lib/session.js`); magic-link code removed (`send-link`, `magic-link.js`)
- [x] Admin approval: `GET /api/admin/approvals` + `POST /api/admin/approvals/[userId]` (admin only, `ADMIN_EMAILS` env); audit row per decision
- [x] Login page (Google button, ES) + `/pending` approval screen + `/admin/approvals` page (ES)
- [x] Client guard: unapproved users → `/pending`, logged-out → `/login` (`ClientLayout`)
- [ ] **You:** create Google Cloud OAuth client (consent screen, redirect `{APP_URL}/api/auth/callback`) + set `GOOGLE_CLIENT_ID/SECRET`, `ADMIN_EMAILS` in `.env.local` / Vercel

**Exit criteria:** Google sign-in round trip works locally and on Vercel preview (creates pending user → admin approves → dashboard).

---

## Phase 2 — Dashboard & Patients (4–6 days)

**Goal:** first real screen — patient list + per-patient dashboard.

- [x] `patients`, `patient_members` tables + role enforcement (owner/caregiver/viewer) — `lib/patients.js` access helpers
- [x] Patient CRUD (name, DOB, allergies, medications — pinned on dashboard) — `03-invites.sql` + `/api/patients` + `/api/patients/[id]`
- [x] `/dashboard` — patient list + invites inbox; `/patients` list + create; `/patients/[id]` pinned info + members
- [x] Invite-by-email share flow (DECIDED §9.3 / D16) — `patient_invites` table, accept/decline (`/api/invites`)

**Exit criteria:** user can create a patient, see the dashboard, share read access (✓ pending live test with a second account).

---

## Phase 3 — Vitals (5–7 days)

**Goal:** record and visualize vitals.

- [x] `04-vitals.sql`: poo type + count, journal columns (`updated_at`/`deleted_at`), extended thresholds (temp, BP)
- [x] Quick record UI (SpO₂ / HR / BP / temp / poo, timestamp, device, notes) — big buttons, text inputs, last-value prefill (DECIDED §9.4)
- [x] Poo log entry (checked + count) — SPEC §4.1, same quick-record pattern
- [x] **Day timeline view** — entries grouped per day, latest highlighted, min/max per metric (SPEC §4.1)
- [x] History + trend charts (`/patients/[id]/history`, lightweight SVG, 24h / 7d / 30d / 90d)
- [x] Anomaly flagging vs thresholds → `notifications` rows (`lib/vitals.js`, per-patient settings UI)
- [x] Notes CRUD (categories, pinning) — `/api/patients/[id]/notes`

**Exit criteria:** caregiver records a reading, sees the trend, gets flagged (✓ DB-level tested; browser round-trip pending live Google login).

---

## Phase 4 — Appointments & Calendar (4–6 days)

**Goal:** appointments work without Google, then with it (DECIDED §9.6 / D4: one-way, caregiver's calendar).

- [x] `05-appointments.sql`: appointments journal cols (`updated_at`/`deleted_at`), `google_calendar_tokens` table
- [x] Appointments CRUD (caregiver+) — `/api/patients/[id]/appointments`, soft delete
- [x] Calendar list/agenda UI — `/appointments` page (grouped by day, create/edit/delete modals)
- [x] Google Calendar sync (one-way app → calendar): OAuth (`/api/calendar/connect|callback|status|disconnect`, scope `calendar.events`, offline tokens), create/update/delete events, token refresh (`lib/calendar.js`)
- [x] Connect UI on `/appointments` + link from patient page
- [ ] **You:** add `http://localhost:3000/api/calendar/callback` (and prod URL) to the Google OAuth client's redirect URIs in GCP

**Exit criteria:** appointment created in app appears in caregiver's Google Calendar.

---

## Phase 5 — AI Chat (3–5 days)

**Goal:** embedded assistant per platform CHAT-SPEC + health guardrails, as a floating bubble (not a menu page).

- [x] Floating chat widget (`ChatWidget`) — bubble bottom-right → modal, wired globally in `ClientLayout`; `/chat` page removed; removed from nav
- [x] `POST /api/chat` with Cohere or Groq (AI SDK v7, free tier — DECIDED §9.10 / D8), domain restriction + **no medical advice** guardrail in system prompt, ES-only answers
- [x] Context injection: active patient (from `AppContext`) + latest vitals + AI health score (SPEC §4.10, `lib/health-score.js`)
- [x] Rate limit 20 msg/day (single limit for all — no tiers) — `lib/chat.js` + `chat_messages` rows
- [x] ReactMarkdown rendering + suggested questions in Spanish
- [ ] **You:** set `GROQ_API_KEY` or `COHERE_API_KEY` in `.env.local` / Vercel

**Exit criteria:** chat answers health-record questions, refuses off-topic + diagnosis requests (pending live key + browser test).

---

## Phase 6 — Uploads (4–6 days)

**Goal:** photo/video storage (DECIDED §9.5: Cloudflare R2 + Stream, like `garden`).

- [ ] R2 buckets + presigned URL upload endpoint (garden pattern)
- [ ] `uploads` table; gallery per patient; private access (signed URLs)
- [ ] Photo carrousel per issue/wound, ordered by datetime, arrows + per-photo notes (SPEC §4.5)
- [ ] Thumbnails (Cloudflare Images variants or manual); video via Cloudflare Stream (or skip video v1)
- [ ] Quota enforcement (§9.8 — size limits, no tier quotas)

**Exit criteria:** photo upload → thumbnail → visible in gallery, private URL.

---

## Phase 7 — Notifications & Polish (3–5 days)

- [ ] Notification center page + unread badge (in-app only — DECIDED §9.9 / D5; no web push in v1)
- [ ] Final ES (es-ES) language pass — single locale (DECIDED §9.11 / D9)
- [ ] Responsive QA at 320/375/768/1440, Lighthouse, PWA offline check
- [ ] Legal pages: privacy policy (health data, GDPR — §9.7), disclaimer

**Exit criteria:** Lighthouse ≥ 90, PWA installs offline, ES+EN toggle.

---

## Phase 8 — Launch (2–3 days)

- [ ] Neon production migration + branch-per-preview integration
- [ ] `.env.example` complete; env vars on Vercel (OAuth, AI, R2)
- [ ] Test login flow, chat limits in production
- [ ] Announce + soft launch

---

## Backlog (future)

- Device integrations (Bluetooth pulse oximeters) — future enhancement
- Elder read-only view (big text)
- Two-way calendar sync
- Chat history persistence
- Chat messages table, per-patient threads
- Export PDF report for doctor visits
- Audit log for sensitive data access

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Google OAuth consent review delays (if chosen) | Keep magic links as fallback; start consent application early |
| Medical claim liability | Disclaimer everywhere; chat guardrail; legal review before launch |
| iOS Web Push unreliability | In-app notification center as baseline |
| Video upload complexity | Defer to v2 if Stream integration slips |
| Field-level encryption breaking queries | Document trade-offs; decide before Phase 3 (§9.7) |
