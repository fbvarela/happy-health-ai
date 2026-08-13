import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";

/**
 * GET /api/users/caregivers?patientId=<id>
 * Lists approved users that could care for a patient (excludes current members
 * and the caller). Used by the owner to pick caregivers at will.
 */
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patientId = new URL(request.url).searchParams.get("patientId");
  if (!patientId) return Response.json({ error: "Falta patientId" }, { status: 400 });

  const rows = await sql`
    SELECT u.id, u.email, u.name
    FROM users u
    WHERE u.status = 'approved'
      AND u.id <> ${user.id}
      AND NOT EXISTS (
        SELECT 1 FROM patient_members pm
        WHERE pm.patient_id = ${patientId} AND pm.user_id = u.id
      )
    ORDER BY u.name, u.email
  `;
  return Response.json(rows);
}
