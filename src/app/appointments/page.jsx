"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
    <div className="page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Citas</h1>
          <p className="page-sub">Consultas médicas y calendario</p>
        </div>
        {patients.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={openNew}>
            + Nueva
          </button>
        )}
      </div>

      {calendarMsg === "connected" && (
        <p className="text-green-700 text-sm mt3">Calendario de Google conectado ✓</p>
      )}
      {calendarMsg === "denied" && (
        <p className="text-red-600 text-sm mt3">No conectaste el calendario. Las citas se guardarán solo en la app.</p>
      )}

      {/* Calendar connect */}
      <div className="card mt16">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="card-title">Google Calendar</div>
            <p className="dog-meta">
              {calendarConnected
                ? "Conectado: las citas se añaden a tu calendario."
                : "Conecta tu calendario para que las citas aparezcan en Google Calendar (solo ida)."}
            </p>
          </div>
          {calendarConnected ? (
            <button type="button" className="btn btn-ghost" onClick={handleDisconnect} disabled={busy}>
              Desconectar
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
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

      {error && <p className="text-red-600 text-sm mt4">{error}</p>}

      {loading ? (
        <p className="text-muted mt4">Cargando…</p>
      ) : patients.length === 0 ? (
        <div className="card mt16">
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>Primero crea un paciente para poder registrar citas.</p>
            <Link href="/patients" className="btn btn-primary mt4">Ir a pacientes</Link>
          </div>
        </div>
      ) : appts.length === 0 ? (
        <div className="card mt16">
          <div className="empty-state">
            <div className="empty-icon">🗓️</div>
            <p>No hay citas todavía. Pulsa <b>+ Nueva</b> para crear la primera.</p>
          </div>
        </div>
      ) : (
        <div className="mt16 space-y-6">
          {Object.entries(grouped).map(([day, list]) => (
            <div key={day}>
              <p className="font-semibold text-bark mb-2 capitalize">{day}</p>
              <div className="space-y-2">
                {list.map((a) => (
                  <div key={a.id} className="bg-surface rounded-[14px] border-[1.5px] border-line p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-bark">{a.title}</p>
                        <p className="text-sm text-muted mt-0.5">
                          {new Date(a.starts_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          {a.doctor_name ? ` · ${a.doctor_name}` : ""}
                        </p>
                        {a.location && <p className="text-sm text-muted">📍 {a.location}</p>}
                        <p className="text-xs text-muted mt-1">
                          {a.patient_name}
                          {a.google_event_id ? " · en Google Calendar" : ""}
                        </p>
                      </div>
                      {canEditPatient(a.patient_id) && (
                        <div className="flex gap-2 shrink-0">
                          <button type="button" className="btn btn-sm btn-ghost" onClick={() => openEdit(a)}>
                            Editar
                          </button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(a)}>
                            Eliminar
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
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="input-label">Paciente</label>
            <select className="input" value={formPatient} onChange={(e) => setFormPatient(e.target.value)} required>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Título</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej. Revisión cardiología" required />
          </div>
          <div>
            <label className="input-label">Médico</label>
            <input className="input" value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} placeholder="Ej. Dra. López" />
          </div>
          <div>
            <label className="input-label">Lugar</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej. Hospital Clínico" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Inicio</label>
              <input type="datetime-local" className="input" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required />
            </div>
            <div>
              <label className="input-label">Fin</label>
              <input type="datetime-local" className="input" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={busy}>
              {busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear cita"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Eliminar cita">
        <p className="text-muted mb-4">
          ¿Seguro que quieres eliminar &quot;{confirmDelete?.title}&quot;?
          {confirmDelete?.google_event_id ? " También se quitará de Google Calendar." : ""}
        </p>
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
