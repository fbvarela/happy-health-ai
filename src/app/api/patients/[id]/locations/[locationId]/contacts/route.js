import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

const KINDS = ["emergency", "family", "doctor", "other"];

/**
 * POST /api/patients/[id]/locations/[locationId]/contacts
 * Body: { name, phone, kind } — owner only.
 */
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, locationId } = await params;
  const access = await requirePatientAccess(user.id, id, "owner");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [location] = await sql`
    SELECT id FROM locations WHERE id = ${locationId} AND patient_id = ${id}
  `;
  if (!location) return Response.json({ error: "Lugar no encontrado" }, { status: 404 });

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
    INSERT INTO location_contacts (location_id, name, phone, kind)
    VALUES (${locationId}, ${name}, ${phone}, ${kind})
    RETURNING id, location_id, name, phone, kind
  `;

  return Response.json({ ok: true, contact });
}