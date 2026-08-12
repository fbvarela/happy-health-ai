import sql from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/metrics";

const COLORS = { ok: "verde", warn: "amarillo", alert: "rojo" };

/**
 * Computes the AI health score for a patient (SPEC §4.10): based on O2
 * saturation (main measure), other vitals and recent notes. Returns
 * { score, color, summary }. Used as chat context.
 */
export async function computeHealthScore(patientId) {
  const [settings] = await sql`
    SELECT spo2_min, hr_min, hr_max, temp_min, temp_max, bp_sys_max, bp_dia_max
    FROM patient_settings WHERE patient_id = ${patientId}
  `;
  const s = { ...DEFAULT_SETTINGS, ...(settings ?? {}) };

  // Latest value per metric (last 24h)
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const vitals = await sql`
    SELECT DISTINCT ON (type) type, value
    FROM vitals
    WHERE patient_id = ${patientId} AND deleted_at IS NULL AND measured_at >= ${since}
    ORDER BY type, measured_at DESC
  `;

  const flags = [];
  const latest = {};
  for (const v of vitals) latest[v.type] = Number(v.value);

  if (latest.spo2 !== undefined && latest.spo2 < Number(s.spo2_min)) {
    flags.push("spo2_baja");
  }
  if (latest.hr !== undefined && (latest.hr > Number(s.hr_max) || latest.hr < Number(s.hr_min))) {
    flags.push("fc_anormal");
  }
  if (latest.temp !== undefined && (latest.temp > Number(s.temp_max) || latest.temp < Number(s.temp_min))) {
    flags.push("temp_anormal");
  }
  if (latest.bp_systolic !== undefined && latest.bp_systolic > Number(s.bp_sys_max)) {
    flags.push("tension_alta");
  }

  // Recent notes (7 days) count as signal weight
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [noteCount] = await sql`
    SELECT COUNT(*)::int AS n FROM notes
    WHERE patient_id = ${patientId} AND deleted_at IS NULL AND created_at >= ${weekAgo}
  `;

  let score = 100 - flags.length * 20 - (noteCount?.n ?? 0) * 2;
  score = Math.max(0, Math.min(100, score));

  const color = flags.length === 0 ? COLORS.ok : flags.length === 1 ? COLORS.warn : COLORS.alert;

  const parts = [`score ${score}/100 (${color})`];
  if (latest.spo2 !== undefined) parts.push(`SpO2 ${latest.spo2}%`);
  if (latest.hr !== undefined) parts.push(`FC ${latest.hr}`);
  if (latest.temp !== undefined) parts.push(`T ${latest.temp}°C`);
  if (latest.bp_systolic !== undefined) parts.push(`TA ${latest.bp_systolic}/${latest.bp_diastolic ?? "?"}`);
  if (flags.length) parts.push(`alertas: ${flags.join(", ")}`);

  return { score, color, summary: parts.join(" · ") };
}
