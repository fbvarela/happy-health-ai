import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

/**
 * GET /api/patients/[id]/incidents — list (viewer+).
 * POST /api/patients/[id]/incidents — create (caregiver+). { title, notes, severity }
 */
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const rows = await sql`
    SELECT i.id, i.title, i.notes, i.severity, i.created_at, i.updated_at,
           u.name AS created_by_name,
           COUNT(uploads.id)::int AS photo_count
    FROM incidents i
    LEFT JOIN users u ON u.id = i.created_by
    LEFT JOIN uploads ON uploads.incident_id = i.id AND uploads.deleted_at IS NULL
    WHERE i.patient_id = ${id} AND i.deleted_at IS NULL
    GROUP BY i.id, u.name
    ORDER BY i.created_at DESC
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

  const title = (body.title ?? "").trim();
  if (!title) return Response.json({ error: "El título es obligatorio" }, { status: 400 });
  const notes = (body.notes ?? "").trim() || null;
  const severity = ["green", "orange", "red"].includes(body.severity) ? body.severity : "green";

  const [row] = await sql`
    INSERT INTO incidents (patient_id, title, notes, severity, created_by)
    VALUES (${id}, ${title}, ${notes}, ${severity}, ${user.id})
    RETURNING id, title, notes, severity, created_at
  `;
  return Response.json(row, { status: 201 });
}
