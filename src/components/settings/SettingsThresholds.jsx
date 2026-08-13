"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import api from "@/utils/api";

const FIELDS = [
  { key: "spo2_min", label: "SpO₂ mínima (%)" },
  { key: "hr_min", label: "Frec. cardíaca mínima (ppm)" },
  { key: "hr_max", label: "Frec. cardíaca máxima (ppm)" },
  { key: "temp_min", label: "Temperatura mínima (°C)" },
  { key: "temp_max", label: "Temperatura máxima (°C)" },
  { key: "bp_sys_max", label: "Tensión sistólica máxima (mmHg)" },
  { key: "bp_dia_max", label: "Tensión diastólica máxima (mmHg)" },
];

/** SettingsThresholds — per-patient alert thresholds (SPEC §4.4), in /settings. */
export default function SettingsThresholds({ patientId, patientName, canEdit }) {
  const [values, setValues] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getSettings(patientId)
      .then((s) => { if (!cancelled) setValues(s); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [patientId]);

  if (!values) return <p className="text-muted">Cargando…</p>;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
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
      <div className="card-title">{patientName}</div>
      <p className="text-xs text-muted mb-4">
        Umbrales de alerta. {canEdit ? "Se notifica a los cuidadores cuando una constante sale del rango." : "Solo lectura."}
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
                disabled={!canEdit}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {canEdit && (
          <button type="submit" className="btn btn-primary" disabled={busy}>
            <Save size={16} className="mr-1" /> {busy ? "Guardando…" : "Guardar umbrales"}
          </button>
        )}
      </form>
    </div>
  );
}
