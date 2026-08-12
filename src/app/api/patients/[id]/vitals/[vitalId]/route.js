import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

/**
 * PATCH  /api/patients/[id]/vitals/[vitalId] — edit a reading (caregiver+).
 * DELETE /api/patients/[id]/vitals/[vitalId] — soft delete (caregiver+).
 */
export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, vitalId } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const [existing] = await sql`
    SELECT id FROM vitals WHERE id = ${vitalId} AND patient_id = ${id} AND deleted_at IS NULL
  `;
  if (!existing) return Response.json({ error: "No encontrado" }, { status: 404 });

  const fields = [];
  const values = [];
  for (const f of ["value", "count", "device", "notes"]) {
    if (body[f] !== undefined) {
      values.push(f);
      if (f === "device" || f === "notes") values.push((body[f] ?? "").trim() || null);
      else values.push(body[f]);
      fields.push(`"${f}" = $${values.length}`);
    }
  }
  if (body.measured_at) {
    const t = new Date(body.measured_at);
    if (!Number.isNaN(t.getTime())) {
      values.push(t);
      fields.push(`measured_at = $${values.length}`);
    }
  }
  if (fields.length === 0) {
    return Response.json({ error: "Nada que actualizar" }, { status: 400 });
  }
  values.push(vitalId);
  fields.push(`updated_at = now()`);

  const rows = await sql.query(
    `UPDATE vitals SET ${fields.join(", ")} WHERE id = $${values.length}
     RETURNING id, type, value, count, unit, measured_at, device, notes`,
    values
  );
  return Response.json(rows.rows[0]);
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, vitalId } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  await sql`UPDATE vitals SET deleted_at = now() WHERE id = ${vitalId} AND patient_id = ${id}`;
  return Response.json({ ok: true });
}
