import sql from "@/lib/db";

/**
 * Dashboard data (SPEC §13): for the active patient, the latest value of each
 * measure TODAY and YESTERDAY, plus the number of measures taken today.
 *
 * Count metrics (poo, night_events) use SUM of the day's counts; the rest use
 * the latest reading of the day. Day boundaries follow the DB server's local
 * day (date_trunc('day', now())), consistent with the old VitalTiles.
 */
export async function getDashboardData(patientId) {
  const rows = await sql`
    SELECT type, value, count, unit, measured_at,
           (measured_at >= date_trunc('day', now())) AS is_today,
           (measured_at >= date_trunc('day', now()) - interval '1 day'
            AND measured_at < date_trunc('day', now())) AS is_yesterday
    FROM vitals
    WHERE patient_id = ${patientId}
      AND deleted_at IS NULL
      AND measured_at >= date_trunc('day', now()) - interval '1 day'
    ORDER BY measured_at ASC
  `;

  const COUNT_METRICS = new Set(["poo", "night_events"]);
  const today = {};
  const yesterday = {};
  const todayCounts = {};

  for (const r of rows) {
    const bucket = r.is_today ? today : yesterday;

    if (COUNT_METRICS.has(r.type)) {
      bucket[r.type] = (bucket[r.type] ?? 0) + Number(r.count ?? r.value ?? 0);
    } else {
      bucket[r.type] = r; // rows ASC → overwrite keeps the latest of the day
    }

    if (r.is_today) todayCounts[r.type] = (todayCounts[r.type] ?? 0) + 1;
  }

  return { today, yesterday, todayCounts };
}
