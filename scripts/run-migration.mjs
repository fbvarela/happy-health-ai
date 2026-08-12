/**
 * Migration runner for Neon.
 * Applies src/db/migrations/*.sql (each split into statements) in order,
 * tracking applied files in schema_migrations. Idempotent and safe to re-run.
 *
 * Usage:
 *   npm run db:migrate
 *   DATABASE_URL=<url> npm run db:migrate
 *
 * Requires DATABASE_URL (falls back to .env.local).
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

// Load .env.local (handles Windows BOM + CRLF)
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath).toString("utf8").replace(/^\uFEFF/, "");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= val;
  }
} catch { /* rely on environment */ }

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

/** Split a SQL file into executable statements (respects $$ blocks). */
function splitStatements(text) {
  const statements = [];
  let current = "";
  let inDollar = false;
  let dollarTag = null;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (!inDollar && ch === "$") {
      const match = /^\$[A-Za-z_0-9]*\$/.exec(text.slice(i));
      if (match) {
        inDollar = true;
        dollarTag = match[0];
        current += match[0];
        i += match[0].length - 1;
        continue;
      }
    }
    if (inDollar) {
      current += ch;
      if (text.startsWith(dollarTag, i)) {
        inDollar = false;
        dollarTag = null;
        i += dollarTag.length - 1;
      }
      continue;
    }
    if (ch === ";") {
      if (current.trim()) statements.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function run() {
  const migrationsDir = join(process.cwd(), "src", "db", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  const applied = new Set(
    (await sql`SELECT name FROM schema_migrations`).map((r) => r.name),
  );

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skipping ${file} (already applied)`);
      continue;
    }
    console.log(`applying ${file}...`);
    const content = readFileSync(join(migrationsDir, file), "utf8");
    const statements = splitStatements(content);

    for (const statement of statements) {
      process.stdout.write("  .");
      await sql(statement);
    }
    console.log(` ✓ (${statements.length} statements)`);

    await sql`INSERT INTO schema_migrations (name) VALUES (${file})`;
    ran++;
  }

  console.log(ran ? `\nDone. Applied ${ran} migration(s).` : "\nNothing to do.");
}

run().catch((err) => {
  console.error("\nMigration failed:", err?.message ?? err);
  process.exit(1);
});
