"use client";

import { useState, useRef } from "react";
import { Camera, Save } from "lucide-react";
import api from "@/utils/api";

function dateInputValue(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

/**
 * PatientForm — create/edit a patient. Plain text inputs (SPEC §4.11):
 * big targets, one obvious action. Optional avatar photo.
 */
export default function PatientForm({ patient, onSaved, onCancel }) {
  const isEdit = Boolean(patient);
  const [form, setForm] = useState({
    name: patient?.name ?? "",
    dob: dateInputValue(patient?.dob),
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
      {error && <p className="text-sm text-destructive">{error}</p>}

      {isEdit && (
        <div className="flex flex-row items-center gap-4">
          <button
            type="button"
            className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-border bg-muted"
            onClick={() => fileRef.current?.click()}
            aria-label="Añadir foto"
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="vista previa" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted-foreground"><Camera size={24} /></span>
            )}
            {uploadingAvatar && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                Subiendo…
              </span>
            )}
          </button>
          <div>
            <p className="text-sm font-medium text-foreground">Foto del paciente</p>
            <p className="text-xs text-muted-foreground">Toca la foto para añadir o cambiar.</p>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatar} />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre</label>
        <input
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
          value={form.name}
          onChange={set("name")}
          placeholder="Ej. María"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha de nacimiento</label>
        <input
          type="date"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
          value={form.dob}
          onChange={set("dob")}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Género</label>
        <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.gender} onChange={set("gender")}>
          <option value="">—</option>
          <option value="female">Mujer</option>
          <option value="male">Hombre</option>
          <option value="other">Otro</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Alergias</label>
        <textarea
          className="h-10 min-h-[80px] w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
          value={form.allergies}
          onChange={set("allergies")}
          placeholder="Ej. Penicilina, frutos secos…"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Medicación actual</label>
        <textarea
          className="h-10 min-h-[80px] w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
          value={form.medications}
          onChange={set("medications")}
          placeholder="Ej. Losartán 50 mg al día, omeprazol…"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={saving}>
          <Save size={18} /> {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear paciente"}
        </button>
        {onCancel && (
          <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
