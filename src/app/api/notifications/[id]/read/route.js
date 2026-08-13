import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";

/** POST /api/notifications/[id]/read — mark one notification as read. */
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await sql`
    UPDATE notifications SET read_at = COALESCE(read_at, now())
    WHERE id = ${id} AND user_id = ${user.id}
  `;
  return Response.json({ ok: true });
}
