"use client";

import { useEffect, useState } from "react";
import { Pencil, Pin, PinOff, Save, Trash2 } from "lucide-react";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";

const CATEGORY_LABELS = {
  general: "General",
  medication: "Medicación",
  doctor: "Médico",
  behavior: "Comportamiento",
};

/**
 * NotesSection — care notes CRUD with categories + pinning (SPEC §4.2).
 * Pinned notes are shown first and marked.
 */
export default function NotesSection({ patientId, canEdit }) {
  const [notes, setNotes] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category: "general", content: "", pinned: false });
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    api
      .getNotes(patientId)
      .then((rows) => setNotes(rows ?? []))
      .catch((err) => setError(err.message));
  };

  useEffect(load, [patientId]);

  const openNew = () => {
    setEditing(null);
    setForm({ category: "general", content: "", pinned: false });
    setShowForm(true);
  };

  const openEdit = (n) => {
    setEditing(n);
    setForm({ category: n.category, content: n.content, pinned: n.pinned });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editing) {
        await api.updateNote(patientId, editing.id, form);
      } else {
        await api.createNote(patientId, form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const togglePin = async (n) => {
    try {
      await api.updateNote(patientId, n.id, { pinned: !n.pinned });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteNote(patientId, confirmDelete);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.message);
      setConfirmDelete(null);
    }
  };

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  if (notes === null) return <p className="text-muted">Cargando…</p>;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="card-title">Notas de cuidado</div>
        {canEdit && (
          <button type="button" className="btn btn-sm btn-primary" onClick={openNew}>
            + Nota
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mt2">{error}</p>}

      {notes.length === 0 ? (
        <p className="dog-meta mt4">Aún no hay notas.</p>
      ) : (
        <ul className="mt4 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="border border-line rounded-[12px] p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="badge badge-sun">{CATEGORY_LABELS[n.category] ?? n.category}</span>
                  {n.pinned && <span className="text-xs text-muted">📌 Fijada</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{fmtDate(n.created_at)}</span>
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        className="text-muted hover:text-bark"
                        onClick={() => togglePin(n)}
                        aria-label={n.pinned ? "Quitar pin" : "Fijar"}
                      >
                        {n.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                      <button
                        type="button"
                        className="text-muted hover:text-bark"
                        onClick={() => openEdit(n)}
                        aria-label="Editar nota"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => setConfirmDelete(n.id)}
                        aria-label="Eliminar nota"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-bark text-sm whitespace-pre-wrap">{n.content}</p>
            </li>
          ))}
        </ul>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Editar nota" : "Nueva nota"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="input-label">Categoría</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Nota</label>
            <textarea className="input min-h-[100px]" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Cómo está hoy, qué le ha dicho el médico…" required />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="w-5 h-5" />
            Fijar en el panel principal
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={busy}>
              <Save size={18} className="mr-1" /> {busy ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Eliminar nota">
        <p className="text-muted mb-4">¿Seguro que quieres eliminar esta nota?</p>
        <div className="flex gap-3">
          <button type="button" className="btn btn-danger flex-1 justify-center" onClick={handleDelete}>
            Eliminar
          </button>
          <button type="button" className="btn btn-ghost flex-1 justify-center" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}
