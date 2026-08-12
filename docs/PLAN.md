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

- [ ] `patients`, `patient_members` tables + role enforcement (owner/caregiver/viewer)
- [ ] Patient CRUD (name, DOB, allergies, medications — pinned on dashboard)
- [ ] `/dashboard` — patient selector, pinned info, latest vitals summary
- [ ] Invite-by-email share flow (DECIDED §9.3 / D16)
- [ ] `GET /api/tier` + `PremiumGate` on premium-only actions

**Exit criteria:** user can create a patient, see the dashboard, share read access.

---

## Phase 3 — Vitals (5–7 days)

**Goal:** record and visualize vitals.

- [ ] `vitals` + `patient_settings` (alert thresholds) tables
- [ ] Quick record UI (SpO₂ / HR / BP / temp, timestamp, device, notes) — 44px+ targets, manual entry with fast "last value" (DECIDED §9.4)
- [ ] Poo log entry (checked + count) — SPEC §4.1, same quick-record pattern
- [ ] **Day timeline view** — all entries per day (multiple readings/day), latest highlighted, min/max per metric (SPEC §4.1)
- [ ] History list + trend charts (24h / 7d / 30d / 90d) — lightweight SVG, no chart lib dependency (or add one if needed)
- [ ] Anomaly flagging vs thresholds → `notifications` rows
- [ ] Notes CRUD (categories, pinning)

**Exit criteria:** caregiver records a reading, sees the trend, gets flagged.

---

## Phase 4 — Appointments & Calendar (4–6 days)

**Goal:** appointments work without Google, then with it (DECIDED §9.6 / D4: one-way, caregiver's calendar).

- [ ] `appointments` CRUD + reminders as notifications
- [ ] Calendar list/agenda UI
- [ ] Google Calendar sync (one-way app → calendar, v1): OAuth consent, refresh token storage (encrypted — §9.7), create/update/delete events

**Exit criteria:** appointment created in app appears in caregiver's Google Calendar.

---

## Phase 5 — AI Chat (3–5 days)

**Goal:** embedded chat per platform CHAT-SPEC + health guardrails.

- [ ] `/chat` page + `ChatInterface` (streaming, ReactMarkdown, suggested questions in Spanish)
- [ ] `POST /api/chat` with Cohere or Groq (Vercel AI SDK, free tier — DECIDED §9.10 / D8), domain restriction + **no medical advice** guardrail in system prompt, ES-only answers
- [ ] Context injection: active patient + latest vitals + AI health score (SPEC §4.10)
- [ ] Rate limit 20 msg/day free, unlimited premium

**Exit criteria:** chat answers health-record questions, refuses off-topic + diagnosis requests.

---

## Phase 6 — Uploads (4–6 days)

**Goal:** photo/video storage (DECIDED §9.5: Cloudflare R2 + Stream, like `garden`).

- [ ] R2 buckets + presigned URL upload endpoint (garden pattern)
- [ ] `uploads` table; gallery per patient; private access (signed URLs)
- [ ] Photo carrousel per issue/wound, ordered by datetime, arrows + per-photo notes (SPEC §4.5)
- [ ] Thumbnails (Cloudflare Images variants or manual); video via Cloudflare Stream (or skip video v1)
- [ ] Quota enforcement per tier (§9.8)

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
- [ ] Stripe webhook registered (production URL), bundle webhook test
- [ ] `.env.example` complete; env vars on Vercel (shared group + app-specific)
- [ ] Test login flow, checkout, chat limits in production
- [ ] Announce + soft launch

---

## Backlog (future)

- Device integrations (Bluetooth pulse oximeters) — premium feature
- Elder read-only view (big text)
- Two-way calendar sync
- Chat history persistence (premium)
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
