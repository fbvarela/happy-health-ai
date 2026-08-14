"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell, EmptyState } from "@/components/app-shell";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";

const ROLE_CAN_EDIT = { owner: true, caregiver: true };

/**
 * AppointmentsPage — agenda of the user's patients with Google Calendar
 * one-way sync (D4). Calendar connect/disconnect lives here.
 */
export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const calendarMsg = searchParams.get("calendar");

  const [patients, setPatients] = useState([]);
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [patientRoles, setPatientRoles] = useState({});

  const [showForm, setShowForm] = useState(false);
  const [formPatient, setFormPatient] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", doctor_name: "", location: "", starts_at: "", ends_at: "" });
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchAll = useCallback(async () => {
    const ps = await api.getPatients();
    const roles = {};
    for (const p of ps) roles[p.id] = p.role;

    const all = [];
    for (const p of ps) {
      const rows = await api.getAppointments(p.id);
      for (const a of rows ?? []) all.push({ ...a, patient_id: p.id, patient_name: p.name });
    }
    all.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    return { patients: ps, roles, appts: all };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAll()
      .then(({ patients, roles, appts }) => {
        if (cancelled) return;
        setPatients(patients);
        setPatientRoles(roles);
        setAppts(appts);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    api.calendarStatus().then((s) => { if (!cancelled) setCalendarConnected(s?.connected); }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const load = useCallback(async () => {
    try {
      const { patients, roles, appts } = await fetchAll();
      setPatients(patients);
      setPatientRoles(roles);
      setAppts(appts);
    } catch (err) {
      setError(err.message);
    }
  }, [fetchAll]);

  const canEditPatient = (patientId) => Boolean(ROLE_CAN_EDIT[patientRoles[patientId]]);

  const openNew = () => {
    setEditing(null);
    setFormPatient(patients[0]?.id ?? "");
    const now = new Date();
    const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm({ title: "", doctor_name: "", location: "", starts_at: iso, ends_at: "" });
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setFormPatient(a.patient_id);
    setForm({
      title: a.title,
      doctor_name: a.doctor_name ?? "",
      location: a.location ?? "",
      starts_at: toLocalInput(a.starts_at),
      ends_at: a.ends_at ? toLocalInput(a.ends_at) : "",
    });
    setShowForm(true);
  };

  const toLocalInput = (iso) => {
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formPatient) return setError("Selecciona un paciente");
    setBusy(true);
    setError("");
    try {
      if (editing) {
        await api.updateAppointment(editing.patient_id, editing.id, form);
      } else {
        await api.createAppointment(formPatient, form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteAppointment(confirmDelete.patient_id, confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setError(err.message);
      setConfirmDelete(null);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await api.calendarDisconnect();
      setCalendarConnected(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Group by day
  const grouped = {};
  for (const a of appts) {
    const day = new Date(a.starts_at).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    (grouped[day] ??= []).push(a);
  }

  return (
    <AppShell
      title="Citas"
      eyebrow="Consultas médicas y calendario"
      showBack
      action={
        patients.length > 0 && (
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"
            onClick={openNew}
            aria-label="Nueva cita"
          >
            <Plus className="h-5 w-5" />
          </button>
        )
      }
    >
      {calendarMsg === "connected" && (
        <p className="mt-3 text-sm text-success">Calendario de Google conectado ✓</p>
      )}
      {calendarMsg === "denied" && (
        <p className="mt-3 text-sm text-destructive">No conectaste el calendario. Las citas se guardarán solo en la app.</p>
      )}

      {/* Calendar connect */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-row items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold">Google Calendar</div>
            <p className="text-sm text-muted-foreground">
              {calendarConnected
                ? "Conectado: las citas se añaden a tu calendario."
                : "Conecta tu calendario para que las citas aparezcan en Google Calendar (solo ida)."}
            </p>
          </div>
          {calendarConnected ? (
            <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground disabled:opacity-50" onClick={handleDisconnect} disabled={busy}>
              Desconectar
            </button>
          ) : (
            <button
              type="button"
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              onClick={() => {
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.assign("/api/calendar/connect");
              }}
            >
              Conectar
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Cargando…</p>
      ) : patients.length === 0 ? (
        <div className="mt-4 space-y-4">
          <EmptyState title="Aún no hay pacientes" detail="Primero crea un paciente para poder registrar citas." />
          <Link href="/patients" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Ir a pacientes</Link>
        </div>
      ) : appts.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No hay citas todavía." detail="Pulsa + Nueva para crear la primera." />
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {Object.entries(grouped).map(([day, list]) => (
            <div key={day}>
              <p className="mb-2 font-semibold capitalize text-foreground">{day}</p>
              <div className="space-y-2">
                {list.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{a.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {new Date(a.starts_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          {a.doctor_name ? ` · ${a.doctor_name}` : ""}
                        </p>
                        {a.location && <p className="text-sm text-muted-foreground">📍 {a.location}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {a.patient_name}
                          {a.google_event_id ? " · en Google Calendar" : ""}
                        </p>
                      </div>
                      {canEditPatient(a.patient_id) && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
                            onClick={() => openEdit(a)}
                            aria-label="Editar cita"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-destructive hover:bg-muted"
                            onClick={() => setConfirmDelete(a)}
                            aria-label="Eliminar cita"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? "Editar cita" : "Nueva cita"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <label className="input-label">Paciente</label>
            <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={formPatient} onChange={(e) => setFormPatient(e.target.value)} required>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Título</label>
            <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej. Revisión cardiología" required />
          </div>
          <div>
            <label className="input-label">Médico</label>
            <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} placeholder="Ej. Dra. López" />
          </div>
          <div>
            <label className="input-label">Lugar</label>
            <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej. Hospital Clínico" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Inicio</label>
              <input type="datetime-local" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required />
            </div>
            <div>
              <label className="input-label">Fin</label>
              <input type="datetime-local" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={busy}>
              <CalendarPlus size={18} /> {busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear cita"}
            </button>
            <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Eliminar cita">
        <p className="mb-4 text-muted-foreground">
          ¿Seguro que quieres eliminar &quot;{confirmDelete?.title}&quot;?
          {confirmDelete?.google_event_id ? " También se quitará de Google Calendar." : ""}
        </p>
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
