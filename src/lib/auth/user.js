import sql from "@/lib/db";
import { getSession } from "@/lib/session";
import { getEnv } from "@/lib/env";

/** Loads the session user from the DB (status, role included) or null. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;

  const rows = await sql`
    SELECT id, email, name, locale, role, status, google_id, avatar_url
    FROM users
    WHERE id = ${session.userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/** True if the email is in the ADMIN_EMAILS env var (comma-separated). */
export function isAdminEmail(email) {
  if (!email) return false;
  const admins = (getEnv("ADMIN_EMAILS") ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
