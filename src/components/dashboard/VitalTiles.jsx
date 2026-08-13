"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import api from "@/utils/api";

/**
 * Dashboard "how is she today?" tiles (SPEC §4.10, §13):
 * - Latest value per measure (ANY time), color-coded green/orange/red by thresholds
 * - Small warning ball if the latest measure is NOT from today
 * - Click a tile → patient history (timeline of that measure)
 * - Poo: one-tap increment, no modal — creates a log entry with current time
 * - Incidents tile: count + worst-severity color; click → last incident
 */

function tileColor(type, value, s) {
  const v = Number(value);
  if (type === "spo2") return v < Number(s.spo2_min) ? "red" : v < Number(s.spo2_min) + 3 ? "orange" : "green";
  if (type === "hr") return v > Number(s.hr_max) || v < Number(s.hr_min) ? "red" : "green";
  if (type === "temp") return v > Number(s.temp_max) || v < Number(s.temp_min) ? "red" : "green";
  if (type === "bp") return v > Number(s.bp_sys_max) ? "red" : "green";
  return "green";
}

const COLORS = { green: "#2e7d4f", orange: "#c97f1e", red: "#d94f3d" };
const SEVERITY_RANK = { red: 3, orange: 2, green: 1 };

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function shortDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function VitalTiles({ latest, todayCounts = {}, settings, patientId, incidents = [] }) {
  const router = useRouter();
  const [pooCount, setPooCount] = useState(latest.poo?.value ? Number(latest.poo.value) : 0);
  const [pooSaving, setPooSaving] = useState(false);

  const measure = (type) => latest[type]?.value;
  const measuredAt = (type) => latest[type]?.measured_at;
  const countFor = (type) => todayCounts[type] ?? 0;

  // BP is a pair (systolic + diastolic) → count once
  const bpToday = Math.max(countFor("bp_systolic"), countFor("bp_diastolic"));

  const tiles = [
    { key: "spo2", label: "SpO₂", value: measure("spo2"), measuredAt: measuredAt("spo2"), count: countFor("spo2"), unit: "%", href: `/patients/${patientId}/history` },
    { key: "hr", label: "Frec.", value: measure("hr"), measuredAt: measuredAt("hr"), count: countFor("hr"), unit: "ppm", href: `/patients/${patientId}/history` },
    { key: "bp", label: "Tensión", value: measure("bp_systolic") ? `${measure("bp_systolic")}/${measure("bp_diastolic") ?? "?"}` : null, measuredAt: measuredAt("bp_systolic"), count: bpToday, unit: "mmHg", href: `/patients/${patientId}/history` },
    { key: "temp", label: "Temp.", value: measure("temp"), measuredAt: measuredAt("temp"), count: countFor("temp"), unit: "°C", href: `/patients/${patientId}/history` },
  ];

  const handlePoo = async () => {
    if (pooSaving) return;
    setPooSaving(true);
    try {
      await api.createVital(patientId, { type: "poo", count: pooCount + 1 });
      setPooCount((c) => c + 1);
    } catch {
      // ignore — keep current count
    } finally {
      setPooSaving(false);
    }
  };

  // Incidents summary: count + worst severity + latest id
  let incidentColor = COLORS.green;
  if (incidents.length > 0) {
    let worst = "green";
    for (const inc of incidents) {
      if (SEVERITY_RANK[inc.severity] > SEVERITY_RANK[worst]) worst = inc.severity;
    }
    incidentColor = COLORS[worst];
  }
  const latestIncident = incidents[0] ?? null;

  return (
    <div className="stats-row-grid mt16" style={{ "--stats-cols": 4 }}>
      {tiles.map((t) => {
        const color = t.value != null ? COLORS[tileColor(t.key, t.value, settings)] : "#c2b5a3";
        const stale = t.value != null && !isToday(t.measuredAt);
        return (
          <button
            key={t.key}
            type="button"
            className="stat-block cursor-pointer hover:opacity-80 text-left"
            onClick={() => t.href && router.push(t.href)}
            aria-label={`Ver historial de ${t.label}`}
          >
            <div className="stat-number" style={{ color }}>
              {t.value ?? "–"}
              {t.unit && (
                <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}> {t.unit}</span>
              )}
            </div>
            <div className="stat-label">
              <span className="inline-flex items-center gap-1">
                {t.label}
                {stale && (
                  <span
                    title={`Última medición: ${shortDate(t.measuredAt)}`}
                    aria-label={`Sin medición hoy (última: ${shortDate(t.measuredAt)})`}
                    className="inline-block w-2 h-2 rounded-full bg-[var(--sun)]"
                  />
                )}
                {t.count > 0 && (
                  <span className="text-[10px] text-muted" title={`${t.count} mediciones hoy`}>
                    {t.count}
                  </span>
                )}
                {t.count === 0 && (
                  <span className="text-[10px] text-muted opacity-60" title="Sin mediciones hoy">
                    0
                  </span>
                )}
              </span>
            </div>
          </button>
        );
      })}

      {/* Poo — one-tap increment, no modal */}
      <button
        type="button"
        className="stat-block cursor-pointer text-left"
        onClick={handlePoo}
        disabled={pooSaving}
        aria-label="Añadir deposición"
      >
        <div className="stat-number" style={{ color: "#8a6bbd" }}>
          {pooCount}
          <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}> hoy</span>
        </div>
        <div className="stat-label">Deposición +1</div>
      </button>

      {/* Incidents tile */}
      <button
        type="button"
        className="stat-block cursor-pointer text-left"
        onClick={() => latestIncident && router.push(`/patients/${patientId}/incidents?open=${latestIncident.id}`)}
        aria-label="Ver incidentes"
      >
        <div className="stat-number" style={{ color: incidents.length ? incidentColor : "#c2b5a3" }}>
          <ShieldAlert size={20} style={{ display: "inline", marginRight: 4, verticalAlign: -3 }} />
          {incidents.length}
        </div>
        <div className="stat-label">Incidentes</div>
      </button>
    </div>
  );
}

