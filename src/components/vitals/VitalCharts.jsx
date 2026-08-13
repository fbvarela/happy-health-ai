"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";

export const CHART_PERIODS = [
  { key: 1, label: "Día" },
  { key: 7, label: "Semana" },
  { key: 30, label: "Mes" },
];

const SERIES = [
  { type: "spo2", label: "SpO₂ (%)", unit: "%", color: "#4a7c59" },
  { type: "hr", label: "Frecuencia cardíaca (ppm)", unit: "ppm", color: "#c96f4a" },
  { type: "temp", label: "Temperatura (°C)", unit: "°C", color: "#d94f3d" },
  { type: "bp_systolic", label: "Tensión sistólica (mmHg)", unit: "mmHg", color: "#5b7fa6" },
  { type: "bp_diastolic", label: "Tensión diastólica (mmHg)", unit: "mmHg", color: "#8a6bbd" },
];

function Chart({ points, label, color, unit, simple = false }) {
  if (!points || points.length < 2) {
    return (
      <div className={simple ? "" : "card"}>
        {!simple && <div className="card-title">{label}</div>}
        <p className="dog-meta mt4">No hay suficientes datos para este periodo.</p>
      </div>
    );
  }

  const W = 600;
  const H = 160;
  const PAD = 8;
  const values = points.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = W / (points.length - 1);

  if (simple) {
    return (
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} role="img" aria-label={label}>
          <polyline
            points={points.map((p, i) => `${i * step},${PAD + (1 - (p.v - min) / range) * (H - 2 * PAD)}`).join(" ")}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} role="img" aria-label={label}>
        <polyline points={points.map((p, i) => `${i * step},${PAD + (1 - (p.v - min) / range) * (H - 2 * PAD)}`).join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={i * step} cy={PAD + (1 - (p.v - min) / range) * (H - 2 * PAD)} r="2.5" fill={color} />
        ))}
        <text x="4" y="14" fontSize="11" fill="#8a7a66">{`máx ${max}${unit}`}</text>
        <text x="4" y={H - 4} fontSize="11" fill="#8a7a66">{`mín ${min}${unit}`}</text>
      </svg>
    </div>
  );
}

/**
 * VitalCharts — trend charts per metric with Day/Week/Month selector.
 * `simple` renders compact line-only mini charts (no axes/labels) for the dashboard.
 */
export default function VitalCharts({ patientId, initialPeriod = 7, simple = false }) {
  const [period, setPeriod] = useState(initialPeriod);
  const [loaded, setLoaded] = useState(null); // { period, data }
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .getVitals(patientId, `?days=${period}`)
      .then((rows) => {
        if (cancelled) return;
        const series = {};
        for (const s of SERIES) series[s.type] = [];
        for (const v of rows ?? []) {
          if (series[v.type]) {
            series[v.type].push({ t: new Date(v.measured_at).getTime(), v: Number(v.value) });
          }
        }
        for (const s of SERIES) series[s.type].sort((a, b) => a.t - b.t);
        setLoaded({ period, data: series });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, period]);

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        {CHART_PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`btn btn-sm ${period === p.key ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {!loaded || loaded.period !== period ? (
        <p className="text-muted">Cargando…</p>
      ) : simple ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SERIES.map((s) => (
            <div key={s.type} className="bg-surface rounded-[10px] border border-line p-2">
              <p className="text-xs text-muted mb-1">{s.label}</p>
              <Chart simple points={loaded.data[s.type]} label={s.label} color={s.color} unit={s.unit} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {SERIES.map((s) => (
            <Chart key={s.type} points={loaded.data[s.type]} label={s.label} color={s.color} unit={s.unit} />
          ))}
        </div>
      )}
    </div>
  );
}
