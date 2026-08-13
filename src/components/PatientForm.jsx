"use client";

import { useState, useRef } from "react";
import { Camera, Save } from "lucide-react";
import api from "@/utils/api";

/**
 * PatientForm — create/edit a patient. Plain text inputs (SPEC §4.11):
 * big targets, one obvious action. Optional avatar photo.
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!patient?.id) {
      setError("Crea primero el paciente y luego añade su foto.");
      return;
    }
    setUploadingAvatar(true);
    setError("");
    try {
      const { uploadUrl, key } = await api.requestAvatarUrl(patient.id, {
        filename: file.name,
        mime_type: file.type || "image/jpeg",
        size_bytes: file.size,
      });
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "image/jpeg" },
      });
      if (!res.ok) throw new Error("La subida de la foto falló");
      await api.confirmAvatar(patient.id, key);
      setAvatarPreview(URL.createObjectURL(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

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

      {isEdit && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-line bg-[var(--bg)]"
            onClick={() => fileRef.current?.click()}
            aria-label="Añadir foto"
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="vista previa" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-muted"><Camera size={24} /></span>
            )}
            {uploadingAvatar && (
              <span className="absolute inset-0 bg-black/40 text-white text-xs flex items-center justify-center">
                Subiendo…
              </span>
            )}
          </button>
          <div>
            <p className="font-medium text-bark text-sm">Foto del paciente</p>
            <p className="text-xs text-muted">Toca la foto para añadir o cambiar.</p>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatar} />
        </div>
      )}

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
          <Save size={18} className="mr-1" /> {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear paciente"}
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
