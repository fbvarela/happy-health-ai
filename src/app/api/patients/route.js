import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";

/**
 * GET /api/patients — patients the current user is a member of (with role).
 * POST /api/patients — create a patient (creator becomes owner).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`
    SELECT p.id, p.name, p.dob, p.gender, p.allergies, p.medications,
           p.created_at, pm.role
    FROM patients p
    JOIN patient_members pm ON pm.patient_id = p.id
    WHERE pm.user_id = ${user.id}
    ORDER BY p.created_at DESC
  `;
  return Response.json(rows);
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) {
    return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const dob = body.dob || null;
  const gender = body.gender || null;
  const allergies = (body.allergies ?? "").trim() || null;
  const medications = (body.medications ?? "").trim() || null;

  const rows = await sql`
    INSERT INTO patients (name, dob, gender, allergies, medications, created_by)
    VALUES (${name}, ${dob}, ${gender}, ${allergies}, ${medications}, ${user.id})
    RETURNING id, name, dob, gender, allergies, medications, created_at
  `;
  const patient = rows[0];

  await sql`
    INSERT INTO patient_members (patient_id, user_id, role)
    VALUES (${patient.id}, ${user.id}, 'owner')
  `;

  return Response.json({ ...patient, role: "owner" }, { status: 201 });
}
