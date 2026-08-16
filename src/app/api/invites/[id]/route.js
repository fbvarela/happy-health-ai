import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";

/**
 * POST /api/invites/[id]  Body: { action: "accept" | "decline" }
 * Accepting adds the user to patient_members with the invite's role.
 */
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let action;
  try {
    ({ action } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!["accept", "decline"].includes(action)) {
    return Response.json({ error: "action debe ser accept o decline" }, { status: 400 });
  }

  const [invite] = await sql`
    SELECT id, patient_id, email, role, status
    FROM patient_invites WHERE id = ${id} LIMIT 1
  `;
  if (!invite || invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return Response.json({ error: "Invitación no encontrada" }, { status: 404 });
  }
  if (invite.status !== "pending") {
    return Response.json({ error: "Invitación ya procesada" }, { status: 400 });
  }

  if (action === "accept") {
    await sql`
      INSERT INTO patient_members (patient_id, user_id, role)
      VALUES (${invite.patient_id}, ${user.id}, ${invite.role})
      ON CONFLICT (patient_id, user_id) DO UPDATE SET role = EXCLUDED.role
    `;
  }

  await sql`
    UPDATE patient_invites SET status = ${action === "accept" ? "accepted" : "declined"}
    WHERE id = ${id}
  `;

  return Response.json({ ok: true });
}
