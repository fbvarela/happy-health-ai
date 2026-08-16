import assert from "node:assert/strict";
import test from "node:test";
import { getWalkCalendarWindow, splitWalkRows } from "../src/lib/walk-check.mjs";

const now = new Date("2026-08-16T10:00:00");

test("separates today's walk from yesterday's walk at local midnight", () => {
  const rows = [
    { id: "today", type: "walk", measured_at: "2026-08-16T09:00:00" },
    { id: "yesterday", type: "walk", measured_at: "2026-08-15T23:59:00" },
    { id: "old", type: "walk", measured_at: "2026-08-14T10:00:00" },
    { id: "other", type: "mood", measured_at: "2026-08-16T08:00:00" },
  ];

  const result = splitWalkRows(rows, now);

  assert.equal(result.todayRecord.id, "today");
  assert.equal(result.yesterdayWalked, true);
});

test("a yesterday-only record leaves today's walk unchecked", () => {
  const result = splitWalkRows(
    [{ id: "yesterday", type: "walk", measured_at: "2026-08-15T23:59:00" }],
    now,
  );

  assert.equal(result.todayRecord, null);
  assert.equal(result.yesterdayWalked, true);
});

test("builds a local yesterday-midnight through today window", () => {
  const window = getWalkCalendarWindow(now);
  const yesterday = new Date(now);
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);

  assert.equal(window.from, yesterday.toISOString());
  assert.equal(window.to, now.toISOString());
});
