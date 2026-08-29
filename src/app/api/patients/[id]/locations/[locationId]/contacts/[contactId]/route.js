import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

const KINDS = ["emergency", "family", "doctor", "other"];

/**
 * PATCH  /api/patients/[id]/locations/[locationId]/contacts/[contactId] — update (owner only).
 * DELETE /api/patients/[id]/locations/[locationId]/contacts/[contactId] — remove (owner only).
 */
export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, locationId, contactId } = await params;
  const access = await requirePatientAccess(user.id, id, "owner");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim();
  if (!name || !phone) {
    return Response.json({ error: "Nombre y teléfono son obligatorios" }, { status: 400 });
  }
  const kind = KINDS.includes(body.kind) ? body.kind : "emergency";

  const [contact] = await sql`
    UPDATE location_contacts
    SET name = ${name}, phone = ${phone}, kind = ${kind}
    WHERE id = ${contactId} AND location_id = ${locationId}
    RETURNING id, location_id, name, phone, kind
  `;
  if (!contact) return Response.json({ error: "Contacto no encontrado" }, { status: 404 });

  return Response.json({ ok: true, contact });
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, locationId, contactId } = await params;
  const access = await requirePatientAccess(user.id, id, "owner");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [contact] = await sql`
    DELETE FROM location_contacts
    WHERE id = ${contactId} AND location_id = ${locationId}
    RETURNING id
  `;
  if (!contact) return Response.json({ error: "Contacto no encontrado" }, { status: 404 });

  return Response.json({ ok: true });
}