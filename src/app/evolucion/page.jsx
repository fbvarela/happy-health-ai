"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { AppShell, EmptyState } from "@/components/app-shell";
import VitalCharts from "@/components/vitals/VitalCharts";
import api from "@/utils/api";

export default function EvolutionPage() {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPatients().then((rows) => {
      setPatients(rows ?? []);
      setPatientId(rows?.[0]?.id ?? "");
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Evolución" eyebrow="Día, semana y mes" showBack>
      {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p> : patients.length === 0 ? <EmptyState title="Aún no hay pacientes" detail="Crea un paciente para consultar la evolución de sus constantes." /> : <>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><BarChart3 className="size-5" /></span><div className="min-w-0 flex-1"><label htmlFor="evolution-patient" className="block text-xs font-medium text-muted-foreground">Paciente</label><select id="evolution-patient" className="mt-1 w-full bg-transparent text-sm font-semibold outline-none" value={patientId} onChange={(event) => setPatientId(event.target.value)}>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select></div></div>
        <div className="mt-5"><VitalCharts patientId={patientId} initialPeriod={7} /></div>
      </>}
    </AppShell>
  );
}
