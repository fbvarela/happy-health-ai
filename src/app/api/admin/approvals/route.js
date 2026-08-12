import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";

/**
 * GET /api/admin/approvals — pending users (admin only).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await sql`
    SELECT id, email, name, created_at
    FROM users
    WHERE status = 'pending'
    ORDER BY created_at ASC
  `;
  return Response.json(rows);
}
