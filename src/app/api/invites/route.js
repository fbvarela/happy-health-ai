import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";

/**
 * GET /api/invites — pending invites for the current user's email.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`
    SELECT pi.id, pi.role, pi.created_at,
           p.id AS patient_id, p.name AS patient_name
    FROM patient_invites pi
    JOIN patients p ON p.id = pi.patient_id
    WHERE LOWER(pi.email) = LOWER(${user.email}) AND pi.status = 'pending'
    ORDER BY pi.created_at DESC
  `;
  return Response.json(rows);
}
