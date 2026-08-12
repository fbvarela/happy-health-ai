-- 02-remove-premium.sql — no plans/tiers/premium (personal use, D13)
-- Idempotent. Run via `npm run db:migrate`.

DROP TABLE IF EXISTS subscriptions;
