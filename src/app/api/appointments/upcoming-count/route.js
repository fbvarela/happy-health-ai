import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";

/**
 * GET /api/appointments/upcoming-count — number of upcoming (future) appointments
 * across all patients the current user belongs to. Drives the badge on the
 * "Citas" menu option (same "upcoming" semantics as the citas page:
 * starts_at >= now, soft-deleted excluded).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await sql`
    SELECT COUNT(*)::int AS n
    FROM appointments a
    JOIN patient_members pm ON pm.patient_id = a.patient_id
    WHERE pm.user_id = ${user.id}
      AND a.deleted_at IS NULL
      AND a.starts_at >= now()
  `;
  return Response.json({ count: row?.n ?? 0 });
}
