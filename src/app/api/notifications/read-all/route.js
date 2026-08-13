import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";

/** POST /api/notifications/read-all — mark all as read. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await sql`
    UPDATE notifications SET read_at = COALESCE(read_at, now())
    WHERE user_id = ${user.id} AND read_at IS NULL
  `;
  return Response.json({ ok: true });
}
