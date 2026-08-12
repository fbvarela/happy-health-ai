import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

/**
 * PATCH  /api/patients/[id]/members/[userId] — change role (owner only).
 * DELETE /api/patients/[id]/members/[userId] — remove a member (owner only;
 *         cannot remove yourself or the last owner).
 */
export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, userId } = await params;
  const access = await requirePatientAccess(user.id, id, "owner");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const role = body.role;
  if (!["viewer", "caregiver", "owner"].includes(role)) {
    return Response.json({ error: "Rol no válido" }, { status: 400 });
  }

  const [member] = await sql`
    SELECT role FROM patient_members WHERE patient_id = ${id} AND user_id = ${userId}
  `;
  if (!member) return Response.json({ error: "Miembro no encontrado" }, { status: 404 });

  // You cannot demote the last owner
  if (userId !== user.id && member.role === "owner") {
    const [ownerCount] = await sql`
      SELECT COUNT(*)::int AS n FROM patient_members
      WHERE patient_id = ${id} AND role = 'owner'
    `;
    if ((ownerCount?.n ?? 0) <= 1) {
      return Response.json(
        { error: "No puedes cambiar el rol del último propietario." },
        { status: 400 }
      );
    }
  }

  await sql`
    UPDATE patient_members SET role = ${role}
    WHERE patient_id = ${id} AND user_id = ${userId}
  `;
  return Response.json({ ok: true, role });
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, userId } = await params;
  const access = await requirePatientAccess(user.id, id, "owner");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  if (userId === user.id) {
    return Response.json({ error: "No puedes eliminarte a ti mismo." }, { status: 400 });
  }

  const [member] = await sql`
    SELECT role FROM patient_members WHERE patient_id = ${id} AND user_id = ${userId}
  `;
  if (!member) return Response.json({ error: "Miembro no encontrado" }, { status: 404 });

  if (member.role === "owner") {
    const [ownerCount] = await sql`
      SELECT COUNT(*)::int AS n FROM patient_members
      WHERE patient_id = ${id} AND role = 'owner'
    `;
    if ((ownerCount?.n ?? 0) <= 1) {
      return Response.json(
        { error: "No puedes eliminar al último propietario." },
        { status: 400 }
      );
    }
  }

  await sql`
    DELETE FROM patient_members WHERE patient_id = ${id} AND user_id = ${userId}
  `;
  return Response.json({ ok: true });
}
