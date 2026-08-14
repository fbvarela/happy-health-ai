import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

/**
 * GET    /api/patients/[id] — patient detail + members + pending invites.
 * PATCH  /api/patients/[id] — update (owner/caregiver).
 * DELETE /api/patients/[id] — delete (owner only).
 */
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [patient] = await sql`
    SELECT p.id, p.name, p.dob, p.gender, p.allergies, p.medications,
           p.created_at, p.updated_at
    FROM patients p WHERE p.id = ${id}
  `;

  const members = await sql`
    SELECT pm.role, u.id, u.email, u.name
    FROM patient_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.patient_id = ${id}
    ORDER BY pm.role DESC, u.name
  `;

  const invites = await sql`
    SELECT pi.id, pi.email, pi.role, pi.status, pi.created_at
    FROM patient_invites pi
    WHERE pi.patient_id = ${id} AND pi.status = 'pending'
    ORDER BY pi.created_at DESC
  `;

  return Response.json({ ...patient, role: access.role, members, invites });
}

export async function PATCH(request, { params }) {
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

  const [existing] = await sql`
    SELECT name, dob, gender, allergies, medications
    FROM patients WHERE id = ${id}
  `;
  if (!existing) return Response.json({ error: "Paciente no encontrado" }, { status: 404 });

  const name = typeof body.name === "string" ? body.name.trim() : existing.name;
  if (!name) {
    return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const dob = body.dob !== undefined ? (body.dob || null) : existing.dob;
  const gender = body.gender !== undefined ? (body.gender || null) : existing.gender;
  const allergies = body.allergies !== undefined
    ? ((body.allergies ?? "").trim() || null)
    : existing.allergies;
  const medications = body.medications !== undefined
    ? ((body.medications ?? "").trim() || null)
    : existing.medications;

  const rows = await sql`
    UPDATE patients
    SET name = ${name}, dob = ${dob}, gender = ${gender},
        allergies = ${allergies}, medications = ${medications}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, name, dob, gender, allergies, medications, updated_at
  `;

  return Response.json(rows[0]);
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "owner");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  await sql`DELETE FROM patients WHERE id = ${id}`;
  return Response.json({ ok: true });
}
