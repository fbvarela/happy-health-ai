"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Droplets, HeartPulse, Thermometer, CircleDot, Save, Smile, MoonStar } from "lucide-react";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";
import { MOOD_LEVELS } from "@/lib/metrics";
import MedicationChecklist from "@/components/dashboard/MedicationChecklist";
import WalkCheck from "@/components/dashboard/WalkCheck";

const METRIC_BUTTONS = [
  { key: "spo2", label: "SpO₂", hint: "%", icon: Droplets },
  { key: "mood", label: "Ánimo", hint: "verde/naranja/rojo", icon: Smile },
  { key: "night_events", label: "Nocturno", hint: "nº", icon: MoonStar },
  { key: "hr", label: "Frecuencia", hint: "ppm", icon: HeartPulse },
  { key: "bp", label: "Tensión", hint: "mmHg", icon: Activity },
  { key: "temp", label: "Temperatura", hint: "°C", icon: Thermometer },
  { key: "poo", label: "Deposición", hint: "nº", icon: CircleDot },
];

/**
 * QuickRecord — big tap targets to log a reading (SPEC §4.11, §9.4).
 * Opens a plain text-input form; pre-fills the last recorded value per metric
 * ("fast last value" UX). Saves via API, then refreshes the timeline.
 */
export default function QuickRecord({ patientId, canEdit, onSaved }) {
  const [active, setActive] = useState(null);
  const [lastValues, setLastValues] = useState({});
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canEdit) return;
    // Load last value per metric for quick prefill
    api
      .getVitals(patientId, "?days=1")
      .then((rows) => {
        const latest = {};
        for (const r of rows ?? []) {
          if (latest[r.type] === undefined) latest[r.type] = r.value;
        }
        setLastValues(latest);
      })
      .catch(() => {});
  }, [patientId, canEdit]);

  if (!canEdit) return null;

  const open = (key) => {
    setError("");
    const now = new Date();
    const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    const prefill = {};
    if (key === "bp") {
      prefill.systolic = lastValues.bp_systolic ?? "";
      prefill.diastolic = lastValues.bp_diastolic ?? "";
    } else if (key === "poo" || key === "night_events") {
      prefill.count = lastValues[key] ?? "1";
    } else {
      prefill.value = lastValues[key] ?? "";
    }
    prefill.measured_at = iso;
    prefill.notes = "";
    setForm(prefill);
    setActive(key);
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.createVital(patientId, { type: active, ...form });
      setActive(null);
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const labels = { spo2: "SpO₂ (%)", hr: "Frecuencia cardíaca (ppm)", bp: "Tensión arterial (mmHg)", temp: "Temperatura (°C)", poo: "Deposiciones", mood: "Estado de ánimo", night_events: "Llamadas/levantadas nocturnas" };

  const renderMetric = (m) => {
    const Icon = m.icon;
    return <button key={m.key} type="button" onClick={() => open(m.key)} className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-muted-foreground shadow-sm transition-colors hover:border-primary/40 active:bg-accent/40"><Icon className="mb-1 text-foreground" size={24} /><span className="font-semibold text-sm">{m.label}</span><span className="text-xs text-muted-foreground">{m.hint}</span></button>;
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="text-base font-semibold">Registrar</div>
      <p className="mt-0.5 text-xs text-muted-foreground">Añade una medida para el día de hoy</p>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => open("spo2")}
          className="flex min-h-24 w-full flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-success/40 active:bg-accent/40"
        >
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-success/10 text-success">
              <Droplets className="size-5" />
            </span>
            <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">Principal</span>
          </div>
          <div className="mt-3">
            <p className="text-sm font-semibold text-foreground">SpO₂ — saturación</p>
            <p className="text-xs text-muted-foreground">%</p>
          </div>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">{METRIC_BUTTONS.filter((m) => ["mood", "night_events", "poo"].includes(m.key)).map(renderMetric)}</div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <MedicationChecklist patientId={patientId} className="mt-0" />
        <WalkCheck patientId={patientId} className="mt-0" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">{METRIC_BUTTONS.filter((m) => ["hr", "bp", "temp"].includes(m.key)).map(renderMetric)}</div>

      <Link href={`/patients/${patientId}/history`} className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-primary shadow-sm">Ver evolución</Link>

      <Modal open={Boolean(active)} onClose={() => setActive(null)} title={`Registrar ${labels[active] ?? ""}`}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {active === "bp" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Sistólica</label>
                <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" inputMode="decimal" value={form.systolic ?? ""} onChange={set("systolic")} placeholder="120" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Diastólica</label>
                <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" inputMode="decimal" value={form.diastolic ?? ""} onChange={set("diastolic")} placeholder="80" required />
              </div>
            </div>
          ) : active === "poo" || active === "night_events" ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {active === "poo" ? "Número de deposiciones" : "Nº de veces que llamó o se levantó"}
              </label>
              <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" inputMode="numeric" value={form.count ?? "1"} onChange={set("count")} placeholder="1" />
            </div>
          ) : active === "mood" ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado de ánimo</label>
              <div className="grid grid-cols-3 gap-2">
                {MOOD_LEVELS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, value: m.value }))}
                    className={`flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 text-center text-xs font-semibold ${String(form.value) === String(m.value) ? (m.tone === "green" ? "border-success bg-success/10 text-success" : m.tone === "orange" ? "border-warning bg-warning/15 text-warning" : "border-critical bg-critical/10 text-critical") : "border-border bg-background text-muted-foreground"}`}
                  >
                    <span className={`size-5 rounded-full ${m.tone === "green" ? "bg-success" : m.tone === "orange" ? "bg-warning" : "bg-critical"}`} aria-hidden="true" />
                    <span className="leading-tight">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Valor</label>
              <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" inputMode="decimal" value={form.value ?? ""} onChange={set("value")} placeholder="—" required />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha y hora</label>
            <input type="datetime-local" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.measured_at ?? ""} onChange={set("measured_at")} required />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notas (opcional)</label>
            <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.notes ?? ""} onChange={set("notes")} placeholder="Contexto breve" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={saving}>
              <Save size={18} /> {saving ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setActive(null)}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
