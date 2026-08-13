"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldAlert, Trash2 } from "lucide-react";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";

const SEVERITY = {
  green: { label: "Leve", color: "#2e7d4f" },
  orange: { label: "Moderado", color: "#c97f1e" },
  red: { label: "Grave", color: "#d94f3d" },
};

/**
 * /incidents — global menu option listing incidents across the user's patients.
 * Only ACTIVE by default; ?all=1 shows resolved too.
 */
export default function IncidentsList({ incidents, showAll = false }) {
  const [openIncident, setOpenIncident] = useState(null);
  const [viewerIdx, setViewerIdx] = useState(0);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyActive, setBusyActive] = useState(false);

  const openDetail = async (patientId, incidentId) => {
    try {
      const data = await api.getIncident(patientId, incidentId);
      setOpenIncident({ ...data, patientId });
      setViewerIdx(0);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async () => {
    if (!openIncident) return;
    setBusyActive(true);
    try {
      await api.updateIncident(openIncident.patientId, openIncident.id, { active: !openIncident.active });
      await openDetail(openIncident.patientId, openIncident.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyActive(false);
    }
  };

  const removePhoto = async () => {
    const photo = openIncident?.photos?.[viewerIdx];
    if (!photo) return;
    try {
      await api.deleteUpload(openIncident.patientId, photo.id);
      await openDetail(openIncident.patientId, openIncident.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteIncident(confirmDelete.patientId, confirmDelete.id);
      setConfirmDelete(null);
      setOpenIncident(null);
    } catch (err) {
      setError(err.message);
      setConfirmDelete(null);
    }
  };

  const photos = openIncident?.photos ?? [];
  const current = photos[viewerIdx];

  return (
    <div className="page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Incidentes</h1>
          <p className="page-sub">{showAll ? "Todos los incidentes." : "Incidentes activos."}</p>
        </div>
        <Link href={showAll ? "/incidents" : "/incidents?all=1"} className="btn btn-sm btn-ghost">
          {showAll ? "Solo activos" : "Ver resueltos"}
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm mt4">{error}</p>}

      {incidents.length === 0 ? (
        <div className="card mt16">
          <div className="empty-state">
            <div className="empty-icon"><ShieldAlert size={28} /></div>
            <p>No hay incidentes {showAll ? "" : "activos"}.</p>
          </div>
        </div>
      ) : (
        <ul className="mt16 space-y-2">
          {incidents.map((inc) => {
            const sev = SEVERITY[inc.severity] ?? SEVERITY.green;
            return (
              <li key={inc.id}>
                <button
                  type="button"
                  className="w-full text-left bg-surface rounded-[14px] border-[1.5px] border-line p-4 hover:border-sun transition-colors"
                  onClick={() => openDetail(inc.patient_id, inc.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: sev.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-bark truncate">
                        {inc.title}
                        {!inc.active && <span className="text-xs text-muted font-normal ml-2">· resuelto</span>}
                      </p>
                      <p className="text-xs text-muted">
                        {inc.patient_name} ·{" "}
                        {new Date(inc.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${sev.color}20`, color: sev.color }}>
                      {sev.label}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Incident detail + carrousel */}
      <Modal open={Boolean(openIncident)} onClose={() => setOpenIncident(null)} title={openIncident?.title ?? "Incidente"}>
        {openIncident && (
          <div>
            {openIncident.severity && (
              <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-2"
                style={{ background: `${SEVERITY[openIncident.severity].color}20`, color: SEVERITY[openIncident.severity].color }}>
                Gravedad: {SEVERITY[openIncident.severity].label}
              </span>
            )}

            {/* Active toggle */}
            <label className="flex items-center gap-2 text-sm mb-2">
              <input type="checkbox" checked={Boolean(openIncident.active)} onChange={toggleActive} disabled={busyActive} className="w-5 h-5" />
              Activo
            </label>

            {openIncident.notes && <p className="text-muted text-sm mb-3">{openIncident.notes}</p>}
            <Link href={`/patients/${openIncident.patientId}`} className="text-sm text-muted hover:text-bark inline-block mb-3">
              ← Ver paciente
            </Link>

            {photos.length === 0 ? (
              <p className="text-muted text-sm mb-3">Sin fotos todavía.</p>
            ) : (
              <div>
                {current.kind === "video" ? (
                  <video src={current.url} controls className="w-full rounded-[10px]" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current.url} alt={current.caption || "foto"} className="w-full rounded-[10px]" />
                )}
                <div className="flex items-center justify-between mt3">
                  <button type="button" className="btn btn-sm btn-ghost" disabled={viewerIdx === 0}
                    onClick={() => setViewerIdx((i) => Math.max(0, i - 1))} aria-label="Anterior">
                    <ChevronLeft size={20} />
                  </button>
                  <p className="text-sm text-muted">
                    {viewerIdx + 1} / {photos.length}
                    {current.caption ? ` · ${current.caption}` : ""}
                  </p>
                  <button type="button" className="btn btn-sm btn-ghost" disabled={viewerIdx === photos.length - 1}
                    onClick={() => setViewerIdx((i) => Math.min(photos.length - 1, i + 1))} aria-label="Siguiente">
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="flex gap-2 mt2">
                  <button type="button" className="btn btn-sm btn-danger" onClick={removePhoto}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Eliminar incidente">
        <p className="text-muted mb-4">¿Seguro que quieres eliminar este incidente y sus fotos?</p>
        <div className="flex gap-3">
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            Eliminar
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}
