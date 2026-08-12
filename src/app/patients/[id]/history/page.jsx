"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";

const PERIODS = [
  { key: 1, label: "24h" },
  { key: 7, label: "7 días" },
  { key: 30, label: "30 días" },
  { key: 90, label: "90 días" },
];

const SERIES = [
  { type: "spo2", label: "SpO₂ (%)", unit: "%", color: "#4a7c59" },
  { type: "hr", label: "Frecuencia cardíaca (ppm)", unit: "ppm", color: "#c96f4a" },
  { type: "temp", label: "Temperatura (°C)", unit: "°C", color: "#d94f3d" },
  { type: "bp_systolic", label: "Tensión sistólica (mmHg)", unit: "mmHg", color: "#5b7fa6" },
  { type: "bp_diastolic", label: "Tensión diastólica (mmHg)", unit: "mmHg", color: "#8a6bbd" },
];

function Chart({ points, label, color, unit }) {
  if (!points || points.length < 2) {
    return (
      <div className="card">
        <div className="card-title">{label}</div>
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
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = PAD + (1 - (p.v - min) / range) * (H - 2 * PAD);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

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

export default function PatientHistoryPage() {
  const params = useParams();
  const patientId = params.id;
  const [period, setPeriod] = useState(7);
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
    <div className="page">
      <Link href={`/patients/${patientId}`} className="text-sm text-muted hover:text-bark inline-block mb-3">
        ← Volver al paciente
      </Link>
      <h1 className="page-title">Tendencias</h1>
      <p className="page-sub mb-4">Evolución de las constantes registradas.</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {PERIODS.map((p) => (
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
      {!loaded ? (
        <p className="text-muted">Cargando…</p>
      ) : loaded.period !== period ? (
        <p className="text-muted">Cargando…</p>
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
