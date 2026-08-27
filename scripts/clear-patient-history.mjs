import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

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
} catch {}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const TABLES = [
  "caregiver_handoffs",
  "medication_logs",
  "vitals",
  "notes",
  "uploads",
  "appointments",
  "incidents",
];

async function run() {
  const results = await Promise.all([
    sql`DELETE FROM caregiver_handoffs WHERE patient_id IN (SELECT id FROM patients)`,
    sql`DELETE FROM medication_logs WHERE patient_id IN (SELECT id FROM patients)`,
    sql`DELETE FROM vitals WHERE patient_id IN (SELECT id FROM patients)`,
    sql`DELETE FROM notes WHERE patient_id IN (SELECT id FROM patients)`,
    sql`DELETE FROM uploads WHERE patient_id IN (SELECT id FROM patients)`,
    sql`DELETE FROM appointments WHERE patient_id IN (SELECT id FROM patients)`,
    sql`DELETE FROM incidents WHERE patient_id IN (SELECT id FROM patients)`,
  ]);
  results.forEach((result, index) => {
    console.log(`${TABLES[index]}: ${result?.length ?? 0} rows affected`);
  });

  await sql`DELETE FROM medications`;
  console.log("medications: cleared");

  await sql`
    DELETE FROM notifications
    WHERE data->>'patient_id' IS NOT NULL
      AND data->>'patient_id' IN (SELECT id::text FROM patients)
  `;
  console.log("notifications: cleared");

  const [patientsAfter, membersAfter] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM patients`,
    sql`SELECT COUNT(*)::int AS n FROM patient_members`,
  ]);
  console.log(`patients kept: ${patientsAfter[0].n}`);
  console.log(`patient_members kept: ${membersAfter[0].n}`);
}

run().catch((err) => {
  console.error("Cleanup failed:", err?.message ?? err);
  process.exit(1);
});