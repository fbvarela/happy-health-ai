"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";

const FIELDS = [
  { key: "spo2_min", label: "SpO₂ mínima (%)", hint: "Alerta si baja de" },
  { key: "hr_min", label: "Frec. cardíaca mínima (ppm)", hint: "Alerta si baja de" },
  { key: "hr_max", label: "Frec. cardíaca máxima (ppm)", hint: "Alerta si supera" },
  { key: "temp_min", label: "Temperatura mínima (°C)", hint: "Alerta si baja de" },
  { key: "temp_max", label: "Temperatura máxima (°C)", hint: "Alerta si supera" },
  { key: "bp_sys_max", label: "Tensión sistólica máxima (mmHg)", hint: "Alerta si supera" },
  { key: "bp_dia_max", label: "Tensión diastólica máxima (mmHg)", hint: "Alerta si supera" },
];

/**
 * SettingsForm — per-patient alert thresholds (SPEC §4.4). Caregiver/owner.
 */
export default function SettingsForm({ patientId }) {
  const [values, setValues] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getSettings(patientId)
      .then((s) => setValues(s))
      .catch((err) => setError(err.message));
  }, [patientId]);

  if (!values) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      await api.updateSettings(patientId, values);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">Umbrales de alerta</div>
      <p className="text-xs text-muted mb-4">
        Se notificará a los cuidadores cuando una constante salga de estos rangos.
      </p>
      <form onSubmit={handleSave} className="space-y-3">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {saved && <p className="text-green-700 text-sm">Guardado ✓</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="input-label">{f.label}</label>
              <input
                className="input"
                type="number"
                step="0.1"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <button type="submit" className="btn btn-primary w-full justify-center" disabled={busy}>
          {busy ? "Guardando…" : "Guardar umbrales"}
        </button>
      </form>
    </div>
  );
}
