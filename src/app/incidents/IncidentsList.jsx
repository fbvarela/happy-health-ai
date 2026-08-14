"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Save, Trash2 } from "lucide-react";
import { AppShell, EmptyState } from "@/components/app-shell";
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
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");
  const [savingCaption, setSavingCaption] = useState(false);

  const openDetail = async (patientId, incidentId) => {
    try {
      const data = await api.getIncident(patientId, incidentId);
      setOpenIncident({ ...data, patientId });
      setViewerIdx(0);
      setEditingCaption(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveCaption = async () => {
    const photo = openIncident?.photos?.[viewerIdx];
    if (!photo) return;
    setSavingCaption(true);
    try {
      await api.updateUpload(openIncident.patientId, photo.id, { caption: captionDraft });
      setEditingCaption(false);
      await openDetail(openIncident.patientId, openIncident.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingCaption(false);
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
    <AppShell
      title="Incidentes"
      eyebrow={showAll ? "Todos los incidentes" : "Incidentes activos"}
      showBack
      action={
        <Link href={showAll ? "/incidents" : "/incidents?all=1"} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-muted-foreground">
          {showAll ? "Solo activos" : "Ver resueltos"}
        </Link>
      }
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      {incidents.length === 0 ? (
        <div className="mt-2">
          <EmptyState title={showAll ? "No hay incidentes." : "No hay incidentes activos."} detail="Cuando registres un incidente lo verás aquí." />
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {incidents.map((inc) => {
            const sev = SEVERITY[inc.severity] ?? SEVERITY.green;
            return (
              <li key={inc.id}>
                <button
                  type="button"
                  className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary"
                  onClick={() => openDetail(inc.patient_id, inc.id)}
                >
                  <div className="flex flex-row items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: sev.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {inc.title}
                        {!inc.active && <span className="ml-2 text-xs font-normal text-muted-foreground">· resuelto</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {inc.patient_name} ·{" "}
                        {new Date(inc.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: `${sev.color}20`, color: sev.color }}>
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
              <span className="mb-2 inline-block rounded-full px-2 py-0.5 text-xs"
                style={{ background: `${SEVERITY[openIncident.severity].color}20`, color: SEVERITY[openIncident.severity].color }}>
                Gravedad: {SEVERITY[openIncident.severity].label}
              </span>
            )}

            {/* Active toggle */}
            <label className="mb-2 flex flex-row items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(openIncident.active)} onChange={toggleActive} disabled={busyActive} className="h-5 w-5" />
              Activo
            </label>

            {openIncident.notes && <p className="mb-3 text-sm text-muted-foreground">{openIncident.notes}</p>}
            <Link
              href={`/patients/${openIncident.patientId}`}
              aria-label="Ver paciente"
              className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary"
            >
              <ArrowLeft size={20} />
            </Link>

            {photos.length === 0 ? (
              <p className="mb-3 text-sm text-muted-foreground">Sin fotos todavía.</p>
            ) : (
              <div>
                {current.kind === "video" ? (
                  <video src={current.url} controls className="w-full rounded-[10px]" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current.url} alt={current.caption || "foto"} className="w-full rounded-[10px]" />
                )}
                <div className="mt-3 flex flex-row items-center justify-between">
                  <button type="button" className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50" disabled={viewerIdx === 0}
                    onClick={() => setViewerIdx((i) => Math.max(0, i - 1))} aria-label="Anterior">
                    <ChevronLeft size={20} />
                  </button>
                  <p className="text-sm text-muted-foreground">
                    {viewerIdx + 1} / {photos.length}
                  </p>
                  <button type="button" className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50" disabled={viewerIdx === photos.length - 1}
                    onClick={() => setViewerIdx((i) => Math.min(photos.length - 1, i + 1))} aria-label="Siguiente">
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Photo note */}
                {editingCaption ? (
                  <div className="mt-3">
                    <textarea
                      className="min-h-[70px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                      value={captionDraft}
                      onChange={(e) => setCaptionDraft(e.target.value)}
                      placeholder="Nota de esta foto (evolución, observaciones…)"
                    />
                    <div className="mt-2 flex flex-row gap-2">
                      <button type="button" className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50" onClick={saveCaption} disabled={savingCaption}>
                        <Save size={14} /> {savingCaption ? "Guardando…" : "Guardar"}
                      </button>
                      <button type="button" className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted" onClick={() => setEditingCaption(false)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  current.caption && (
                    <p className="mt-3 whitespace-pre-wrap rounded-lg border border-border bg-muted p-3 text-sm text-foreground">
                      {current.caption}
                    </p>
                  )
                )}

                <div className="mt-2 flex flex-row items-center gap-2">
                  <button
                    type="button"
                    className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
                    onClick={() => { setCaptionDraft(current.caption ?? ""); setEditingCaption(true); }}
                    aria-label={current.caption ? "Editar nota" : "Añadir nota"}
                  >
                    <Pencil size={14} />
                  </button>
                  <button type="button" className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-destructive hover:bg-muted" onClick={removePhoto} aria-label="Quitar foto">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Eliminar incidente">
        <p className="mb-4 text-muted-foreground">¿Seguro que quieres eliminar este incidente y sus fotos?</p>
        <div className="flex gap-3">
          <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 text-sm font-semibold text-destructive" onClick={handleDelete}>
            Eliminar
          </button>
          <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}
