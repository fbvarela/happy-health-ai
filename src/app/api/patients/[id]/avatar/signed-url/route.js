import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";
import { buildKey, getSignedUploadUrl, hasR2Creds } from "@/lib/r2";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * POST /api/patients/[id]/avatar/signed-url
 * Body: { filename, mime_type, size_bytes } → presigned PUT for the avatar.
 */
export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  if (!hasR2Creds()) {
    return Response.json({ error: "El almacenamiento no está configurado (R2)." }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const mime = (body.mime_type ?? "").toLowerCase();
  if (!ALLOWED.includes(mime)) {
    return Response.json({ error: "Formato no permitido (JPG, PNG, WebP)" }, { status: 400 });
  }
  const size = Number(body.size_bytes);
  if (!size || size <= 0 || size > MAX_SIZE) {
    return Response.json({ error: "La foto supera el tamaño máximo (2 MB)" }, { status: 400 });
  }

  const key = `health/${user.id}/avatar-${Date.now()}-${crypto.randomUUID()}.${mime.split("/")[1]}`;
  const uploadUrl = await getSignedUploadUrl(key, mime);
  return Response.json({ uploadUrl, key });
}
