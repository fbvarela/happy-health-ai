"use client";

import { useState } from "react";
import { MoonStar, Phone, Footprints, Plus, Minus, X } from "lucide-react";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";

/**
 * Nocturno — tap opens a modal to record a call ("llamada") or a wake-up
 * ("levantada") during the night. Each recording is stored as a night_events
 * vital (count metric) so it appears in the log journal, and the day's total
 * increments. Also allows adjusting the total number directly.
 */
export default function NightEventsPicker({ patientId, today, yesterday }) {
  const [value, setValue] = useState(today ?? 0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totalInput, setTotalInput] = useState(today ?? 0);

  const openModal = () => {
    setTotalInput(value);
    setOpen(true);
  };

  const saveEntry = async (count, notes) => {
    if (saving) return;
    setSaving(true);
    try {
      await api.createVital(patientId, { type: "night_events", count, notes });
      setValue((v) => v + count);
      setTotalInput((t) => t + count);
    } catch {
      // keep current count on error
    } finally {
      setSaving(false);
    }
  };

  const saveTotal = async () => {
    if (saving) return;
    const n = Math.max(0, Number(totalInput) || 0);
    setSaving(true);
    try {
      // Log only the difference so the day's sum matches the shown total
      const diff = n - value;
      await api.createVital(patientId, {
        type: "night_events",
        count: diff,
        notes: diff !== 0 ? `Total nocturno: ${n}` : "Total nocturno: 0",
      });
      setValue(n);
    } catch {
      // ignore
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-warning">
            <MoonStar className="size-4" />
          </span>
            <p className="text-sm font-semibold">Noche</p>
        </div>
        {today == null && <span title="Sin registro hoy" aria-hidden="true"><span className="size-2 shrink-0 rounded-full bg-warning" /></span>}
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
        onClick={openModal}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-primary"
        aria-label="Registrar llamadas o levantadas nocturnas"
      >
        <MoonStar size={18} /> Registrar
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nocturno" sub="Registra llamadas y levantadas de la noche">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Hoy: <span className="font-semibold text-foreground">{value}</span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => saveEntry(1, "llamada")}
            className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-2 text-sm font-semibold text-foreground disabled:opacity-50 active:bg-accent"
          >
            <Phone className="size-6 text-primary" />
            Llamada
            <span className="text-xs font-medium text-muted-foreground">+1</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveEntry(1, "levantada")}
            className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-2 text-sm font-semibold text-foreground disabled:opacity-50 active:bg-accent"
          >
            <Footprints className="size-6 text-warning" />
            Levantada
            <span className="text-xs font-medium text-muted-foreground">+1</span>
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-muted/50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Total de la noche</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTotalInput((t) => Math.max(0, (Number(t) || 0) - 1))}
                className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground"
                aria-label="Restar uno"
              >
                <Minus className="size-4" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                className="h-10 w-16 rounded-lg border border-input bg-background text-center text-sm font-semibold outline-none focus:border-ring"
                aria-label="Total nocturno"
              />
              <button
                type="button"
                onClick={() => setTotalInput((t) => (Number(t) || 0) + 1)}
                className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground"
                aria-label="Sumar uno"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={saveTotal}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Guardar total
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted"
          >
            <X size={16} /> Cerrar
          </button>
        </div>
      </Modal>
    </section>
  );
}
