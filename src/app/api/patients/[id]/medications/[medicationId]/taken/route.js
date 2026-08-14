import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

function requestedDate(request, body) {
  const date = body?.date || new URL(request.url).searchParams.get("date");
  return /^\d{4}-\d{2}-\d{2}$/.test(date || "") ? date : null;
}

export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id, medicationId } = await params;
  if (!(await requirePatientAccess(user.id, id, "caregiver"))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  let body = {};
  try { body = await request.json(); } catch { /* use today */ }
  const date = requestedDate(request, body);
  const [medication] = await sql`
    SELECT id FROM medications WHERE id = ${medicationId} AND patient_id = ${id} AND active = true
  `;
  if (!medication) return Response.json({ error: "Medicación no encontrada" }, { status: 404 });

  const [log] = await sql`
    INSERT INTO medication_logs (medication_id, patient_id, taken_on, recorded_by)
    VALUES (${medicationId}, ${id}, COALESCE(${date}::date, CURRENT_DATE), ${user.id})
    ON CONFLICT (medication_id, taken_on) DO UPDATE SET taken_at = now(), recorded_by = ${user.id}
    RETURNING id, taken_on, taken_at
  `;
  return Response.json({ taken: true, ...log });
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id, medicationId } = await params;
  if (!(await requirePatientAccess(user.id, id, "caregiver"))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const date = requestedDate(request, null);
  await sql`
    DELETE FROM medication_logs
    WHERE medication_id = ${medicationId} AND patient_id = ${id}
      AND taken_on = COALESCE(${date}::date, CURRENT_DATE)
  `;
  return new Response(null, { status: 204 });
}
