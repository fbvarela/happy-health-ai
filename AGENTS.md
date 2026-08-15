# Happy Health AI

- Read `CLAUDE.md`, `docs/SPEC.md`, `docs/PLAN.md`, and `docs/DECISIONS.md` before starting a feature phase; they contain project decisions not visible in filenames.
- This is a Next.js 16 App Router app using JavaScript only, Tailwind v4, and the `@/*` alias for `src/*`; do not introduce TypeScript.
- Use `npm run dev` for development, `npm run lint` for linting, and `npm run build` for production verification.
- Always build with `--webpack`; `@ducanh2912/next-pwa` is webpack-dependent and plain `next build` is not valid here.
- There is no general `npm test` script; `npm run test:r2` is an integration check requiring R2 credentials from `.env.local` or the environment.
- Run database migrations with `npm run db:migrate`; the runner reads `DATABASE_URL` or `.env.local`, applies sorted `src/db/migrations/*.sql`, and records filenames in `schema_migrations`.
- Keep server components as the default; add `"use client"` only for interactive state, effects, browser APIs, or client context.
- API handlers live under `src/app/api`, return `Response.json(...)`, and normally authenticate with `getCurrentUser()` before checking resource access.
- Patient data is sensitive: do not log it, and keep R2 objects private behind signed URLs.
- Authentication is Google OAuth with admin approval; elders do not log in and there is no password or magic-link flow.
- Chat responses must be Spanish (`es-ES`) and retain the no-medical-advice guardrail in `src/lib/chat.js`.
- The app is Spanish-first and mobile-accessible: preserve large touch targets, plain inputs, and the existing desktop sidebar/mobile bottom-navigation pattern.

## Rules for the Agent
- Before acting, check if any skills from `.opencode/skills/` apply.
- If applicable, **you must** invoke the `skills_<name>` tool.
- Do not jump directly to the implementation without using the skill.

## Sub-agent Automation
- **After any code change**, you must automatically invoke the `tester` agent using the `task` tool.
- **Before finalizing a feature**, you must invoke the `reviewer` agent.
- **Always** summarize the results for the user.