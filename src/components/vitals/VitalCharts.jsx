"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { StatusPill } from "@/components/app-shell";

export const CHART_PERIODS = [
  { key: 1, label: "Día" },
  { key: 7, label: "Semana" },
  { key: 30, label: "Mes" },
];

const SERIES = [
  { type: "spo2", label: "SpO₂", unit: "%" },
  { type: "hr", label: "Frecuencia cardíaca", unit: "ppm" },
  { type: "temp", label: "Temperatura", unit: "°C" },
  { type: "bp_systolic", label: "Tensión sistólica", unit: "mmHg" },
  { type: "bp_diastolic", label: "Tensión diastólica", unit: "mmHg" },
];

const SOFT_COLORS = {
  green: "#8fbd9f",
  orange: "#e5b078",
  red: "#e3a0a0",
};

const CHART_DOMAINS = {
  spo2: [0, 100],
  hr: [0, 180],
  temp: [30, 42],
  bp_systolic: [0, 200],
  bp_diastolic: [0, 130],
};

const DEFAULT_SETTINGS = {
  spo2_min: 92,
  hr_min: 50,
  hr_max: 120,
  temp_min: 36,
  temp_max: 37.5,
  bp_sys_max: 140,
  bp_dia_max: 90,
};

function valueTone(type, value, settings) {
  const v = Number(value);
  const s = { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
  if (type === "spo2") return v >= Number(s.spo2_min) ? "green" : v >= Number(s.spo2_min) - 3 ? "orange" : "red";
  if (type === "hr") {
    if (v >= Number(s.hr_min) && v <= Number(s.hr_max)) return "green";
    return v >= Number(s.hr_min) - 10 && v <= Number(s.hr_max) + 10 ? "orange" : "red";
  }
  if (type === "temp") {
    if (v >= Number(s.temp_min) && v <= Number(s.temp_max)) return "green";
    return v >= Number(s.temp_min) - 0.5 && v <= Number(s.temp_max) + 0.5 ? "orange" : "red";
  }
  if (type === "bp_systolic") return v <= Number(s.bp_sys_max) ? "green" : v <= Number(s.bp_sys_max) + 10 ? "orange" : "red";
  if (type === "bp_diastolic") return v <= Number(s.bp_dia_max) ? "green" : v <= Number(s.bp_dia_max) + 5 ? "orange" : "red";
  return "green";
}

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

function BarChart({ points, label, unit, type, settings, simple = false }) {
  if (!points || points.length === 0) {
    return <p className="py-5 text-sm text-muted-foreground">No hay datos para este periodo.</p>;
  }

  const height = simple ? 72 : 220;
  const left = simple ? 4 : 42;
  const right = 12;
  const top = 12;
  const bottom = simple ? 4 : 32;
  const width = simple
    ? Math.max(220, points.length * 30 + left + right)
    : Math.max(640, points.length * 38 + left + right);
  const values = points.map((point) => point.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const domain = CHART_DOMAINS[type] ?? [0, Math.max(max, 1)];
  const hasRange = points.length > 1 && max > min;
  const padding = hasRange ? (max - min) * 0.1 : 0;
  const compactDomain = hasRange ? [min - padding, max + padding] : domain;
  const scaleMin = Math.min(compactDomain[0], min);
  const scaleMax = Math.max(compactDomain[1], max);
  const range = scaleMax - scaleMin || 1;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const gap = 2;
  const barWidth = Math.min(simple ? 26 : 36, Math.max(4, chartWidth / points.length - gap));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" style={{ minWidth: points.length > 16 ? `${width}px` : undefined }} role="img" aria-label={label}>
      {!simple && <>
        <line x1={left} y1={top} x2={width - right} y2={top} stroke="currentColor" className="text-border" strokeDasharray="3 4" />
        <line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke="currentColor" className="text-border" />
        <text x="4" y={top + 4} fontSize="11" fill="currentColor" className="text-muted-foreground">{max.toFixed(1)}{unit}</text>
        <text x="4" y={height - bottom} fontSize="11" fill="currentColor" className="text-muted-foreground">{min.toFixed(1)}{unit}</text>
      </>}
      {points.map((point, index) => {
        const barHeight = Math.max(3, ((point.v - scaleMin) / range) * chartHeight);
        const x = left + index * (chartWidth / points.length) + (chartWidth / points.length - barWidth) / 2;
        const y = height - bottom - barHeight;
        const tone = valueTone(type, point.v, settings);
        return <g key={`${point.label}-${index}`}><rect x={x} y={y} width={barWidth} height={barHeight} rx="3" fill={SOFT_COLORS[tone]} opacity="0.9"><title>{`${point.label}: ${point.v.toFixed(1)}${unit} (${tone})`}</title></rect>{!simple && (points.length <= 12 || index % Math.ceil(points.length / 10) === 0) && <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" fontSize="10" fill="currentColor" className="text-muted-foreground">{point.label}</text>}</g>;
      })}
      </svg>
    </div>
  );
}

export default function VitalCharts({ patientId, initialPeriod = 7, simple = false }) {
  const [period, setPeriod] = useState(initialPeriod);
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getVitals(patientId, `?days=${period}`), api.getSettings(patientId)])
      .then(([rows, patientSettings]) => {
        if (cancelled) return;
        setSettings({ ...DEFAULT_SETTINGS, ...(patientSettings ?? {}) });
        const series = {};
        const summary = {};
        for (const item of SERIES) series[item.type] = [];
        for (const vital of rows ?? []) {
          if (series[vital.type]) series[vital.type].push({ t: new Date(vital.measured_at).getTime(), v: Number(vital.value) });
        }
        for (const item of SERIES) {
          const raw = series[item.type];
          const today = new Date();
          const todayCount = raw.filter((point) => {
            const date = new Date(point.t);
            return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
          }).length;
          summary[item.type] = { latest: raw[0]?.v ?? null, todayCount };
          series[item.type] = aggregate(raw, period);
        }
        setLoaded({ period, data: series, summary });
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{SERIES.map((item) => { const current = loaded.summary[item.type]; const tone = current.latest == null ? null : valueTone(item.type, current.latest, settings); return <div key={item.type} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{item.label}</p><p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{current.latest ?? "–"}{current.latest != null && <span className="ml-1 text-xs font-medium text-muted-foreground">{item.unit}</span>}</p></div><StatusPill tone={tone === "green" ? "success" : tone === "orange" ? "warning" : tone === "red" ? "critical" : "neutral"}>{tone === "green" ? "Normal" : tone === "orange" ? "Atención" : tone === "red" ? "Alerta" : "Sin datos"}</StatusPill></div><p className="mt-1 text-xs text-muted-foreground">Medidas hoy: {current.todayCount}</p><div className="mt-2"><BarChart simple points={loaded.data[item.type]} label={item.label} type={item.type} settings={settings} unit={item.unit} /></div></div>; })}</div>
      ) : (
        <div><div className="mb-4 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground"><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#8fbd9f]" />En rango</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#e5b078]" />Cerca del límite</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#e3a0a0]" />Fuera de rango</span></div><div className="space-y-4">{SERIES.map((item) => <section key={item.type} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><h2 className="mb-3 text-base font-semibold">{item.label}</h2><BarChart points={loaded.data[item.type]} label={item.label} type={item.type} settings={settings} unit={item.unit} /></section>)}</div></div>
      )}
    </div>
  );
}
