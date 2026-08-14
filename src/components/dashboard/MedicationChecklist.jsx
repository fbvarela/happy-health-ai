"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Pill } from "lucide-react";
import api from "@/utils/api";

const GROUPS = [
  { key: "breakfast", label: "Desayuno" },
  { key: "lunch", label: "Comida" },
  { key: "supper", label: "Cena" },
];

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function MedicationChecklist({ patientId, className = "mt-4" }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    api.getMedications(patientId, todayString()).then((rows) => setMedications(rows ?? [])).catch(() => setError(true)).finally(() => setLoading(false));
  }, [patientId]);

  const toggle = async (medication) => {
    const date = todayString();
    setSaving(medication.id);
    try {
      if (medication.taken) await api.unmarkMedicationTaken(patientId, medication.id, date);
      else await api.markMedicationTaken(patientId, medication.id, date);
      setMedications((current) => current.map((item) => item.id === medication.id ? { ...item, taken: !item.taken } : item));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <section className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">Cargando medicación…</section>;
  const completed = medications.filter((medication) => medication.taken).length;
  return (
    <section className={`${className} rounded-2xl border border-border bg-card p-4 shadow-sm`} aria-labelledby="medication-heading">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Pill className="size-5" /></span><div><h2 id="medication-heading" className="text-base font-semibold">Medicación de hoy</h2><p className="text-xs text-muted-foreground">{completed} de {medications.length} tomadas</p></div></div>
        <Link href="/medications" className="text-xs font-semibold text-primary">Gestionar</Link>
      </div>
      {error ? <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-muted-foreground">No se pudo cargar la medicación. Comprueba que la migración de medicación está aplicada.</div> : medications.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">No hay medicación configurada. <Link href="/medications" className="font-semibold text-primary">Configurar medicación</Link></div> : <div className="mt-4 space-y-3">
        {GROUPS.map((group) => {
          const entries = medications.filter((medication) => medication.meal_group === group.key);
          if (entries.length === 0) return null;
          return <div key={group.key}><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p><div className="space-y-2">{entries.map((medication) => <button key={medication.id} type="button" disabled={saving === medication.id} onClick={() => toggle(medication)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-background px-3 text-left disabled:opacity-50"><span className={`flex size-7 items-center justify-center rounded-lg border ${medication.taken ? "border-success bg-success text-success-foreground" : "border-input bg-card"}`}>{medication.taken && <Check className="size-4" />}</span><span className="min-w-0 flex-1"><span className={`block text-sm font-semibold ${medication.taken ? "text-muted-foreground line-through" : "text-foreground"}`}>{medication.name}</span><span className="block text-xs text-muted-foreground">{medication.quantity}</span></span></button>)}</div></div>;
        })}
      </div>}
    </section>
  );
}
