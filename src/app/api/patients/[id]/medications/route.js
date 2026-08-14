import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

const GROUPS = ["breakfast", "lunch", "supper"];

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await requirePatientAccess(user.id, id, "viewer"))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const date = new URL(request.url).searchParams.get("date") || null;
  const rows = await sql`
    SELECT m.id, m.patient_id, m.name, m.quantity, m.meal_group, m.active,
           (l.id IS NOT NULL) AS taken,
           l.taken_at
    FROM medications m
    LEFT JOIN medication_logs l
      ON l.medication_id = m.id
     AND l.taken_on = COALESCE(${date}::date, CURRENT_DATE)
    WHERE m.patient_id = ${id} AND m.active = true
    ORDER BY CASE m.meal_group WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 ELSE 3 END,
             m.name
  `;
  return Response.json(rows);
}

export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await requirePatientAccess(user.id, id, "caregiver"))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  const quantity = (body.quantity ?? "").trim();
  const mealGroup = body.meal_group;
  if (!name || !quantity || !GROUPS.includes(mealGroup)) {
    return Response.json({ error: "Nombre, cantidad y grupo son obligatorios" }, { status: 400 });
  }

  const [row] = await sql`
    INSERT INTO medications (patient_id, name, quantity, meal_group, created_by)
    VALUES (${id}, ${name}, ${quantity}, ${mealGroup}, ${user.id})
    RETURNING id, patient_id, name, quantity, meal_group, active
  `;
  return Response.json(row, { status: 201 });
}
