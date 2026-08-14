"use client";

import { useEffect, useState } from "react";
import { Check, Pill, Plus, Trash2 } from "lucide-react";
import { AppShell, EmptyState } from "@/components/app-shell";
import api from "@/utils/api";

const GROUPS = [
  { key: "breakfast", label: "Desayuno" },
  { key: "lunch", label: "Comida" },
  { key: "supper", label: "Cena" },
];

export default function MedicationsPage() {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [medications, setMedications] = useState([]);
  const [form, setForm] = useState({ name: "", quantity: "", meal_group: "breakfast" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPatients().then((rows) => {
      setPatients(rows ?? []);
      setPatientId(rows?.[0]?.id ?? "");
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!patientId) return;
    api.getMedications(patientId).then((rows) => setMedications(rows ?? [])).catch((err) => setError(err.message));
  }, [patientId]);

  const addMedication = async (event) => {
    event.preventDefault();
    if (!patientId) return;
    setSaving(true);
    setError("");
    try {
      const medication = await api.createMedication(patientId, form);
      setMedications((current) => [...current, medication].sort((a, b) => a.meal_group.localeCompare(b.meal_group) || a.name.localeCompare(b.name)));
      setForm({ name: "", quantity: "", meal_group: "breakfast" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeMedication = async (id) => {
    try {
      await api.deleteMedication(patientId, id);
      setMedications((current) => current.filter((medication) => medication.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AppShell title="Medicación" eyebrow="Tratamiento diario" showBack>
      {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p> : patients.length === 0 ? (
        <EmptyState title="Aún no hay pacientes" detail="Crea un paciente antes de configurar su medicación." />
      ) : (
        <>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Paciente</label>
          <select className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={patientId} onChange={(event) => setPatientId(event.target.value)}>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
          </select>

          <form onSubmit={addMedication} className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Plus className="size-5" /></span><h2 className="font-semibold">Añadir medicación</h2></div>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-4 space-y-3">
              <input className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" placeholder="Nombre del medicamento" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              <input className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" placeholder="Cantidad (ej. 1 comprimido)" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
              <div className="grid grid-cols-3 gap-2">
                {GROUPS.map((group) => <button key={group.key} type="button" onClick={() => setForm({ ...form, meal_group: group.key })} className={`min-h-11 rounded-xl border px-2 text-sm font-semibold ${form.meal_group === group.key ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}>{group.label}</button>)}
              </div>
              <button type="submit" disabled={saving} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Plus size={18} />{saving ? "Guardando…" : "Añadir"}</button>
            </div>
          </form>

          <div className="mt-6 space-y-3">
            {GROUPS.map((group) => {
              const entries = medications.filter((medication) => medication.meal_group === group.key);
              return <section key={group.key}>
                <h2 className="mb-2 text-base font-semibold">{group.label}</h2>
                {entries.length === 0 ? <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">Sin medicación</p> : entries.map((medication) => <div key={medication.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"><span className="flex size-9 items-center justify-center rounded-xl bg-accent text-primary"><Pill className="size-5" /></span><div className="min-w-0 flex-1"><p className="font-semibold">{medication.name}</p><p className="text-sm text-muted-foreground">{medication.quantity}</p></div>{medication.taken && <Check className="size-5 text-success" aria-label="Tomada hoy" />}<button type="button" onClick={() => removeMedication(medication.id)} className="flex size-10 items-center justify-center rounded-xl text-destructive hover:bg-muted" aria-label={`Eliminar ${medication.name}`}><Trash2 className="size-4" /></button></div>)}
              </section>;
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}
