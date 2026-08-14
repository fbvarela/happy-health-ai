import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";
import { checkVitalAlert } from "@/lib/vitals";

const VALID_TYPES = ["spo2", "hr", "bp_systolic", "bp_diastolic", "temp", "poo", "mood", "night_events"];

/**
 * GET /api/patients/[id]/vitals?from=&to= — vitals in range (caregiver+).
 * POST /api/patients/[id]/vitals — record a reading.
 *   Body: { type, value, count?, measured_at, device, notes }
 *   For blood pressure send type="bp" with { systolic, diastolic } → two rows.
 */
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const days = url.searchParams.get("days");
  const fromEffective =
    from ?? (days ? new Date(Date.now() - Number(days) * 86400000).toISOString() : null);

  const rows = await sql`
    SELECT id, patient_id, type, value, count, unit, measured_at, device, notes, created_by
    FROM vitals
    WHERE patient_id = ${id}
      AND deleted_at IS NULL
      AND (${fromEffective}::timestamptz IS NULL OR measured_at >= ${fromEffective}::timestamptz)
      AND (${to}::timestamptz IS NULL OR measured_at <= ${to}::timestamptz)
    ORDER BY measured_at DESC
  `;
  return Response.json(rows);
}

export async function POST(request, { params }) {
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

  const measuredAt = body.measured_at ? new Date(body.measured_at) : new Date();
  if (Number.isNaN(measuredAt.getTime())) {
    return Response.json({ error: "Fecha no válida" }, { status: 400 });
  }
  const device = (body.device ?? "").trim() || null;
  const notes = (body.notes ?? "").trim() || null;

  const inputs = [];

  if (body.type === "bp") {
    const sys = Number(body.systolic);
    const dia = Number(body.diastolic);
    if (!sys || !dia || sys <= 0 || dia <= 0) {
      return Response.json({ error: "Introduce tensión sistólica y diastólica" }, { status: 400 });
    }
    inputs.push({ type: "bp_systolic", value: sys, unit: "mmHg" });
    inputs.push({ type: "bp_diastolic", value: dia, unit: "mmHg" });
  } else {
    const type = body.type;
    if (!VALID_TYPES.includes(type)) {
      return Response.json({ error: "Tipo de constante no válido" }, { status: 400 });
    }
    if (type === "poo" || type === "night_events") {
      const count = Number(body.count) > 0 ? Number(body.count) : 1;
      inputs.push({ type, value: count, unit: "", count });
    } else if (type === "mood") {
      const value = Number(body.value);
      if (!value || value < 1 || value > 5) {
        return Response.json({ error: "Elige un estado de ánimo (1–5)" }, { status: 400 });
      }
      inputs.push({ type, value, unit: "", count: null });
    } else {
      const value = Number(body.value);
      if (!value || value <= 0) {
        return Response.json({ error: "Introduce un valor" }, { status: 400 });
      }
      const unit =
        type === "temp" ? "°C" : type === "spo2" ? "%" : type === "hr" ? "ppm" : "mmHg";
      inputs.push({ type, value, unit, count: null });
    }
  }

  const created = [];
  for (const input of inputs) {
    const [row] = await sql`
      INSERT INTO vitals (patient_id, type, value, unit, count, measured_at, device, notes, created_by)
      VALUES (${id}, ${input.type}, ${input.value}, ${input.unit}, ${input.count}, ${measuredAt}, ${device}, ${notes}, ${user.id})
      RETURNING id, patient_id, type, value, count, unit, measured_at, device, notes
    `;
    created.push(row);
    await checkVitalAlert(id, row);
  }

  return Response.json({ vitals: created }, { status: 201 });
}
