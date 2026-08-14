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

  if (uploads === null) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const photos = uploads.filter((u) => u.kind !== "video");
  const current = viewerIndex !== null ? uploads[viewerIndex] : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-row items-center justify-between">
        <div className="text-base font-semibold">Fotos y archivos</div>
        {canEdit && (
          <label className="flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50" aria-label="Añadir archivo">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            <input type="file" className="hidden" accept="image/*,video/mp4,video/quicktime,application/pdf" onChange={handleFile} disabled={uploading} />
          </label>
        )}
      </div>

      {error && <p className="mt2 text-sm text-destructive">{error}</p>}

      {uploads.length === 0 ? (
        <p className="mt4 text-sm text-muted-foreground">
          Aún no hay fotos. Añade imágenes de heridas, cajas de medicación o documentos.
        </p>
      ) : (
        <div className="mt4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {uploads.map((u, i) => (
            <button
              key={u.id}
              type="button"
              className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
              onClick={() => setViewerIndex(i)}
            >
              {u.kind === "video" ? (
                <span className="flex h-full w-full items-center justify-center text-3xl">🎬</span>
              ) : u.kind === "document" ? (
                <span className="flex h-full w-full items-center justify-center text-3xl">📄</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.url} alt={u.caption || "foto"} className="h-full w-full object-cover" />
              )}
              {u.caption && <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1 py-0.5 text-[10px] text-white">{u.caption}</span>}
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
              <iframe src={current.url} className="h-[60vh] w-full rounded-[10px]" title="documento" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.url} alt={current.caption || "foto"} className="w-full rounded-[10px]" />
            )}

            <div className="mt3 flex flex-row items-center justify-between">
              {uploads.length > 1 ? (
                <button
                  type="button"
                  className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
                  onClick={() => setViewerIndex((i) => (i - 1 + uploads.length) % uploads.length)}
                  aria-label="Anterior"
                >
                  <ChevronLeft size={20} />
                </button>
              ) : <span />}
              <p className="px-2 text-center text-sm text-muted-foreground">
                {viewerIndex + 1} / {uploads.length}
                {current.caption ? ` · ${current.caption}` : ""}
              </p>
              {uploads.length > 1 ? (
                <button
                  type="button"
                  className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
                  onClick={() => setViewerIndex((i) => (i + 1) % uploads.length)}
                  aria-label="Siguiente"
                >
                  <ChevronRight size={20} />
                </button>
              ) : <span />}
            </div>

            {canEdit && (
              <div className="mt3 flex gap-2">
                <button
                  type="button"
                  className="flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
                  onClick={() => { setEditCaptionFor(current); setCaptionDraft(current.caption ?? ""); }}
                >
                  Nota
                </button>
                <button
                  type="button"
                  className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-destructive hover:bg-muted"
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
            className="h-10 min-h-[90px] w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            placeholder="Ej. Herida en la mano izquierda, mejora visible"
          />
          <div className="flex gap-3">
            <button type="button" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" onClick={saveCaption}>
              <Save size={16} /> Guardar
            </button>
            <button type="button" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setEditCaptionFor(null)}>
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Eliminar archivo">
        <p className="mb-4 text-muted-foreground">¿Seguro que quieres eliminar este archivo?</p>
        <div className="flex gap-3">
          <button type="button" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 text-sm font-semibold text-destructive" onClick={handleDelete}>
            <Trash2 size={16} /> Eliminar
          </button>
          <button type="button" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}
