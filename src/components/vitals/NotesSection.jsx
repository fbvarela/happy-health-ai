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

  if (notes === null) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-row items-center justify-between">
        <div className="text-base font-semibold">Notas de cuidado</div>
        {canEdit && (
          <button type="button" className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground" onClick={openNew}>
            + Nota
          </button>
        )}
      </div>

      {error && <p className="mt2 text-sm text-destructive">{error}</p>}

      {notes.length === 0 ? (
        <p className="mt4 text-sm text-muted-foreground">Aún no hay notas.</p>
      ) : (
        <ul className="mt4 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl border border-border p-4">
              <div className="mb-1 flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{CATEGORY_LABELS[n.category] ?? n.category}</span>
                  {n.pinned && <span className="text-xs text-muted-foreground">📌 Fijada</span>}
                </div>
                <div className="flex flex-row items-center gap-3">
                  <span className="text-xs text-muted-foreground">{fmtDate(n.created_at)}</span>
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => togglePin(n)}
                        aria-label={n.pinned ? "Quitar pin" : "Fijar"}
                      >
                        {n.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(n)}
                        aria-label="Editar nota"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="text-destructive hover:bg-muted"
                        onClick={() => setConfirmDelete(n.id)}
                        aria-label="Eliminar nota"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{n.content}</p>
            </li>
          ))}
        </ul>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Editar nota" : "Nueva nota"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Categoría</label>
            <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nota</label>
            <textarea className="h-10 min-h-[100px] w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Cómo está hoy, qué le ha dicho el médico…" required />
          </div>
          <label className="flex flex-row items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="h-5 w-5" />
            Fijar en el panel principal
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={busy}>
              <Save size={18} /> {busy ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Eliminar nota">
        <p className="mb-4 text-muted-foreground">¿Seguro que quieres eliminar esta nota?</p>
        <div className="flex gap-3">
          <button type="button" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 text-sm font-semibold text-destructive" onClick={handleDelete}>
            Eliminar
          </button>
          <button type="button" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}
