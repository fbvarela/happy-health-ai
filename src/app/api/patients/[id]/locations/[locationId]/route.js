import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

/**
 * PATCH  /api/patients/[id]/locations/[locationId] — update (owner only).
 * DELETE /api/patients/[id]/locations/[locationId] — remove (owner only).
 */
export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, locationId } = await params;
  const access = await requirePatientAccess(user.id, id, "owner");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const [location] = await sql`
    UPDATE locations
    SET name = ${name},
        address = ${(body.address ?? "").trim() || null},
        notes = ${(body.notes ?? "").trim() || null}
    WHERE id = ${locationId} AND patient_id = ${id}
    RETURNING id, name, address, notes
  `;
  if (!location) return Response.json({ error: "Lugar no encontrado" }, { status: 404 });

  return Response.json({ ok: true, location });
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, locationId } = await params;
  const access = await requirePatientAccess(user.id, id, "owner");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [location] = await sql`
    DELETE FROM locations WHERE id = ${locationId} AND patient_id = ${id} RETURNING id
  `;
  if (!location) return Response.json({ error: "Lugar no encontrado" }, { status: 404 });

  return Response.json({ ok: true });
}