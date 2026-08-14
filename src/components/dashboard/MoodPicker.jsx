"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import api from "@/utils/api";
import { MOOD_LEVELS, moodLabel } from "@/lib/metrics";

/**
 * Estado de ánimo (Ánimo) — tap to set today's mood. Shows yesterday's value
 * for reference. Saves the chosen level (1–5) via API, no modal.
 */
export default function MoodPicker({ patientId, today, yesterday }) {
  const [value, setValue] = useState(today ?? null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = value != null ? moodLabel(value) : null;

  const choose = async (level) => {
    if (saving) return;
    setSaving(true);
    try {
      await api.createVital(patientId, { type: "mood", value: level });
      setValue(level);
      setOpen(false);
    } catch {
      // keep previous mood on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-warning">
            <Smile className="size-4" />
          </span>
          <p className="text-sm font-semibold">Ánimo</p>
        </div>
        {current == null && <span title="Sin medición hoy" aria-hidden="true"><span className="size-2 shrink-0 rounded-full bg-warning" /></span>}
      </div>

      {!open ? (
        <>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{current ?? "–"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ayer {yesterday != null ? moodLabel(yesterday) : "–"}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-primary"
            aria-label="Cambiar estado de ánimo de hoy"
          >
            <Smile size={18} /> {current != null ? "Cambiar" : "Registrar"}
          </button>
        </>
      ) : (
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Estado de hoy</p>
          <div className="grid grid-cols-5 gap-2">
            {MOOD_LEVELS.map((m) => (
              <button
                key={m.value}
                type="button"
                disabled={saving}
                onClick={() => choose(m.value)}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-1 text-center text-xs font-semibold disabled:opacity-50 ${value === m.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
              >
                <span className="text-lg leading-none">{m.value}</span>
                <span className="leading-tight">{m.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 flex min-h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted"
          >
            Cancelar
          </button>
        </div>
      )}
    </section>
  );
}
