"use client";

import { useState } from "react";
import { Droplets, Save } from "lucide-react";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";

function localDateTime() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function SpO2Recorder({ patientId, today, yesterday, count }) {
  const [value, setValue] = useState(today ?? null);
  const [todayCount, setTodayCount] = useState(count ?? 0);
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState("");
  const [measuredAt, setMeasuredAt] = useState(localDateTime);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const openForm = () => {
    setReading(value ?? "");
    setMeasuredAt(localDateTime());
    setError("");
    setOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    const next = Number(reading);
    if (!next || next < 1 || next > 100) {
      setError("Introduce una saturación entre 1 y 100");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.createVital(patientId, { type: "spo2", value: next, measured_at: measuredAt });
      setValue(next);
      setTodayCount((current) => current + 1);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm" aria-labelledby="spo2-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-success/10 text-success"><Droplets className="size-5" /></span>
          <div><h2 id="spo2-heading" className="text-sm font-semibold">Saturación de oxígeno</h2><p className="text-xs text-muted-foreground">SpO₂ · medida principal</p></div>
        </div>
        {value == null && <span title="Sin medición hoy"><span className="size-2 shrink-0 rounded-full bg-warning" /></span>}
      </div>
      <div className="mt-4 flex items-end gap-3"><p className="font-mono text-5xl font-semibold tracking-tight tabular-nums">{value ?? "–"}<span className="ml-1 text-lg font-medium text-muted-foreground">%</span></p><p className="pb-1.5 text-sm text-muted-foreground">Ayer <span className="font-semibold text-foreground">{yesterday != null ? `${yesterday}%` : "–"}</span></p></div>
      <p className="mt-2 text-xs text-muted-foreground">{todayCount} mediciones hoy</p>
      <button type="button" onClick={openForm} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-primary"><Droplets size={18} /> Registrar SpO₂</button>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar SpO₂" sub="Saturación de oxígeno">
        <form onSubmit={save} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Valor (%)</label><input className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" inputMode="decimal" value={reading} onChange={(event) => setReading(event.target.value)} placeholder="95" required /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha y hora</label><input type="datetime-local" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={measuredAt} onChange={(event) => setMeasuredAt(event.target.value)} required /></div>
          <div className="flex gap-3 pt-2"><button type="submit" disabled={saving} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save size={18} />{saving ? "Guardando…" : "Guardar"}</button><button type="button" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancelar</button></div>
        </form>
      </Modal>
    </section>
  );
}
