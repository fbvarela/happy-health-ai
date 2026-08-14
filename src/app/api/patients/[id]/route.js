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

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  if (name !== undefined && !name) {
    return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const sets = [];
  const values = [];

  const fields = ["name", "dob", "gender", "allergies", "medications"];
  for (const f of fields) {
    if (body[f] !== undefined) {
      if (typeof body[f] === "string" && ["name", "allergies", "medications"].includes(f)) {
        values.push((body[f] ?? "").trim() || null);
      } else {
        values.push(body[f] || null);
      }
      sets.push(`"${f}" = $${values.length}`);
    }
  }
  if (sets.length === 0) {
    return Response.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  sets.push(`updated_at = now()`);
  values.push(id);

  const rows = await sql.query(
    `UPDATE patients SET ${sets.join(", ")} WHERE id = $${values.length}
     RETURNING id, name, dob, gender, allergies, medications, updated_at`,
    values
  );

  return Response.json(rows.rows[0]);
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
