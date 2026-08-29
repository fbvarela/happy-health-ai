import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

/**
 * GET  /api/patients/[id]/locations — locations with contacts + current.
 * POST /api/patients/[id]/locations — create a location (owner only).
 */
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [current] = await sql`
    SELECT l.id, l.name
    FROM location_moves m
    JOIN locations l ON l.id = m.to_location_id
    WHERE m.patient_id = ${id}
    ORDER BY m.moved_at DESC
    LIMIT 1
  `;

  const locations = await sql`
    SELECT l.id, l.name, l.address, l.notes
    FROM locations l
    WHERE l.patient_id = ${id}
    ORDER BY l.created_at ASC
  `;

  const contacts = locations.length
    ? await sql`
        SELECT c.id, c.location_id, c.name, c.phone, c.kind
        FROM location_contacts c
        WHERE c.location_id IN (SELECT id FROM locations WHERE patient_id = ${id})
        ORDER BY c.created_at ASC
      `
    : [];

  return Response.json({
    current: current ?? null,
    locations: locations.map((l) => ({
      ...l,
      contacts: contacts.filter((c) => c.location_id === l.id),
    })),
    canEdit: ["owner", "caregiver"].includes(access.role),
  });
}

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

  const name = (body.name ?? "").trim();
  if (!name) return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const [location] = await sql`
    INSERT INTO locations (patient_id, name, address, notes, created_by)
    VALUES (${id}, ${name}, ${(body.address ?? "").trim() || null}, ${(body.notes ?? "").trim() || null}, ${user.id})
    RETURNING id, name, address, notes
  `;

  return Response.json({ ok: true, location });
}