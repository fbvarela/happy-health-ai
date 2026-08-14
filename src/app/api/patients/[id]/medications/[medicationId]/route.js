import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id, medicationId } = await params;
  if (!(await requirePatientAccess(user.id, id, "caregiver"))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  await sql`
    UPDATE medications SET active = false, updated_at = now()
    WHERE id = ${medicationId} AND patient_id = ${id}
  `;
  return new Response(null, { status: 204 });
}
