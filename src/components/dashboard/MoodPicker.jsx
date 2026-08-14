"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import api from "@/utils/api";
import { MOOD_LEVELS, moodLabel, moodTone } from "@/lib/metrics";

const TONES = {
  green: { dot: "bg-success", selected: "border-success bg-success/10 text-success" },
  orange: { dot: "bg-warning", selected: "border-warning bg-warning/15 text-warning" },
  red: { dot: "bg-critical", selected: "border-critical bg-critical/10 text-critical" },
};

/**
 * Estado de ánimo (Ánimo) — traffic light (verde/naranja/rojo). Tap to set
 * today's mood. Shows yesterday's value for reference. No modal.
 */
export default function MoodPicker({ patientId, today, yesterday }) {
  const [value, setValue] = useState(today ?? null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const tone = value != null ? TONES[moodTone(value)] : null;
  const yesterdayTone = yesterday != null ? TONES[moodTone(yesterday)] : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-warning">
            <Smile className="size-4" />
          </span>
          <p className="text-sm font-semibold">Ánimo</p>
        </div>
        {value == null && <span title="Sin medición hoy" aria-hidden="true"><span className="size-2 shrink-0 rounded-full bg-warning" /></span>}
      </div>

      {!open ? (
        <>
          <p className="mt-3 flex items-center gap-2 text-3xl font-semibold tracking-tight">
            {tone && <span className={`size-4 rounded-full ${tone.dot}`} aria-hidden="true" />}
            {value != null ? moodLabel(value) : "–"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ayer {yesterday != null ? (
              <span className="inline-flex items-center gap-1">
                {yesterdayTone && <span className={`size-2.5 rounded-full ${yesterdayTone.dot}`} aria-hidden="true" />}
                {moodLabel(yesterday)}
              </span>
            ) : "–"}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-primary"
            aria-label="Cambiar estado de ánimo de hoy"
          >
            <Smile size={18} /> {value != null ? "Cambiar" : "Registrar"}
          </button>
        </>
      ) : (
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Estado de hoy</p>
          <div className="grid grid-cols-3 gap-2">
            {MOOD_LEVELS.map((m) => {
              const t = TONES[m.tone];
              return (
                <button
                  key={m.value}
                  type="button"
                  disabled={saving}
                  onClick={() => choose(m.value)}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 text-center text-xs font-semibold disabled:opacity-50 ${value === m.value ? t.selected : "border-border bg-background text-muted-foreground"}`}
                >
                  <span className={`size-5 rounded-full ${t.dot}`} aria-hidden="true" />
                  <span className="leading-tight">{m.label}</span>
                </button>
              );
            })}
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
