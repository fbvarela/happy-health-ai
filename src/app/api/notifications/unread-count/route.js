import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";

/** GET /api/notifications/unread-count — number of unread notifications. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await sql`
    SELECT COUNT(*)::int AS n
    FROM notifications
    WHERE user_id = ${user.id} AND read_at IS NULL
  `;
  return Response.json({ count: row?.n ?? 0 });
}
