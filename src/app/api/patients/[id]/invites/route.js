import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

/**
 * POST /api/patients/[id]/invites
 * Body: { email, role } — owner only. If the user exists and is approved,
 * they are added to patient_members directly; otherwise a pending invite is
 * created for when they sign up.
 */
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

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Email no válido" }, { status: 400 });
  }
  const role = ["viewer", "caregiver", "owner"].includes(body.role) ? body.role : "caregiver";

  if (email === user.email) {
    return Response.json({ error: "Ya eres miembro de este paciente" }, { status: 400 });
  }

  const [existing] = await sql`
    SELECT id, status FROM users WHERE email = ${email} LIMIT 1
  `;

  if (existing?.status === "approved") {
    const already = await sql`
      SELECT 1 FROM patient_members WHERE patient_id = ${id} AND user_id = ${existing.id}
    `;
    if (already[0]) {
      return Response.json({ error: "Este usuario ya es miembro" }, { status: 400 });
    }
    await sql`
      INSERT INTO patient_members (patient_id, user_id, role) VALUES (${id}, ${existing.id}, ${role})
    `;
    return Response.json({ ok: true, direct: true, email });
  }

  await sql`
    INSERT INTO patient_invites (patient_id, email, role, invited_by)
    VALUES (${id}, ${email}, ${role}, ${user.id})
    ON CONFLICT (patient_id, email) DO UPDATE SET
      role = EXCLUDED.role, status = 'pending', invited_by = EXCLUDED.invited_by
  `;
  return Response.json({ ok: true, direct: false, email });
}
