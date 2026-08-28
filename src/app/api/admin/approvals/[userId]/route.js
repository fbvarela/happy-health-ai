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

  // Auto-accept pending invites for this email on approval.
  if (action === "approve") {
    const [approvedUser] = await sql`
      SELECT email FROM users WHERE id = ${userId}
    `;
    const pendingInvites = await sql`
      SELECT pi.id, pi.patient_id, pi.role, p.name AS patient_name
      FROM patient_invites pi
      JOIN patients p ON p.id = pi.patient_id
      WHERE LOWER(pi.email) = LOWER(${approvedUser.email}) AND pi.status = 'pending'
    `;
    for (const invite of pendingInvites) {
      await sql`
        INSERT INTO patient_members (patient_id, user_id, role)
        VALUES (${invite.patient_id}, ${userId}, ${invite.role})
        ON CONFLICT (patient_id, user_id) DO NOTHING
      `;
      await sql`
        UPDATE patient_invites SET status = 'accepted' WHERE id = ${invite.id}
      `;
      await sql`
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (${userId}, 'share_invite',
                'Nueva invitación',
                'Te han añadido como ${invite.role === "viewer" ? "lector" : "cuidador"} de ${invite.patient_name}.',
                ${JSON.stringify({ patient_id: invite.patient_id, role: invite.role })})
      `;
    }
  }

  await sql`
    INSERT INTO approvals (user_id, actor_id, action) VALUES (${userId}, ${user.id}, ${action})
  `;

  return Response.json({ ok: true, status: nextStatus });
}
