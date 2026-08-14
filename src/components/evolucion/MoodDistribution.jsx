"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";

const MOODS = [
  { value: 3, label: "Bien", color: "#8fbd9f" },
  { value: 2, label: "Regular", color: "#e5b078" },
  { value: 1, label: "Mal", color: "#e3a0a0" },
];

export default function MoodDistribution({ patientId }) {
  const [counts, setCounts] = useState({ 1: 0, 2: 0, 3: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVitals(patientId, "?days=30").then((rows) => {
      const next = { 1: 0, 2: 0, 3: 0 };
      for (const row of rows ?? []) if (row.type === "mood" && next[row.value] !== undefined) next[row.value] += 1;
      setCounts(next);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [patientId]);

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-base font-semibold">Distribución del ánimo</h2>
      <p className="mt-1 text-xs text-muted-foreground">Últimos 30 días</p>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Cargando…</p> : total === 0 ? <p className="mt-4 text-sm text-muted-foreground">No hay registros de ánimo.</p> : <>
        <div className="mt-4 flex h-7 w-full overflow-hidden rounded-full bg-muted" aria-label="Distribución del ánimo">
          {MOODS.map((mood) => <div key={mood.value} style={{ width: `${(counts[mood.value] / total) * 100}%`, backgroundColor: mood.color }} title={`${mood.label}: ${Math.round((counts[mood.value] / total) * 100)}%`} />)}
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
          {MOODS.map((mood) => <span key={mood.value} className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full" style={{ backgroundColor: mood.color }} />{mood.label} {Math.round((counts[mood.value] / total) * 100)}%</span>)}
        </div>
      </>}
    </section>
  );
}
