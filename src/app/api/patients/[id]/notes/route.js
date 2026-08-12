import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

const CATEGORIES = ["general", "medication", "doctor", "behavior"];

/**
 * GET  /api/patients/[id]/notes — all non-deleted notes (viewer+).
 * POST /api/patients/[id]/notes — create (caregiver+). { category, content, pinned }
 */
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const rows = await sql`
    SELECT n.id, n.category, n.content, n.pinned, n.created_at, n.updated_at,
           u.name AS author_name
    FROM notes n
    LEFT JOIN users u ON u.id = n.created_by
    WHERE n.patient_id = ${id} AND n.deleted_at IS NULL
    ORDER BY n.pinned DESC, n.created_at DESC
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

  const content = (body.content ?? "").trim();
  if (!content) {
    return Response.json({ error: "La nota no puede estar vacía" }, { status: 400 });
  }
  const category = CATEGORIES.includes(body.category) ? body.category : "general";
  const pinned = Boolean(body.pinned);

  const [row] = await sql`
    INSERT INTO notes (patient_id, category, content, pinned, created_by)
    VALUES (${id}, ${category}, ${content}, ${pinned}, ${user.id})
    RETURNING id, category, content, pinned, created_at, updated_at
  `;
  return Response.json({ ...row, author_name: user.name }, { status: 201 });
}
