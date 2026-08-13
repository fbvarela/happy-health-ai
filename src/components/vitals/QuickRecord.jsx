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
    <div className="card">
      <div className="card-title">Registrar</div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt4">
        {METRIC_BUTTONS.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              type="button"
              className="btn btn-ghost flex-col justify-center items-center py-4 min-h-[88px]"
              onClick={() => open(m.key)}
            >
              <Icon className="mb-1" size={26} />
              <span className="font-semibold text-sm">{m.label}</span>
              <span className="text-xs text-muted">{m.hint}</span>
            </button>
          );
        })}
      </div>

      <Modal open={Boolean(active)} onClose={() => setActive(null)} title={`Registrar ${labels[active] ?? ""}`}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {active === "bp" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Sistólica</label>
                <input className="input" inputMode="decimal" value={form.systolic ?? ""} onChange={set("systolic")} placeholder="120" required />
              </div>
              <div>
                <label className="input-label">Diastólica</label>
                <input className="input" inputMode="decimal" value={form.diastolic ?? ""} onChange={set("diastolic")} placeholder="80" required />
              </div>
            </div>
          ) : active === "poo" ? (
            <div>
              <label className="input-label">Número de deposiciones</label>
              <input className="input" inputMode="numeric" value={form.count ?? "1"} onChange={set("count")} placeholder="1" />
            </div>
          ) : (
            <div>
              <label className="input-label">Valor</label>
              <input className="input" inputMode="decimal" value={form.value ?? ""} onChange={set("value")} placeholder="—" required />
            </div>
          )}

          <div>
            <label className="input-label">Fecha y hora</label>
            <input type="datetime-local" className="input" value={form.measured_at ?? ""} onChange={set("measured_at")} required />
          </div>

          <div>
            <label className="input-label">Dispositivo (opcional)</label>
            <input className="input" value={form.device ?? ""} onChange={set("device")} placeholder="Ej. pulsioxímetro" />
          </div>

          <div>
            <label className="input-label">Notas (opcional)</label>
            <input className="input" value={form.notes ?? ""} onChange={set("notes")} placeholder="Contexto breve" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={saving}>
              <Save size={18} className="mr-1" /> {saving ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setActive(null)}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
