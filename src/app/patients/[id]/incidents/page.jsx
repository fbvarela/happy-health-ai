"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { AppShell, EmptyState } from "@/components/app-shell";
import {
  ChevronLeft, ChevronRight, ImagePlus, Pencil, Plus, Save, Trash2, X,
} from "lucide-react";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";

const SEVERITY = {
  green: { label: "Leve", color: "#2e7d4f" },
  orange: { label: "Moderado", color: "#c97f1e" },
  red: { label: "Grave", color: "#d94f3d" },
};
const SEVERITY_ORDER = ["red", "orange", "green"];

/**
 * /patients/[id]/incidents — list ALL incidents for a patient (menu option).
 * ?open=<id> opens that incident's carrousel (e.g. from the dashboard tile).
 */
export default function IncidentsListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = params.id;

  const [incidents, setIncidents] = useState(null);
  const [error, setError] = useState("");
  const [openIncident, setOpenIncident] = useState(null);
  const [viewerIdx, setViewerIdx] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [severity, setSeverity] = useState("green");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");
  const [savingCaption, setSavingCaption] = useState(false);

  const canEdit = true; // role checked server-side per API; UI allows, API enforces

  const load = useCallback(async () => {
    try {
      const rows = await api.getIncidents(patientId);
      setIncidents(rows ?? []);
    } catch (err) {
      setError(err.message);
    }
  }, [patientId]);

  useEffect(() => {
    let cancelled = false;
    api
      .getIncidents(patientId)
      .then((rows) => { if (!cancelled) setIncidents(rows ?? []); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [patientId]);

  const openDetail = async (incidentId) => {
    try {
      const data = await api.getIncident(patientId, incidentId);
      setOpenIncident(data);
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
      await api.updateUpload(patientId, photo.id, { caption: captionDraft });
      setEditingCaption(false);
      await openDetail(openIncident.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingCaption(false);
    }
  };

  // Open incident from ?open= param
  useEffect(() => {
    const id = searchParams.get("open");
    if (!id) return;
    let cancelled = false;
    api
      .getIncident(patientId, id)
      .then((data) => {
        if (!cancelled) {
          setOpenIncident(data);
          setViewerIdx(0);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const createIncident = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const inc = await api.createIncident(patientId, { title, notes, severity });
      for (const file of photoFiles) {
        const { uploadUrl, key, kind } = await api.requestUploadUrl(patientId, {
          filename: file.name,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
        });
        const res = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });
        if (res.ok) {
          await api.confirmUpload(patientId, {
            key, kind, mime_type: file.type, size_bytes: file.size, incident_id: inc.id,
          });
        }
      }
      setTitle("");
      setNotes("");
      setSeverity("green");
      setPhotoFiles([]);
      setShowForm(false);
      await openDetail(inc.id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !openIncident) return;
    setUploading(true);
    try {
      const { uploadUrl, key, kind } = await api.requestUploadUrl(patientId, {
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!res.ok) throw new Error("La subida a R2 falló");
      await api.confirmUpload(patientId, {
        key, kind, mime_type: file.type, size_bytes: file.size, incident_id: openIncident.id,
      });
      await openDetail(openIncident.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    const photo = openIncident?.photos?.[viewerIdx];
    if (!photo) return;
    try {
      await api.deleteUpload(patientId, photo.id);
      await openDetail(openIncident.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteIncident(patientId, confirmDelete.id);
      setConfirmDelete(null);
      setOpenIncident(null);
      await load();
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
      eyebrow="Todos los incidentes registrados"
      showBack
      action={
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"
          onClick={() => setShowForm(true)}
          aria-label="Añadir incidente"
        >
          <Plus size={20} />
        </button>
      }
    >
      {incidents === null ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <>
          {error && <p className="mt4 text-sm text-destructive">{error}</p>}

          {incidents.length === 0 ? (
            <div className="mt16">
              <EmptyState
                title="No hay incidentes registrados"
                detail="Registra heridas, caídas y otros eventos para llevar el seguimiento."
              />
            </div>
          ) : (
            <ul className="mt16 space-y-2">
              {incidents.map((inc) => {
                const sev = SEVERITY[inc.severity] ?? SEVERITY.green;
                return (
                  <li key={inc.id}>
                    <button
                      type="button"
                      className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary"
                      onClick={() => openDetail(inc.id)}
                    >
                      <div className="flex flex-row items-center gap-3">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: sev.color }} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground">{inc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {inc.photo_count} foto{inc.photo_count === 1 ? "" : "s"} ·{" "}
                            {new Date(inc.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: `${sev.color}20`, color: sev.color }}>
                          {sev.label}
                        </span>
                        <span className="text-2xl text-muted-foreground">›</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* New incident form */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Añadir incidente">
        <form onSubmit={createIncident} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Título</label>
            <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Herida en la mano" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Gravedad</label>
            <div className="flex gap-2">
              {SEVERITY_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium ${severity === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  style={severity === s ? { background: SEVERITY[s].color, borderColor: SEVERITY[s].color } : {}}
                >
                  {SEVERITY[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notas</label>
            <textarea className="h-10 min-h-[80px] w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Descripción…" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Fotos</label>
            <label className="flex min-h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs font-medium text-muted-foreground hover:bg-muted">
              <ImagePlus size={16} /> Elegir fotos
              <input type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => setPhotoFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])} />
            </label>
            {photoFiles.length > 0 && (
              <ul className="mt2 space-y-1">
                {photoFiles.map((f, i) => (
                  <li key={i} className="flex flex-row items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{f.name}</span>
                    <button type="button" onClick={() => setPhotoFiles((prev) => prev.filter((_, j) => j !== i))} aria-label="Quitar">
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={busy}>
              {busy ? "Creando…" : "Crear incidente"}
            </button>
            <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

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
            {openIncident.notes && <p className="mb-3 text-sm text-muted-foreground">{openIncident.notes}</p>}

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
                <div className="mt3 flex flex-row items-center justify-between">
                  <button type="button" className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted" disabled={viewerIdx === 0}
                    onClick={() => setViewerIdx((i) => Math.max(0, i - 1))} aria-label="Anterior">
                    <ChevronLeft size={20} />
                  </button>
                  <p className="text-sm text-muted-foreground">
                    {viewerIdx + 1} / {photos.length}
                  </p>
                  <button type="button" className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted" disabled={viewerIdx === photos.length - 1}
                    onClick={() => setViewerIdx((i) => Math.min(photos.length - 1, i + 1))} aria-label="Siguiente">
                    <ChevronRight size={20} />
                  </button>
                </div>

                {editingCaption ? (
                  <div className="mt3">
                    <textarea
                      className="h-10 min-h-[70px] w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
                      value={captionDraft}
                      onChange={(e) => setCaptionDraft(e.target.value)}
                      placeholder="Nota de esta foto (evolución, observaciones…)"
                    />
                    <div className="mt2 flex flex-row gap-2">
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
                    <p className="mt3 whitespace-pre-wrap rounded-xl border border-border bg-muted p-3 text-sm text-foreground">
                      {current.caption}
                    </p>
                  )
                )}

                <div className="mt2 flex flex-row items-center gap-2">
                  <button
                    type="button"
                    className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
                    onClick={() => { setCaptionDraft(current.caption ?? ""); setEditingCaption(true); }}
                    aria-label={current.caption ? "Editar nota" : "Añadir nota"}
                  >
                    <Pencil size={14} />
                  </button>
                  <button type="button" className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-destructive hover:bg-muted" onClick={removePhoto} aria-label="Quitar foto">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}

            <label className={`mt3 flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50 ${uploading ? "opacity-60" : ""}`}>
              <ImagePlus size={16} /> {uploading ? "…" : ""}
              <input type="file" className="hidden" accept="image/*" onChange={addPhoto} disabled={uploading} />
            </label>

            <div className="mt4 flex items-center justify-between">
              <button type="button" className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-destructive hover:bg-muted" onClick={() => setConfirmDelete(openIncident)} aria-label="Eliminar incidente">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Eliminar incidente">
        <p className="mb-4 text-muted-foreground">¿Seguro que quieres eliminar este incidente y sus fotos?</p>
        <div className="flex gap-3">
          <button type="button" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 text-sm font-semibold text-destructive" onClick={handleDelete}>
            Eliminar
          </button>
          <button type="button" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}
