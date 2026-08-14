import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

/**
 * PATCH  /api/patients/[id]/notes/[noteId] — edit content/category/pinned (caregiver+).
 * DELETE /api/patients/[id]/notes/[noteId] — soft delete (caregiver+).
 */
export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, noteId } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const [existing] = await sql`
    SELECT id FROM notes WHERE id = ${noteId} AND patient_id = ${id} AND deleted_at IS NULL
  `;
  if (!existing) return Response.json({ error: "No encontrado" }, { status: 404 });

  const fields = [];
  const values = [];
  if (body.content !== undefined) {
    const content = (body.content ?? "").trim();
    if (!content) return Response.json({ error: "La nota no puede estar vacía" }, { status: 400 });
    values.push(content);
    fields.push(`content = $${values.length}`);
  }
  if (body.category !== undefined) {
    if (!["general", "medication", "doctor", "behavior"].includes(body.category)) {
      return Response.json({ error: "Categoría no válida" }, { status: 400 });
    }
    values.push(body.category);
    fields.push(`category = $${values.length}`);
  }
  if (body.pinned !== undefined) {
    values.push(Boolean(body.pinned));
    fields.push(`pinned = $${values.length}`);
  }
  if (fields.length === 0) {
    return Response.json({ error: "Nada que actualizar" }, { status: 400 });
  }
  values.push(noteId);
  fields.push(`updated_at = now()`);

  const rows = await sql(
    `UPDATE notes SET ${fields.join(", ")} WHERE id = $${values.length}
     RETURNING id, category, content, pinned, created_at, updated_at`,
    values
  );
  return Response.json(rows[0]);
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, noteId } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  await sql`UPDATE notes SET deleted_at = now() WHERE id = ${noteId} AND patient_id = ${id}`;
  return Response.json({ ok: true });
}
