import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

/**
 * POST /api/patients/[id]/locations/moves
 * Body: { toLocationId } — caregiver or owner. Records that the patient moved
 * to a location; the latest move is the current location.
 */
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const toLocationId = body.toLocationId;
  if (!toLocationId) return Response.json({ error: "Selecciona un lugar" }, { status: 400 });

  const [location] = await sql`
    SELECT id, name FROM locations WHERE id = ${toLocationId} AND patient_id = ${id}
  `;
  if (!location) return Response.json({ error: "El lugar no pertenece a este paciente" }, { status: 400 });

  const [move] = await sql`
    INSERT INTO location_moves (patient_id, to_location_id, created_by)
    VALUES (${id}, ${toLocationId}, ${user.id})
    RETURNING id, moved_at
  `;

  return Response.json({ ok: true, move, current: location });
}