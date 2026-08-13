"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ChevronLeft, ChevronRight, ImagePlus, Plus, ShieldAlert, Trash2, X,
} from "lucide-react";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";

const SEVERITY = {
  green: { label: "Leve", color: "#2e7d4f", dot: "#2e7d4f" },
  orange: { label: "Moderado", color: "#c97f1e", dot: "#c97f1e" },
  red: { label: "Grave", color: "#d94f3d", dot: "#d94f3d" },
};
const SEVERITY_ORDER = ["red", "orange", "green"];

/**
 * IncidentsSection — report incidents (wounds, issues) with severity, photos
 * and notes (SPEC §13). Lucide icons, carrousel viewer, severity badge.
 */
export default function IncidentsSection({ patientId, canEdit }) {
  const [incidents, setIncidents] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [severity, setSeverity] = useState("green");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const [openIncident, setOpenIncident] = useState(null);
  const [viewerIdx, setViewerIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    api
      .getIncidents(patientId)
      .then((rows) => setIncidents(rows ?? []))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    let cancelled = false;
    api
      .getIncidents(patientId)
      .then((rows) => { if (!cancelled) setIncidents(rows ?? []); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [patientId]);

  const createIncident = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const inc = await api.createIncident(patientId, { title, notes, severity });
      // Upload any photos selected at creation
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
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openDetail = async (incidentId) => {
    try {
      const data = await api.getIncident(patientId, incidentId);
      setOpenIncident(data);
      setViewerIdx(0);
    } catch (err) {
      setError(err.message);
    }
  };

  const addPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !openIncident) return;
    setUploading(true);
    setError("");
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

  const toggleActive = async () => {
    if (!openIncident) return;
    try {
      await api.updateIncident(patientId, openIncident.id, { active: !openIncident.active });
      await openDetail(openIncident.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteIncident(patientId, confirmDelete);
      setConfirmDelete(null);
      setOpenIncident(null);
      load();
    } catch (err) {
      setError(err.message);
      setConfirmDelete(null);
    }
  };

  if (incidents === null) return <p className="text-muted">Cargando…</p>;

  const photos = openIncident?.photos ?? [];
  const current = photos[viewerIdx];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} className="text-bark" />
          <div className="card-title">Incidentes</div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/patients/${patientId}/incidents`} className="btn btn-sm btn-ghost">
            Ver todos
          </Link>
          {canEdit && (
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-1" /> Añadir
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt2">{error}</p>}

      {incidents.length === 0 ? (
        <p className="dog-meta mt4">Registra incidentes: heridas, caídas u otros con fotos y notas.</p>
      ) : (
        <ul className="mt4 space-y-2">
          {incidents.slice(0, 4).map((inc) => {
            const sev = SEVERITY[inc.severity] ?? SEVERITY.green;
            return (
              <li key={inc.id}>
                <button
                  type="button"
                  className="w-full text-left bg-[var(--bg)] border border-line rounded-[12px] p-3 hover:border-sun transition-colors"
                  onClick={() => openDetail(inc.id)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: sev.dot }}
                      aria-label={`Severidad: ${sev.label}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-bark truncate">{inc.title}</p>
                      <p className="text-xs text-muted">
                        {inc.photo_count} foto{inc.photo_count === 1 ? "" : "s"} ·{" "}
                        {new Date(inc.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
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
          {incidents.length > 4 && (
            <li>
              <Link href={`/patients/${patientId}/incidents`} className="btn btn-sm btn-ghost w-full justify-center">
                Ver los {incidents.length} incidentes
              </Link>
            </li>
          )}
        </ul>
      )}

      {/* New incident form — with severity + photos */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Añadir incidente">
        <form onSubmit={createIncident} className="space-y-4">
          <div>
            <label className="input-label">Título</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Herida en la mano" required />
          </div>

          <div>
            <label className="input-label">Gravedad</label>
            <div className="flex gap-2">
              {SEVERITY_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`btn btn-sm flex-1 justify-center ${severity === s ? "btn-primary" : "btn-ghost"}`}
                  style={severity === s ? { background: SEVERITY[s].color, borderColor: SEVERITY[s].color } : {}}
                >
                  {SEVERITY[s].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Notas</label>
            <textarea className="input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Descripción…" />
          </div>

          <div>
            <label className="input-label">Fotos</label>
            <label className="btn btn-ghost btn-sm cursor-pointer w-full justify-center border border-dashed border-line">
              <ImagePlus size={16} className="mr-1" /> Elegir fotos
              <input type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => setPhotoFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])} />
            </label>
            {photoFiles.length > 0 && (
              <ul className="mt2 space-y-1">
                {photoFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs text-muted">
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
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Creando…" : "Crear incidente"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
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
              <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-2"
                style={{ background: `${SEVERITY[openIncident.severity].color}20`, color: SEVERITY[openIncident.severity].color }}>
                Gravedad: {SEVERITY[openIncident.severity].label}
              </span>
            )}
            {canEdit && (
              <label className="flex items-center gap-2 text-sm mb-2">
                <input type="checkbox" checked={Boolean(openIncident.active)} onChange={toggleActive} className="w-5 h-5" />
                Activo
              </label>
            )}
            {openIncident.notes && <p className="text-muted text-sm mb-3">{openIncident.notes}</p>}

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
                {canEdit && (
                  <div className="flex gap-2 mt2">
                    <button type="button" className="btn btn-sm btn-danger" onClick={removePhoto} aria-label="Quitar foto">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {canEdit && (
              <label className={`btn btn-sm btn-primary mt3 cursor-pointer ${uploading ? "opacity-60" : ""}`}>
                <ImagePlus size={16} /> {uploading ? "…" : ""}
                <input type="file" className="hidden" accept="image/*" onChange={addPhoto} disabled={uploading} />
              </label>
            )}

            {canEdit && (
              <div className="mt4 flex items-center justify-between">
                <button type="button" className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(openIncident)} aria-label="Eliminar incidente">
                  <Trash2 size={16} />
                </button>
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
