import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";
import { getSignedFileUrl } from "@/lib/r2";

const VALID_KINDS = ["photo", "video", "document"];

/**
 * GET /api/patients/[id]/uploads — list uploads (viewer+) with signed URLs.
 */
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const rows = await sql`
    SELECT uploads.id, uploads.kind, uploads.r2_key, uploads.mime_type, uploads.size_bytes,
           uploads.caption, uploads.created_at, uploads.updated_at,
           u.name AS created_by_name
    FROM uploads
    LEFT JOIN users u ON u.id = uploads.created_by
    WHERE uploads.patient_id = ${id} AND uploads.deleted_at IS NULL
    ORDER BY uploads.created_at ASC
  `;

  // Sign all URLs (1h). Map r2_key -> signed url.
  const items = await Promise.all(
    rows.map(async (r) => {
      let url = null;
      try {
        url = await getSignedFileUrl(r.r2_key);
      } catch (err) {
        console.error("[uploads] sign failed:", err?.message ?? err);
      }
      return { ...r, url };
    })
  );
  return Response.json(items);
}

/**
 * POST /api/patients/[id]/uploads/confirm
 * Body: { key, kind, mime_type, size_bytes, caption }
 * Called AFTER the browser PUT the file to R2 — creates the DB row.
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

  const key = (body.key ?? "").trim();
  if (!key) return Response.json({ error: "Falta la clave del archivo" }, { status: 400 });
  if (!key.startsWith(`health/${user.id}/`)) {
    return Response.json({ error: "Clave de archivo no válida" }, { status: 400 });
  }
  const kind = VALID_KINDS.includes(body.kind) ? body.kind : "photo";
  const caption = (body.caption ?? "").trim() || null;
  const size = Number(body.size_bytes) || null;
  const incidentId = body.incident_id || null;

  // If referencing an incident, verify it belongs to this patient
  if (incidentId) {
    const [inc] = await sql`
      SELECT id FROM incidents WHERE id = ${incidentId} AND patient_id = ${id} AND deleted_at IS NULL
    `;
    if (!inc) return Response.json({ error: "Incidente no encontrado" }, { status: 404 });
  }

  const [row] = await sql`
    INSERT INTO uploads (patient_id, kind, r2_key, mime_type, size_bytes, caption, created_by, incident_id)
    VALUES (${id}, ${kind}, ${key}, ${body.mime_type ?? null}, ${size}, ${caption}, ${user.id}, ${incidentId})
    RETURNING id, kind, r2_key, mime_type, size_bytes, caption, created_at, incident_id
  `;
  return Response.json(row, { status: 201 });
}
