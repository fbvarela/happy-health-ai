import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";

/**
 * POST /api/admin/approvals/[userId]
 * Body: { action: "approve" | "deny" } — admin only. Logs to `approvals`.
 */
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  if (!userId) {
    return Response.json({ error: "Missing user id" }, { status: 400 });
  }

  let action;
  try {
    ({ action } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!["approve", "deny"].includes(action)) {
    return Response.json({ error: "action must be approve or deny" }, { status: 400 });
  }

  const target = await sql`
    SELECT id FROM users WHERE id = ${userId} AND status = 'pending' LIMIT 1
  `;
  if (!target[0]) {
    return Response.json({ error: "User not found or not pending" }, { status: 404 });
  }

  const nextStatus = action === "approve" ? "approved" : "denied";
  await sql`
    UPDATE users SET status = ${nextStatus} WHERE id = ${userId}
  `;
  await sql`
    INSERT INTO approvals (user_id, actor_id, action) VALUES (${userId}, ${user.id}, ${action})
  `;

  return Response.json({ ok: true, status: nextStatus });
}
