"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";

/**
 * GallerySection — patient photos/videos (SPEC §4.5). Uploads go directly to
 * R2 (private, signed URL); rows are created after the PUT. Viewer opens a
 * carrousel ordered by datetime with arrows + per-photo caption.
 */
export default function GallerySection({ patientId, canEdit }) {
  const [uploads, setUploads] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [editCaptionFor, setEditCaptionFor] = useState(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    api
      .getUploads(patientId)
      .then((rows) => setUploads(rows ?? []))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    let cancelled = false;
    api
      .getUploads(patientId)
      .then((rows) => { if (!cancelled) setUploads(rows ?? []); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [patientId]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { uploadUrl, key, kind } = await api.requestUploadUrl(patientId, {
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });
      const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      if (!res.ok) throw new Error("La subida a R2 falló");
      await api.confirmUpload(patientId, { key, kind, mime_type: file.type, size_bytes: file.size });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const saveCaption = async () => {
    if (!editCaptionFor) return;
    try {
      await api.updateUpload(patientId, editCaptionFor.id, { caption: captionDraft });
      setEditCaptionFor(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteUpload(patientId, confirmDelete.id);
      setConfirmDelete(null);
      setViewerIndex(null);
      load();
    } catch (err) {
      setError(err.message);
      setConfirmDelete(null);
    }
  };

  if (uploads === null) return <p className="text-muted">Cargando…</p>;

  const photos = uploads.filter((u) => u.kind !== "video");
  const current = viewerIndex !== null ? uploads[viewerIndex] : null;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="card-title">Fotos y archivos</div>
        {canEdit && (
          <label className="btn btn-sm btn-primary cursor-pointer" aria-label="Añadir archivo">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            <input type="file" className="hidden" accept="image/*,video/mp4,video/quicktime,application/pdf" onChange={handleFile} disabled={uploading} />
          </label>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mt2">{error}</p>}

      {uploads.length === 0 ? (
        <p className="dog-meta mt4">
          Aún no hay fotos. Añade imágenes de heridas, cajas de medicación o documentos.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt4">
          {uploads.map((u, i) => (
            <button
              key={u.id}
              type="button"
              className="aspect-square rounded-[10px] overflow-hidden border border-line bg-[var(--bg)] relative"
              onClick={() => setViewerIndex(i)}
            >
              {u.kind === "video" ? (
                <span className="w-full h-full flex items-center justify-center text-3xl">🎬</span>
              ) : u.kind === "document" ? (
                <span className="w-full h-full flex items-center justify-center text-3xl">📄</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.url} alt={u.caption || "foto"} className="w-full h-full object-cover" />
              )}
              {u.caption && <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate">{u.caption}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Carrousel viewer */}
      <Modal open={viewerIndex !== null} onClose={() => setViewerIndex(null)}>
        {current && (
          <div className="relative">
            {current.kind === "video" ? (
              <video src={current.url} controls className="w-full rounded-[10px]" />
            ) : current.kind === "document" ? (
              <iframe src={current.url} className="w-full h-[60vh] rounded-[10px]" title="documento" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.url} alt={current.caption || "foto"} className="w-full rounded-[10px]" />
            )}

            <div className="flex items-center justify-between mt3">
              {uploads.length > 1 ? (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setViewerIndex((i) => (i - 1 + uploads.length) % uploads.length)}
                  aria-label="Anterior"
                >
                  <ChevronLeft size={20} />
                </button>
              ) : <span />}
              <p className="text-sm text-muted text-center px-2">
                {viewerIndex + 1} / {uploads.length}
                {current.caption ? ` · ${current.caption}` : ""}
              </p>
              {uploads.length > 1 ? (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setViewerIndex((i) => (i + 1) % uploads.length)}
                  aria-label="Siguiente"
                >
                  <ChevronRight size={20} />
                </button>
              ) : <span />}
            </div>

            {canEdit && (
              <div className="flex gap-2 mt3">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost flex-1 justify-center"
                  onClick={() => { setEditCaptionFor(current); setCaptionDraft(current.caption ?? ""); }}
                >
                  Nota
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => setConfirmDelete(current)}
                  aria-label="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Caption edit */}
      <Modal open={Boolean(editCaptionFor)} onClose={() => setEditCaptionFor(null)} title="Nota de la foto">
        <div className="space-y-4">
          <textarea
            className="input min-h-[90px]"
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            placeholder="Ej. Herida en la mano izquierda, mejora visible"
          />
          <div className="flex gap-3">
            <button type="button" className="btn btn-primary flex-1 justify-center" onClick={saveCaption}>
              <Save size={16} className="mr-1" /> Guardar
            </button>
            <button type="button" className="btn btn-ghost flex-1 justify-center" onClick={() => setEditCaptionFor(null)}>
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Eliminar archivo">
        <p className="text-muted mb-4">¿Seguro que quieres eliminar este archivo?</p>
        <div className="flex gap-3">
          <button type="button" className="btn btn-danger flex-1 justify-center" onClick={handleDelete}>
            <Trash2 size={16} className="mr-1" /> Eliminar
          </button>
          <button type="button" className="btn btn-ghost flex-1 justify-center" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}
