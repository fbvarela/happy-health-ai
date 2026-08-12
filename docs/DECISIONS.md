# Happy Health AI — Key Architectural Decisions

> Decisions marked **PENDING** are open questions from `docs/SPEC.md` §9 and must be resolved before the related phase starts. This file records the outcome and rationale so the whole team agrees.

| # | Decision | Status                          | Rationale |
|---|----------|---------------------------------|-----------|
| D1 | **Auth: Google OAuth + admin approval** | **DECIDED** (SPEC §9.2)         | Caregivers sign in with Google; admin must approve new caregivers; elders never log in. Deviates from platform magic-links rule — exception documented in memory (HAPPY-FACTORY-CONTEXT.md). Wrong password auth; do NOT build magic links. |
| D2 | **Storage: Cloudflare R2 (photos) + Stream (video)** | **DECIDED** (SPEC §9.5)         | Same pattern as the `garden` app (R2 + signed/presigned URLs, private objects). Stream handles video transcoding; Vercel Blob dropped. |
| D3 | **Encryption: at-rest (Neon default) + access control; no field-level crypto in v1** | *fffff*DECIDED** (SPEC §9.7)    | App is single-household, ES users, GDPR context. Field-level encryption breaks SQL queries; only if a concrete threat model requires it. Decision before Phase 3. |
| D4 | **Calendar: one-way app → Google Calendar, caregiver's account** | **DECIDED** (SPEC §9.6)         | Simplest v1; two-way sync is complex. |
| D5 | **Notifications: in-app only for now** | **DECIDED** (SPEC §9.9)         | No web push in v1; notification center + anomaly alerts in-app. |
| D6 | **Vitals entry: manual only in v1** | **DECIDED** (SPEC §9.4)         | Device integrations (BT oximeters) are platform-fragmented and expensive. |
| D7 | **Patient profiles + shared roles from day one; multi-patient (2+ elders), isolated data** | **DECIDED**                     | SPEC §4.8 / §9.1: app tracks 2+ elders, independent and isolated data. |
| D8 | **AI chat: Cohere or Groq (free tier), CHAT-SPEC pattern + no-medical-advice guardrail** | **DECIDED**                     | SPEC §4.6 / §9.10: free-tier provider; chat also powers the AI health score (§4.10). ES-only output. |
| D9 | **i18n: Spanish (ES/ES) only** | **DECIDED** (SPEC §4.9 / §9.11) | The whole app is in Spanish of Spain. No i18n framework needed — single locale. |
| D10 | **Language: JavaScript (JSX), not TypeScript** | **DECIDED**                     | Shelter-ai (design reference) is JS; consistent with it. Don't mix. |
| D11 | **DB: Neon Postgres + `@neondatabase/serverless`** | **DECIDED**                     | Platform standard; branch-per-preview via Vercel integration. |
| D12 | **PWA: `@ducanh2912/next-pwa`, `next build --webpack`** | **DECIDED**                     | Platform requirement; Turbopack incompatible with PWA plugin. |
| D13 | **Monetization: no premium for the moment (family use)** | **DECIDED** (SPEC §1)           | Keep the Stripe tier scaffold for the platform but no paywall work in v1. |
| D14 | **Vitals in v1: photos AND video** | **DECIDED** (SPEC §9.8)         | Both media types from the start — uploads table already covers `photo \| video \| document`. |
| D15 | **Usability: text inputs, big elements, clear layout** | **DECIDED** (SPEC §4.11)        | App principle on every screen: plain text input, ≥44–48px targets, one obvious action per screen. |
| D16 | **Sharing: email invites with roles (owner/caregiver/viewer)** | **DECIDED** (SPEC §9.3)         | Owner invites caregivers by email; role enforcement on every route/query; admin approves the initial account (D1). |

---

## Rejected alternatives

| Alternative | Why rejected |
|-------------|--------------|
| Supabase (auth + storage) | Platform standard for this stack is Neon + magic links; shelter/prepper's Supabase usage is legacy there. |
| SQLite / local-first | Multi-caregiver sharing requires a server DB; offline-first adds sync complexity not needed for v1. |
| Field-level encryption with pgcrypto | Key management burden, breaks queries — see D3. |
