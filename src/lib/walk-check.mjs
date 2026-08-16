function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getWalkCalendarWindow(now = new Date()) {
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return { from: yesterday.toISOString(), to: new Date(now).toISOString() };
}

export function splitWalkRows(rows, now = new Date()) {
  const today = startOfDay(now).toDateString();
  const yesterday = new Date(startOfDay(now));
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toDateString();
  const walkRows = (rows ?? []).filter((row) => row.type === "walk");
  return {
    todayRecord: walkRows.find((row) => new Date(row.measured_at).toDateString() === today) ?? null,
    yesterdayWalked: walkRows.some((row) => new Date(row.measured_at).toDateString() === yesterdayKey),
  };
}
