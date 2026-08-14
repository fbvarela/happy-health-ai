import sql from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/metrics";

const COLORS = { ok: "verde", warn: "naranja", alert: "rojo" };

/**
 * Computes the AI health score for a patient (SPEC §4.10): based on today's
 * SpO₂, mood, night events, walk check, other vitals and recent notes. Returns
 * { score, color, summary }. Used as chat context.
 */
export async function computeHealthScore(patientId) {
  const [settings] = await sql`
    SELECT spo2_min, hr_min, hr_max, temp_min, temp_max, bp_sys_max, bp_dia_max
    FROM patient_settings WHERE patient_id = ${patientId}
  `;
  const s = { ...DEFAULT_SETTINGS, ...(settings ?? {}) };

  // Today's values drive the visible score. Each component is normalized to
  // 0–100, then combined with SpO₂ as the most important component.
  const todayRows = await sql`
    SELECT type, value, count
    FROM vitals
    WHERE patient_id = ${patientId}
      AND deleted_at IS NULL
      AND measured_at >= date_trunc('day', now())
    ORDER BY measured_at DESC
  `;
  const todayLatest = {};
  let nightEvents = 0;
  let walked = false;
  for (const row of todayRows) {
    if (todayLatest[row.type] === undefined) todayLatest[row.type] = Number(row.value);
    if (row.type === "night_events") nightEvents += Number(row.count ?? row.value ?? 0);
    if (row.type === "walk") walked = true;
  }

  const spo2 = todayLatest.spo2;
  const mood = todayLatest.mood;
  const mealQuality = todayLatest.meal_quality;
  const spo2Score = spo2 === undefined ? 50 : Math.max(0, Math.min(100, 100 - Math.max(0, Number(s.spo2_min) - spo2) * 5));
  const moodScore = mood === undefined ? 50 : ({ 1: 20, 2: 60, 3: 100 }[mood] ?? 50);
  const mealScore = mealQuality === undefined ? 50 : ({ 1: 30, 2: 65, 3: 100 }[mealQuality] ?? 50);
  const nightScore = nightEvents === 0 ? 100 : nightEvents === 1 ? 85 : nightEvents === 2 ? 70 : nightEvents === 3 ? 55 : nightEvents === 4 ? 40 : 20;
  const walkScore = walked ? 100 : 40;

  // Latest value per metric (last 24h) for secondary anomaly flags.
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

  let score = Math.round(
    spo2Score * 0.45
      + moodScore * 0.15
      + mealScore * 0.15
      + nightScore * 0.1
      + walkScore * 0.15
      - (flags.length * 5)
      - ((noteCount?.n ?? 0) * 2)
  );
  score = Math.max(0, Math.min(100, score));

  const color = score >= 80 ? COLORS.ok : score >= 50 ? COLORS.warn : COLORS.alert;

  const parts = [`score ${score}/100 (${color})`];
  parts.push(`SpO₂ ${spo2 === undefined ? "sin dato" : `${spo2}%`}`);
  parts.push(`ánimo ${mood === undefined ? "sin dato" : mood}`);
  parts.push(`comidas ${mealQuality === undefined ? "sin dato" : mealQuality}`);
  parts.push(`nocturno ${nightEvents}`);
  parts.push(`paseo ${walked ? "sí" : "no"}`);
  if (latest.hr !== undefined) parts.push(`FC ${latest.hr}`);
  if (latest.temp !== undefined) parts.push(`T ${latest.temp}°C`);
  if (latest.bp_systolic !== undefined) parts.push(`TA ${latest.bp_systolic}/${latest.bp_diastolic ?? "?"}`);
  if (flags.length) parts.push(`alertas: ${flags.join(", ")}`);

  return { score, color, summary: parts.join(" · ") };
}
