import sql from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/user";

/** POST /api/calendar/disconnect — revokes the caregiver's calendar link. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Clear google_event_id on this user's appointments so nothing points to a dead event
  await sql`
    UPDATE appointments SET google_event_id = NULL
    WHERE google_event_id IS NOT NULL
      AND created_by = ${user.id}
  `;

  await sql`DELETE FROM google_calendar_tokens WHERE user_id = ${user.id}`;
  return Response.json({ ok: true });
}
