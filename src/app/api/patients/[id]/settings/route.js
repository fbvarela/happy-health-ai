import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";
import { DEFAULT_SETTINGS } from "@/lib/vitals";

const FIELDS = ["spo2_min", "hr_min", "hr_max", "temp_min", "temp_max", "bp_sys_max", "bp_dia_max"];

/** GET /api/patients/[id]/settings — thresholds (viewer+). */
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [row] = await sql`
    SELECT spo2_min, hr_min, hr_max, temp_min, temp_max, bp_sys_max, bp_dia_max
    FROM patient_settings WHERE patient_id = ${id}
  `;
  return Response.json({ ...DEFAULT_SETTINGS, ...(row ?? {}) });
}

/** PUT /api/patients/[id]/settings — update thresholds (caregiver+). */
export async function PUT(request, { params }) {
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

  const sets = [];
  const values = [];
  for (const f of FIELDS) {
    const v = Number(body[f]);
    if (body[f] !== undefined && !Number.isNaN(v) && v > 0) {
      values.push(v);
      sets.push(`"${f}" = $${values.length}`);
    }
  }
  if (sets.length === 0) {
    return Response.json({ error: "Nada que actualizar" }, { status: 400 });
  }
  values.push(id);
  sets.push(`updated_at = now()`);

  await sql.query(
    `INSERT INTO patient_settings (patient_id) VALUES ($${values.length})
     ON CONFLICT (patient_id) DO NOTHING`,
    [id]
  );
  await sql.query(
    `UPDATE patient_settings SET ${sets.join(", ")} WHERE patient_id = $${values.length}`,
    values
  );

  const [row] = await sql`
    SELECT spo2_min, hr_min, hr_max, temp_min, temp_max, bp_sys_max, bp_dia_max
    FROM patient_settings WHERE patient_id = ${id}
  `;
  return Response.json(row);
}
