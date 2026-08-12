"use client";

import { useState } from "react";
import api from "@/utils/api";

/**
 * PatientForm — create/edit a patient. Plain text inputs (SPEC §4.11):
 * big targets, one obvious action.
 */
export default function PatientForm({ patient, onSaved, onCancel }) {
  const isEdit = Boolean(patient);
  const [form, setForm] = useState({
    name: patient?.name ?? "",
    dob: patient?.dob ?? "",
    gender: patient?.gender ?? "",
    allergies: patient?.allergies ?? "",
    medications: patient?.medications ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = isEdit
        ? await api.updatePatient(patient.id, form)
        : await api.createPatient(form);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className="input-label">Nombre</label>
        <input
          className="input"
          value={form.name}
          onChange={set("name")}
          placeholder="Ej. María"
          required
        />
      </div>

      <div>
        <label className="input-label">Fecha de nacimiento</label>
        <input
          type="date"
          className="input"
          value={form.dob}
          onChange={set("dob")}
        />
      </div>

      <div>
        <label className="input-label">Género</label>
        <select className="input" value={form.gender} onChange={set("gender")}>
          <option value="">—</option>
          <option value="female">Mujer</option>
          <option value="male">Hombre</option>
          <option value="other">Otro</option>
        </select>
      </div>

      <div>
        <label className="input-label">Alergias</label>
        <textarea
          className="input min-h-[80px]"
          value={form.allergies}
          onChange={set("allergies")}
          placeholder="Ej. Penicilina, frutos secos…"
        />
      </div>

      <div>
        <label className="input-label">Medicación actual</label>
        <textarea
          className="input min-h-[80px]"
          value={form.medications}
          onChange={set("medications")}
          placeholder="Ej. Losartán 50 mg al día, omeprazol…"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={saving}>
          {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear paciente"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
