# Happy Health AI — Guidance for Claude Code

Shared health-tracking app for caregivers of elder people. Part of the Happy Factory platform.

## Commands

```bash
npm run dev          # next dev --webpack (PWA disabled in dev)
npm run build        # next build --webpack (PWA requires webpack, NOT Turbopack)
npm run start        # next start
npm run lint         # eslint . (Next 16 removed `next lint`)
npm run db:migrate   # node scripts/run-migration.mjs (runs src/db/migrations/*.sql against DATABASE_URL)
```

## Architecture

- **Stack:** Next.js 16 (App Router) + Tailwind v4, JS (no TypeScript — don't mix).
- **DB:** Neon Postgres via `@neondatabase/serverless` — `src/lib/db.js` tagged-template helper.
- **Auth:** **Google OAuth + admin approval** (DECIDED, SPEC §9.2) — no magic links, no password auth. Caregivers sign in with Google, admin approves new users, elders never log in. Build requires OAuth (iron-session already scaffolds this; magic-link code may be removed).
- **AI:** Cohere or Groq (free tier) — SPEC §4.6/§9.10. Chat answers in **Spanish (es-ES) only**.
- **Payments:** Stripe — `src/lib/stripe.js`, `/api/stripe/{checkout,webhook,portal}`, `isPremium(plan)` in `src/lib/tier.js` (covers both `premium` and `bundle`). No premium work in v1 (family use) — DECISION D13.
- **Design:** copy shelter-ai tokens (`globals.css`). Dark bark sidebar desktop, bottom nav + FAB mobile. DM Sans + Fraunces + Caveat.
- **Usability (SPEC §4.11):** plain **text inputs** (no complex widgets), big touch targets (≥44–48px), one obvious action per screen, clear hierarchy — the dashboard must answer "how is she today?" in one glance.
- **PWA:** `@ducanh2912/next-pwa`. NEVER run `next build` without `--webpack`.
- **Chat:** platform CHAT-SPEC pattern (embedded `/chat` page, streaming, ReactMarkdown) with a mandatory **no-medical-advice** guardrail in the system prompt. Context = active patient + latest vitals + AI health score (SPEC §4.10).

## Conventions

- Server components for pages; `"use client"` only where needed.
- API routes return `Response.json(...)`; auth via `getSession()` from `src/lib/session.js`.
- Sensitive health data: never log patient data, never expose R2 objects with public URLs.
- Free-tier limits in `src/lib/limits.js`, enforced server-side.

## Open Questions (from docs/SPEC.md §9)

**ALL DECIDED** (see `docs/DECISIONS.md`): auth = Google OAuth + admin approval (D1), storage = Cloudflare R2 + Stream like garden (D2), encryption at-rest, no field-level (D3), calendar one-way on caregiver's account (D4), in-app notifications (D5), manual vitals entry (D6), multi-patient from day one (D7), AI = Cohere/Groq ES-only (D8/D9), no premium v1 (D13), photos + video (D14), usability text-inputs (D15), sharing = invites with roles (D16).

Read `docs/SPEC.md`, `docs/PLAN.md`, and `docs/DECISIONS.md` before starting any phase.
