import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

/**
 * POST /api/patients/[id]/members
 * Body: { userId, role } — owner only. Adds an approved user as a member
 * directly (no invite needed) and notifies them.
 */
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "owner");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const userId = body.userId;
  const role = ["viewer", "caregiver", "owner"].includes(body.role) ? body.role : "caregiver";
  if (!userId) return Response.json({ error: "Falta el usuario" }, { status: 400 });

  if (userId === user.id) {
    return Response.json({ error: "Ya eres miembro de este paciente" }, { status: 400 });
  }

  const [target] = await sql`
    SELECT id FROM users WHERE id = ${userId} AND status = 'approved'
  `;
  if (!target) return Response.json({ error: "Usuario no encontrado o no aprobado" }, { status: 404 });

  const [already] = await sql`
    SELECT 1 FROM patient_members WHERE patient_id = ${id} AND user_id = ${userId}
  `;
  if (already) return Response.json({ error: "Este usuario ya es miembro" }, { status: 400 });

  await sql`
    INSERT INTO patient_members (patient_id, user_id, role) VALUES (${id}, ${userId}, ${role})
  `;

  const [patient] = await sql`SELECT name FROM patients WHERE id = ${id}`;
  await sql`
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (${userId}, 'share_invite',
            'Nueva invitación',
            'Te han añadido como ${role === "viewer" ? "lector" : "cuidador"} de ${patient?.name ?? "un paciente"}.',
            ${JSON.stringify({ patient_id: id, role })})
  `;

  return Response.json({ ok: true });
}
