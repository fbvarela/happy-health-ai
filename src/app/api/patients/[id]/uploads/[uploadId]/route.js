import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";
import { deleteFromR2 } from "@/lib/r2";

/**
 * PATCH  /api/patients/[id]/uploads/[uploadId] — update caption (caregiver+).
 * DELETE /api/patients/[id]/uploads/[uploadId] — soft delete + remove from R2.
 */
export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, uploadId } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const [existing] = await sql`
    SELECT id FROM uploads WHERE id = ${uploadId} AND patient_id = ${id} AND deleted_at IS NULL
  `;
  if (!existing) return Response.json({ error: "No encontrado" }, { status: 404 });

  if (body.caption !== undefined) {
    const caption = (body.caption ?? "").trim() || null;
    const [row] = await sql`
      UPDATE uploads SET caption = ${caption}, updated_at = now()
      WHERE id = ${uploadId}
      RETURNING id, caption, updated_at
    `;
    return Response.json(row);
  }
  return Response.json({ error: "Nada que actualizar" }, { status: 400 });
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, uploadId } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [existing] = await sql`
    SELECT r2_key FROM uploads WHERE id = ${uploadId} AND patient_id = ${id} AND deleted_at IS NULL
  `;
  if (!existing) return Response.json({ error: "No encontrado" }, { status: 404 });

  try {
    await deleteFromR2(existing.r2_key);
  } catch (err) {
    console.error("[uploads] r2 delete failed:", err?.message ?? err);
  }
  await sql`UPDATE uploads SET deleted_at = now(), updated_at = now() WHERE id = ${uploadId}`;
  return Response.json({ ok: true });
}
