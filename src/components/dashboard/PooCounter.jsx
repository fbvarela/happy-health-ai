"use client";

import { useState } from "react";
import { CircleDot } from "lucide-react";
import api from "@/utils/api";
import { useApp } from "@/context/AppContext";

/**
 * Deposiciones — one-tap counter (SPEC §4.1): tapping the card logs a poo with
 * the current time, no modal. Shows today's total (big) + yesterday (small).
 */
export default function PooCounter({ patientId, today, yesterday, count }) {
  const { refreshPatientData } = useApp();
  const [value, setValue] = useState(today ?? 0);
  const [measures, setMeasures] = useState(count ?? 0);
  const [saving, setSaving] = useState(false);

  const handleTap = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await api.createVital(patientId, { type: "poo", count: value + 1 });
      setValue((v) => v + 1);
      setMeasures((m) => m + 1);
      refreshPatientData();
    } catch {
      // keep current count on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-primary">
            <CircleDot className="size-4" />
          </span>
          <p className="text-sm font-semibold">Deposiciones</p>
        </div>
      </div>

      <p className="mt-3 font-mono text-3xl font-semibold tracking-tight tabular-nums">
        {value}
        <span className="text-sm font-medium text-muted-foreground"> hoy</span>
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Ayer {yesterday != null ? yesterday : "–"}
      </p>

      <button
        type="button"
        onClick={handleTap}
        disabled={saving}
        className="mt-2 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        aria-label="Añadir deposición"
      >
        <CircleDot size={15} /> {saving ? "…" : "+1"}
      </button>

      <p className="mt-2 text-[11px] text-muted-foreground">{measures} registros hoy</p>
    </section>
  );
}
