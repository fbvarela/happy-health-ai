"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";

export const CHART_PERIODS = [
  { key: 1, label: "Día" },
  { key: 7, label: "Semana" },
  { key: 30, label: "Mes" },
];

const SERIES = [
  { type: "spo2", label: "SpO₂", unit: "%", color: "#8fbd9f" },
  { type: "hr", label: "Frecuencia cardíaca", unit: "ppm", color: "#e5b078" },
  { type: "temp", label: "Temperatura", unit: "°C", color: "#e3a0a0" },
  { type: "bp_systolic", label: "Tensión sistólica", unit: "mmHg", color: "#e5b078" },
  { type: "bp_diastolic", label: "Tensión diastólica", unit: "mmHg", color: "#8fbd9f" },
];

function bucketLabel(timestamp, period) {
  const date = new Date(timestamp);
  if (period === 1) return `${String(date.getHours()).padStart(2, "0")}:00`;
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function aggregate(rows, period) {
  const buckets = new Map();
  for (const row of rows) {
    const key = bucketLabel(row.t, period);
    const existing = buckets.get(key) ?? { label: key, total: 0, count: 0 };
    existing.total += row.v;
    existing.count += 1;
    buckets.set(key, existing);
  }
  return [...buckets.values()].map((bucket) => ({ ...bucket, v: bucket.total / bucket.count }));
}

function BarChart({ points, label, color, unit, simple = false }) {
  if (!points || points.length === 0) {
    return <p className="py-5 text-sm text-muted-foreground">No hay datos para este periodo.</p>;
  }

  const width = 640;
  const height = simple ? 100 : 220;
  const left = simple ? 4 : 42;
  const right = 12;
  const top = 12;
  const bottom = simple ? 4 : 32;
  const values = points.map((point) => point.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.max(Math.abs(max) * 0.1, 1);
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const gap = Math.min(8, chartWidth / Math.max(points.length, 1) * 0.2);
  const barWidth = Math.max(3, chartWidth / points.length - gap);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label}>
      {!simple && <>
        <line x1={left} y1={top} x2={width - right} y2={top} stroke="currentColor" className="text-border" strokeDasharray="3 4" />
        <line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke="currentColor" className="text-border" />
        <text x="4" y={top + 4} fontSize="11" fill="currentColor" className="text-muted-foreground">{max.toFixed(1)}{unit}</text>
        <text x="4" y={height - bottom} fontSize="11" fill="currentColor" className="text-muted-foreground">{min.toFixed(1)}{unit}</text>
      </>}
      {points.map((point, index) => {
        const barHeight = Math.max(3, ((point.v - min) / range) * chartHeight);
        const x = left + index * (chartWidth / points.length) + gap / 2;
        const y = height - bottom - barHeight;
        return <g key={`${point.label}-${index}`}><rect x={x} y={y} width={barWidth} height={barHeight} rx="3" fill={color} opacity="0.85"><title>{`${point.label}: ${point.v.toFixed(1)}${unit}`}</title></rect>{!simple && (points.length <= 12 || index % Math.ceil(points.length / 10) === 0) && <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" fontSize="10" fill="currentColor" className="text-muted-foreground">{point.label}</text>}</g>;
      })}
    </svg>
  );
}

export default function VitalCharts({ patientId, initialPeriod = 7, simple = false }) {
  const [period, setPeriod] = useState(initialPeriod);
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.getVitals(patientId, `?days=${period}`)
      .then((rows) => {
        if (cancelled) return;
        const series = {};
        for (const item of SERIES) series[item.type] = [];
        for (const vital of rows ?? []) {
          if (series[vital.type]) series[vital.type].push({ t: new Date(vital.measured_at).getTime(), v: Number(vital.value) });
        }
        for (const item of SERIES) series[item.type] = aggregate(series[item.type], period);
        setLoaded({ period, data: series });
      })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [patientId, period]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {CHART_PERIODS.map((item) => <button key={item.key} type="button" className={`min-h-10 rounded-xl border px-4 text-sm font-semibold ${period === item.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`} onClick={() => setPeriod(item.key)}>{item.label}</button>)}
      </div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {!loaded || loaded.period !== period ? <p className="text-sm text-muted-foreground">Cargando…</p> : simple ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{SERIES.map((item) => <div key={item.type} className="rounded-2xl border border-border bg-card p-3 shadow-sm"><p className="mb-1 text-xs font-semibold text-muted-foreground">{item.label}</p><BarChart simple points={loaded.data[item.type]} label={item.label} color={item.color} unit={item.unit} /></div>)}</div>
      ) : (
        <div className="space-y-4">{SERIES.map((item) => <section key={item.type} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><h2 className="mb-3 text-base font-semibold">{item.label}</h2><BarChart points={loaded.data[item.type]} label={item.label} color={item.color} unit={item.unit} /></section>)}</div>
      )}
    </div>
  );
}
