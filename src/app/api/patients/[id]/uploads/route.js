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
    SELECT id, kind, r2_key, mime_type, size_bytes, caption, created_at, updated_at,
           u.name AS created_by_name
    FROM uploads
    LEFT JOIN users u ON u.id = created_by
    WHERE patient_id = ${id} AND deleted_at IS NULL
    ORDER BY created_at ASC
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

  const [row] = await sql`
    INSERT INTO uploads (patient_id, kind, r2_key, mime_type, size_bytes, caption, created_by)
    VALUES (${id}, ${kind}, ${key}, ${body.mime_type ?? null}, ${size}, ${caption}, ${user.id})
    RETURNING id, kind, r2_key, mime_type, size_bytes, caption, created_at
  `;
  return Response.json(row, { status: 201 });
}
