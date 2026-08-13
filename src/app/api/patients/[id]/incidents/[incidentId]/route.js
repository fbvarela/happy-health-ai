import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";
import { getSignedFileUrl } from "@/lib/r2";

/**
 * GET    /api/patients/[id]/incidents/[incidentId] — incident + photos (viewer+).
 * PATCH  /api/patients/[id]/incidents/[incidentId] — update title/notes (caregiver+).
 * DELETE /api/patients/[id]/incidents/[incidentId] — soft delete (caregiver+).
 */
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, incidentId } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [incident] = await sql`
    SELECT id, title, notes, severity, active, created_at, updated_at
    FROM incidents
    WHERE id = ${incidentId} AND patient_id = ${id} AND deleted_at IS NULL
  `;
  if (!incident) return Response.json({ error: "No encontrado" }, { status: 404 });

  const photos = await sql`
    SELECT id, r2_key, mime_type, caption, created_at
    FROM uploads
    WHERE incident_id = ${incidentId} AND deleted_at IS NULL
    ORDER BY created_at ASC
  `;
  const withUrls = await Promise.all(
    photos.map(async (p) => ({
      ...p,
      url: await getSignedFileUrl(p.r2_key).catch(() => null),
    }))
  );

  return Response.json({ ...incident, photos: withUrls });
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, incidentId } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const fields = [];
  const values = [];
  if (body.title !== undefined) {
    const title = (body.title ?? "").trim();
    if (!title) return Response.json({ error: "El título es obligatorio" }, { status: 400 });
    values.push(title);
    fields.push(`title = $${values.length}`);
  }
  if (body.notes !== undefined) {
    values.push((body.notes ?? "").trim() || null);
    fields.push(`notes = $${values.length}`);
  }
  if (body.severity !== undefined) {
    if (!["green", "orange", "red"].includes(body.severity)) {
      return Response.json({ error: "Severidad no válida" }, { status: 400 });
    }
    values.push(body.severity);
    fields.push(`severity = $${values.length}`);
  }
  if (body.active !== undefined) {
    values.push(Boolean(body.active));
    fields.push(`active = $${values.length}`);
  }
  if (fields.length === 0) {
    return Response.json({ error: "Nada que actualizar" }, { status: 400 });
  }
  values.push(incidentId);
  fields.push(`updated_at = now()`);

  const rows = await sql.query(
    `UPDATE incidents SET ${fields.join(", ")} WHERE id = $${values.length}
     RETURNING id, title, notes, severity, active, updated_at`,
    values
  );
  return Response.json(rows.rows[0]);
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, incidentId } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  await sql`UPDATE incidents SET deleted_at = now(), updated_at = now() WHERE id = ${incidentId} AND patient_id = ${id}`;
  return Response.json({ ok: true });
}
