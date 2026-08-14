"use client";

import { useEffect, useState } from "react";
import { Activity, Droplets, HeartPulse, Thermometer, CircleDot, Save } from "lucide-react";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";

const METRIC_BUTTONS = [
  { key: "spo2", label: "SpO₂", hint: "%", icon: Droplets },
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
    } else if (key === "poo") {
      prefill.count = lastValues.poo ?? "1";
    } else {
      prefill.value = lastValues[key] ?? "";
    }
    prefill.measured_at = iso;
    prefill.device = "";
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

  const labels = { spo2: "SpO₂ (%)", hr: "Frecuencia cardíaca (ppm)", bp: "Tensión arterial (mmHg)", temp: "Temperatura (°C)", poo: "Deposiciones" };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="text-base font-semibold">Registrar</div>
      <div className="mt4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {METRIC_BUTTONS.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              type="button"
              className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-lg px-3 text-muted-foreground hover:bg-muted"
              onClick={() => open(m.key)}
            >
              <Icon className="mb-1 text-foreground" size={26} />
              <span className="font-semibold text-sm">{m.label}</span>
              <span className="text-xs text-muted-foreground">{m.hint}</span>
            </button>
          );
        })}
      </div>

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
          ) : active === "poo" ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Número de deposiciones</label>
              <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" inputMode="numeric" value={form.count ?? "1"} onChange={set("count")} placeholder="1" />
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
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Dispositivo (opcional)</label>
            <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.device ?? ""} onChange={set("device")} placeholder="Ej. pulsioxímetro" />
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
