"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";

/**
 * Dashboard "how is she today?" tiles (SPEC §4.10, §13):
 * - Latest value per measure, color-coded green/orange/red by thresholds
 * - Click a tile → patient history (timeline of that measure)
 * - Poo: one-tap increment, no modal — creates a log entry with current time
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

export default function VitalTiles({ latest, settings, patientId }) {
  const router = useRouter();
  const [pooCount, setPooCount] = useState(latest.poo?.value ? Number(latest.poo.value) : 0);
  const [pooSaving, setPooSaving] = useState(false);

  const measure = (type) => latest[type]?.value;

  const tiles = [
    { key: "spo2", label: "SpO₂", value: measure("spo2"), unit: "%", href: `/patients/${patientId}/history` },
    { key: "hr", label: "Frec.", value: measure("hr"), unit: "ppm", href: `/patients/${patientId}/history` },
    { key: "bp", label: "Tensión", value: measure("bp_systolic") ? `${measure("bp_systolic")}/${measure("bp_diastolic") ?? "?"}` : null, unit: "mmHg", href: `/patients/${patientId}/history` },
    { key: "temp", label: "Temp.", value: measure("temp"), unit: "°C", href: `/patients/${patientId}/history` },
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

  return (
    <div className="stats-row-grid mt16" style={{ "--stats-cols": 4 }}>
      {tiles.map((t) => {
        const color = t.value != null ? COLORS[tileColor(t.key, t.value, settings)] : "#c2b5a3";
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
            <div className="stat-label">{t.label}</div>
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
    </div>
  );
}
