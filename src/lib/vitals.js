import sql from "@/lib/db";
import { METRICS, DEFAULT_SETTINGS } from "@/lib/metrics";
export { METRICS, DEFAULT_SETTINGS };

/** Returns the patient's threshold settings (with defaults for missing cols). */
export async function getSettings(patientId) {
  const rows = await sql`
    SELECT spo2_min, hr_min, hr_max, temp_min, temp_max, bp_sys_max, bp_dia_max
    FROM patient_settings WHERE patient_id = ${patientId} LIMIT 1
  `;
  return { ...DEFAULT_SETTINGS, ...(rows[0] ?? {}) };
}

/**
 * Checks a vital against thresholds and inserts a notification for every
 * member of the patient if it's out of range. Only run after insert.
 */
export async function checkVitalAlert(patientId, vital) {
  const s = await getSettings(patientId);

  let title = null;
  let body = null;
  const v = Number(vital.value);

  switch (vital.type) {
    case "spo2":
      if (v < Number(s.spo2_min)) {
        title = "Saturación baja";
        body = `SpO₂ de ${v}% (mínimo ${s.spo2_min}%)`;
      }
      break;
    case "hr":
      if (v > Number(s.hr_max)) {
        title = "Frecuencia cardíaca alta";
        body = `${v} ppm (máximo ${s.hr_max})`;
      } else if (v < Number(s.hr_min)) {
        title = "Frecuencia cardíaca baja";
        body = `${v} ppm (mínimo ${s.hr_min})`;
      }
      break;
    case "temp":
      if (v > Number(s.temp_max)) {
        title = "Temperatura alta";
        body = `${v} °C (máximo ${s.temp_max})`;
      } else if (v < Number(s.temp_min)) {
        title = "Temperatura baja";
        body = `${v} °C (mínimo ${s.temp_min})`;
      }
      break;
    case "bp_systolic":
      if (v > Number(s.bp_sys_max)) {
        title = "Tensión sistólica alta";
        body = `${v} mmHg (máximo ${s.bp_sys_max})`;
      }
      break;
    case "bp_diastolic":
      if (v > Number(s.bp_dia_max)) {
        title = "Tensión diastólica alta";
        body = `${v} mmHg (máximo ${s.bp_dia_max})`;
      }
      break;
    default:
      break; // poo — no thresholds
  }

  if (!title) return false;

  const members = await sql`
    SELECT user_id FROM patient_members WHERE patient_id = ${patientId}
  `;
  if (members.length === 0) return true;

  for (const m of members) {
    await sql`
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (${m.user_id}, 'vital_alert', ${title}, ${body},
              ${JSON.stringify({ patient_id: patientId, vital_type: vital.type, value: v })})
    `;
  }
  return true;
}
