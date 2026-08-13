"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartPulse } from "lucide-react";
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
    <div className="page">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-sub">Las personas a las que cuidas</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Nuevo
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : patients.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><HeartPulse size={28} /></div>
            <p>
              Aún no hay pacientes. Pulsa <b>+ Nuevo</b> para crear el primer
              perfil y empezar a registrar constantes, notas y citas.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <Link key={p.id} href={`/patients/${p.id}`} className="block">
              <div className="bg-surface rounded-[14px] border-[1.5px] border-line p-5 hover:border-sun transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-bark text-[1.1rem]">{p.name}</p>
                    {p.dob && (
                      <p className="text-muted text-sm">
                        {new Date(p.dob).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <span className="badge badge-sun">{roleLabel[p.role] ?? p.role}</span>
                </div>
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
    </div>
  );
}
