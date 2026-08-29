"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { AppShell, EmptyState } from "@/components/app-shell";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";

/**
 * /emergencias — global menu option listing emergencies across the user's patients.
 */
export default function EmergenciesList({ emergencies, showAll = false }) {
  const [openEmergency, setOpenEmergency] = useState(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const openDetail = async (patientId, emergencyId) => {
    try {
      const data = await api.getEmergency(patientId, emergencyId);
      setOpenEmergency({ ...data, patientId });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusyDelete(true);
    try {
      await api.deleteEmergency(confirmDelete.patientId, confirmDelete.id);
      setConfirmDelete(null);
      setOpenEmergency(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyDelete(false);
    }
  };

  return (
    <AppShell
      title="Emergencias"
      eyebrow={showAll ? "Todas las emergencias" : "Emergencias"}
      showBack
      action={
        <Link href={showAll ? "/emergencias" : "/emergencias"} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-muted-foreground">
          {showAll ? "Filtrar" : "Ver todas"}
        </Link>
      }
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      {emergencies.length === 0 ? (
        <div className="mt-2">
          <EmptyState title={showAll ? "No hay emergencias." : "No hay emergencias."} detail="Cuando registres una emergencia la verás aquí." />
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {emergencies.map((em) => (
            <li key={em.id}>
              <button
                type="button"
                className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary"
                onClick={() => openDetail(em.patient_id, em.id)}
              >
                <div className="flex flex-row items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {em.type}
                      {!em.resolved && <span className="ml-2 text-xs font-normal text-muted-foreground">· activa</span>}
                      {em.resolved && <span className="ml-2 text-xs font-normal text-muted-foreground">· resuelta</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {em.patient_name} ·{" "}
                      {new Date(em.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      {em.created_at !== em.updated_at && <span className="text-xs ml-2">(actualizada)</span>}
                    </p>
                    {em.details && (
                      <p className="mt-1 text-xs text-muted-foreground break-all">
                        {em.details}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-xs"
                    style={{ background: em.resolved ? "#2e7d4f20" : "#d94f3d20", color: em.resolved ? "#2e7d4f" : "#d94f3d" }}>
                    {em.resolved ? "Resuelta" : "Activa"}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Emergency detail */}
      <Modal open={Boolean(openEmergency)} onClose={() => setOpenEmergency(null)} title={openEmergency?.type ?? "Emergencia"}>
        {openEmergency && (
          <div>
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold">Tipo:</p>
              <p className="text-sm text-muted-foreground break-all">{openEmergency.type}</p>
            </div>

            {openEmergency.details && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold">Detalles:</p>
                <p className="text-sm text-muted-foreground break-all">{openEmergency.details}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold">Estado:</p>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs
                ${openEmergency.resolved ? "bg-success/10 text-success" : "bg-critical/10 text-critical"}`}>
                {openEmergency.resolved ? "Resuelta" : "Activa"}
              </span>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold">Fecha:</p>
              <p className="text-sm text-muted-foreground">
                {new Date(openEmergency.created_at).toLocaleString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>

            <Link
              href={`/patients/${openEmergency.patientId}`}
              aria-label="Ver paciente"
              className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary"
            >
              <ArrowLeft size={20} />
            </Link>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Eliminar emergencia">
        <p className="mb-4 text-muted-foreground">¿Seguro que quieres eliminar esta emergencia?</p>
        <div className="flex gap-3">
          <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 text-sm font-semibold text-destructive" onClick={handleDelete} disabled={busyDelete}>
            {busyDelete ? "Eliminando..." : "Eliminar"}
          </button>
          <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}