import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";
import { buildKey, getSignedUploadUrl, hasR2Creds } from "@/lib/r2";

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "video/mp4", "video/quicktime", "application/pdf"];

function kindFromMime(mime) {
  if (mime?.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "document";
  return "photo";
}

/**
 * POST /api/patients/[id]/uploads/signed-url
 * Body: { filename, mime_type, size_bytes }
 * Returns a presigned PUT URL (10 min) so the browser uploads directly to R2
 * (private bucket, Pattern B). Then the client calls /confirm to create the row.
 */
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  if (!hasR2Creds()) {
    return Response.json(
      { error: "El almacenamiento no está configurado (R2)." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const mime = (body.mime_type ?? "").toLowerCase();
  if (!ALLOWED_TYPES.includes(mime)) {
    return Response.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }
  const size = Number(body.size_bytes);
  if (!size || size <= 0 || size > MAX_SIZE) {
    return Response.json({ error: "El archivo supera el tamaño máximo (15 MB)" }, { status: 400 });
  }

  const filename = (body.filename ?? "").trim() || `upload.${mime.split("/")[1] ?? "bin"}`;
  const key = buildKey(user.id, filename);

  const uploadUrl = await getSignedUploadUrl(key, mime);
  return Response.json({ uploadUrl, key, kind: kindFromMime(mime) });
}
