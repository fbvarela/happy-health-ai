import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

/**
 * GET /api/patients/[id]/emergencies — list (viewer+).
 * POST /api/patients/[id]/emergencies — create (caregiver+).
 * { type, details, resolved }
 */
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const rows = await sql`
    SELECT e.id, e.type, e.details, e.resolved, e.created_at, e.updated_at,
           u.name AS created_by_name
    FROM emergencies e
    LEFT JOIN users u ON u.id = e.created_by
    WHERE e.patient_id = ${id} AND e.deleted_at IS NULL
    ORDER BY e.created_at DESC
  `;
  return Response.json(rows);
}

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

  const type = (body.type ?? "").trim();
  if (!type) return Response.json({ error: "El tipo de emergencia es obligatorio" }, { status: 400 });
  const details = (body.details ?? "").trim() || null;
  const resolved = Boolean(body.resolved);

  const [row] = await sql`
    INSERT INTO emergencies (patient_id, type, details, resolved, created_by)
    VALUES (${id}, ${type}, ${details}, ${resolved}, ${user.id})
    RETURNING id, type, details, resolved, created_at
  `;
  return Response.json(row, { status: 201 });
}