# Happy Health AI — Launch Checklist

> Phase 8 of `docs/PLAN.md`. Operational steps that must be done by hand
> (credentials, dashboards, prod DB). Code is complete once these pass.

## 1. Production database

- [ ] Run all migrations against the production Neon DB:
      ```bash
      DATABASE_URL="<production connection string>" npm run db:migrate
      # or, if you have the prod URL in your shell:
      npm run db:migrate:prod
      ```
      Expect: `00-schema` … `06-uploads` applied.
- [ ] Neon **branch-per-preview** integration (Vercel → Neon) so previews use their own DB.

## 2. Environment variables on Vercel (Production + Preview)

Verify each is set:

| Var | Where from |
|-----|-----------|
| `DATABASE_URL` | Neon (pooled) |
| `NEXT_PUBLIC_APP_URL` | `https://health.happyfactory.app` |
| `SESSION_SECRET` | ≥ 32 chars, matches local |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | GCP OAuth client |
| `GOOGLE_REDIRECT_URI` | `https://health.happyfactory.app/api/auth/callback` |
| `GOOGLE_CALENDAR_REDIRECT_URI` | `https://health.happyfactory.app/api/calendar/callback` |
| `ADMIN_EMAILS` | comma-separated admin accounts |
| `GROQ_API_KEY` or `COHERE_API_KEY` | chat provider (free tier) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare R2 |
| `R2_PRIVATE_BUCKET_NAME` | `happyfactory-private` |

## 3. Google Cloud OAuth client

- [ ] Authorized redirect URIs include:
      - `https://health.happyfactory.app/api/auth/callback`
      - `https://health.happyfactory.app/api/calendar/callback`
- [ ] Consent screen: publish to **Production** (or keep Testing with all users as testers).

## 4. Production smoke test (on a phone + desktop)

- [ ] Google sign-in creates an **approved admin** (ADMIN_EMAILS) directly → `/dashboard`
- [ ] A second account signs in → `/pending` → admin approves → reaches dashboard
- [ ] Record a vital → appears in timeline + trend chart
- [ ] Record a low SpO₂ → notification created, unread badge appears
- [ ] Create appointment → appears in Google Calendar (one-way)
- [ ] Upload a photo → visible in gallery + carrousel (signed URL)
- [ ] Chat bubble → ask about vitals → ES answer, no medical advice
- [ ] `/privacy` and `/disclaimer` load
- [ ] PWA installable, offline fallback works

## 5. Soft launch

- [ ] Add `health.happyfactory.app` domain in Vercel (if not already)
- [ ] Share the link with the care circle
- [ ] Announce
