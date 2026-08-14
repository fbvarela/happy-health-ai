"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { AppShell, EmptyState } from "@/components/app-shell";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";
import PatientForm from "@/components/PatientForm";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api
      .getPatients()
      .then(setPatients)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (patient) => {
    setPatients((prev) => [patient, ...prev]);
    setShowCreate(false);
    router.push(`/patients/${patient.id}`);
  };

  const roleLabel = { owner: "Propietario", caregiver: "Cuidador", viewer: "Lector" };

  return (
    <AppShell title="Pacientes" eyebrow="Las personas a las que cuidas" showBack action={
      <button type="button" onClick={() => setShowCreate(true)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-label="Añadir paciente">
        <Plus className="h-5 w-5" />
      </button>
    }>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : patients.length === 0 ? (
        <div className="mt-2">
          <EmptyState title="Aún no hay pacientes" detail="Pulsa + para crear el primer perfil y empezar a registrar constantes, notas y citas." />
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          {patients.map((p) => (
            <Link key={p.id} href={`/patients/${p.id}`} className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold text-primary">
                    {(p.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    {p.dob && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(p.dob).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {roleLabel[p.role] ?? p.role}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nuevo paciente"
        sub="Los datos que introduces se guardan en privado."
      >
        <PatientForm onSaved={handleCreated} onCancel={() => setShowCreate(false)} />
      </Modal>
    </AppShell>
  );
}
