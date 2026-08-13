import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

/**
 * POST /api/patients/[id]/avatar  Body: { key }
 * Called after the browser PUT the avatar to R2 — sets patients.avatar_key.
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
  if (!key || !key.startsWith(`health/${user.id}/avatar-`)) {
    return Response.json({ error: "Clave de foto no válida" }, { status: 400 });
  }

  await sql`UPDATE patients SET avatar_key = ${key}, updated_at = now() WHERE id = ${id}`;
  return Response.json({ ok: true });
}
