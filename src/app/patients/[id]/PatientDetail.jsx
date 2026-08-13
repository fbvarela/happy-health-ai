"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Mail, Pencil, Send, Trash2, UserPlus } from "lucide-react";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";
import PatientForm from "@/components/PatientForm";
import QuickRecord from "@/components/vitals/QuickRecord";
import DayTimeline from "@/components/vitals/DayTimeline";
import NotesSection from "@/components/vitals/NotesSection";
import GallerySection from "@/components/uploads/GallerySection";
import { useApp } from "@/context/AppContext";

const ROLE_LABELS = { owner: "Propietario", caregiver: "Cuidador", viewer: "Lector" };
const ROLE_OPTIONS = [
  { value: "caregiver", label: "Cuidador (edita)" },
  { value: "viewer", label: "Lector (solo ver)" },
];

export default function PatientDetail({ patient, avatarUrl, myRole, myName, members, invites }) {
  const router = useRouter();
  const { setActivePatientId } = useApp();
  const isOwner = myRole === "owner";
  const canEdit = ["owner", "caregiver"].includes(myRole);

  useEffect(() => {
    setActivePatientId(patient.id);
  }, [patient.id, setActivePatientId]);

  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("caregiver");
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteErr, setInviteErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localInvites, setLocalInvites] = useState(invites);
  const [localMembers, setLocalMembers] = useState(members);
  const [refresh, setRefresh] = useState(0);
  const [memberErr, setMemberErr] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [caregivers, setCaregivers] = useState([]);
  const [pickUserId, setPickUserId] = useState("");
  const [pickRole, setPickRole] = useState("caregiver");

  const openAdd = async () => {
    setAddOpen(true);
    setPickUserId("");
    setPickRole("caregiver");
    setMemberErr("");
    try {
      const rows = await api.getCaregivers(patient.id);
      setCaregivers(rows ?? []);
    } catch (err) {
      setMemberErr(err.message);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!pickUserId) return;
    setMemberErr("");
    try {
      await api.addMember(patient.id, { userId: pickUserId, role: pickRole });
      const added = caregivers.find((c) => c.id === pickUserId);
      setLocalMembers((prev) => [...prev, { id: pickUserId, role: pickRole, name: added?.name ?? added?.email ?? "", email: added?.email ?? "" }]);
      setAddOpen(false);
    } catch (err) {
      setMemberErr(err.message);
    }
  };

  const handleRoleChange = async (userId, role) => {
    setMemberErr("");
    try {
      await api.updateMemberRole(patient.id, userId, role);
      setLocalMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role } : m)));
    } catch (err) {
      setMemberErr(err.message);
    }
  };

  const handleRemoveMember = async (userId, name) => {
    setMemberErr("");
    try {
      await api.removeMember(patient.id, userId);
      setLocalMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch (err) {
      setMemberErr(err.message);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setBusy(true);
    setInviteErr("");
    setInviteMsg("");
    try {
      const res = await api.invitePatient(patient.id, { email: inviteEmail, role: inviteRole });
      if (res.direct) {
        setInviteMsg(`${res.email} ya está en la aplicación — añadido como miembro.`);
      } else {
        setInviteMsg(`Invitación enviada a ${res.email}. Se unirá cuando acepte.`);
      }
      setLocalInvites((prev) => [...prev, { email: inviteEmail, role: inviteRole, status: "pending" }]);
      setInviteEmail("");
      router.refresh();
    } catch (err) {
      setInviteErr(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await api.deletePatient(patient.id);
      router.push("/patients");
    } catch (err) {
      setInviteErr(err.message);
      setConfirmDelete(false);
    }
  };

  const dobLabel = patient.dob
    ? new Date(patient.dob).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="page">
      <Link href="/patients" className="text-sm text-muted hover:text-bark inline-block mb-3">
        ← Pacientes
      </Link>

      <div className="flex flex-row items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={patient.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-line shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[var(--sun)] flex items-center justify-center text-white font-serif text-3xl shrink-0">
            {(patient.name ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-[2.2rem] font-semibold text-bark leading-none break-words">
            {patient.name}
          </h1>
          <p className="text-muted mt-2">
            {dobLabel ? (
              <>
                <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> Nacido/a el {dobLabel}</span>
              </>
            ) : (
              "Fecha de nacimiento no indicada"
            )}
            {myName && <span className="ml-2">· {myName}</span>}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            className="btn btn-sm btn-ghost ml-auto shrink-0"
            onClick={() => setEditOpen(true)}
            aria-label="Editar paciente"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {/* Pinned info (SPEC §4.2) — always visible */}
      <div className="stats-row-grid" style={{ "--stats-cols": 2 }}>
        <div className="card">
          <div className="card-title">Alergias</div>
          <p className="dog-meta">{patient.allergies || "Sin alergias registradas"}</p>
        </div>
        <div className="card">
          <div className="card-title">Medicación actual</div>
          <p className="dog-meta">{patient.medications || "Sin medicación registrada"}</p>
        </div>
      </div>

      {/* Latest vitals — populated in Phase 3 */}
      <div className="mt16 space-y-4">
        <QuickRecord patientId={patient.id} canEdit={canEdit} onSaved={() => setRefresh((r) => r + 1)} />
        <DayTimeline key={refresh} patientId={patient.id} canEdit={canEdit} />
      </div>

      <Link
        href={`/patients/${patient.id}/incidents`}
        className="block card mt16 hover:border-sun transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="card-title">Incidentes</div>
            <p className="dog-meta">Heridas, caídas y otros con fotos.</p>
          </div>
          <span className="text-2xl">›</span>
        </div>
      </Link>

      <Link
        href="/appointments"
        className="block card mt16 hover:border-sun transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="card-title">Citas</div>
            <p className="dog-meta">Consultas médicas y calendario.</p>
          </div>
          <span className="text-2xl">›</span>
        </div>
      </Link>

      {/* Members */}
      <div className="card mt16">
        <div className="flex items-center justify-between">
          <div className="card-title">Quién cuida</div>
          {isOwner && (
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-sm btn-ghost" onClick={openAdd}>
                <UserPlus size={16} className="mr-1" /> Añadir cuidador
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => setInviteOpen(true)}>
                <Mail size={16} className="mr-1" /> Invitar por email
              </button>
            </div>
          )}
        </div>
        <ul className="mt4 space-y-2">
          {localMembers.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 border-b border-line last:border-0 gap-3">
              <div className="min-w-0">
                <p className="font-medium text-bark truncate">{m.name || m.email}</p>
                {m.name && <p className="text-xs text-muted truncate">{m.email}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isOwner && m.role === "owner" ? (
                  <span className="badge badge-sun">{m.name || m.email}</span>
                ) : isOwner ? (
                  <>
                    <select
                      className="input !py-1 !px-2 text-sm max-w-[130px]"
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      aria-label={`Rol de ${m.name || m.email}`}
                    >
                      <option value="caregiver">Cuidador</option>
                      <option value="viewer">Lector</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleRemoveMember(m.id, m.name || m.email)}
                    >
                      Quitar
                    </button>
                  </>
                ) : (
                  <span className="badge badge-sun">{ROLE_LABELS[m.role] ?? m.role}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {memberErr && <p className="text-red-600 text-sm mt2">{memberErr}</p>}

        {isOwner && localInvites.length > 0 && (
          <div className="mt4 pt-4 border-t border-line">
            <p className="text-xs text-muted mb-2">Invitaciones pendientes</p>
            <ul className="space-y-1">
              {localInvites.map((inv, i) => (
                <li key={i} className="text-sm text-muted">
                  {inv.email} — {ROLE_LABELS[inv.role] ?? inv.role}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt16">
        <GallerySection patientId={patient.id} canEdit={canEdit} />
      </div>

      <div className="mt16">
        <NotesSection patientId={patient.id} canEdit={canEdit} />
      </div>

      {isOwner && (
        <div className="mt16">
          {confirmDelete ? (
            <div className="bg-surface rounded-[14px] border-[1.5px] border-red-300 p-5">
              <p className="font-semibold text-bark mb-3">
                ¿Seguro que quieres eliminar a {patient.name}? Se borrarán todos sus datos.
              </p>
              <div className="flex gap-3">
                <button type="button" className="btn btn-danger flex-1 justify-center" onClick={handleDelete}>
                  Sí, eliminar
                </button>
                <button type="button" className="btn btn-ghost flex-1 justify-center" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={16} className="mr-1" /> Eliminar paciente
            </button>
          )}
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar paciente">
        <PatientForm
          patient={patient}
          onCancel={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            router.refresh();
          }}
        />
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Añadir cuidador">
        <form onSubmit={handleAddMember} className="space-y-4">
          {memberErr && <p className="text-red-600 text-sm">{memberErr}</p>}
          <div>
            <label className="input-label">Cuidador</label>
            {caregivers.length === 0 ? (
              <p className="text-sm text-muted">No hay más usuarios aprobados para añadir.</p>
            ) : (
              <select className="input" value={pickUserId} onChange={(e) => setPickUserId(e.target.value)} required>
                <option value="">— Selecciona —</option>
                {caregivers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name || c.email}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="input-label">Rol</label>
            <select className="input" value={pickRole} onChange={(e) => setPickRole(e.target.value)}>
              <option value="caregiver">Cuidador (edita)</option>
              <option value="viewer">Lector (solo ver)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={!pickUserId}>
              <UserPlus size={18} className="mr-1" /> Añadir
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setAddOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invitar a cuidar">
        <form onSubmit={handleInvite} className="space-y-4">
          {inviteErr && <p className="text-red-600 text-sm">{inviteErr}</p>}
          {inviteMsg && <p className="text-green-700 text-sm">{inviteMsg}</p>}
          <div>
            <label className="input-label">Email del cuidador</label>
            <input
              type="email"
              className="input"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="cuidador@ejemplo.com"
              required
            />
          </div>
          <div>
            <label className="input-label">Rol</label>
            <select className="input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={busy}>
              <Send size={18} className="mr-1" /> {busy ? "Enviando…" : "Enviar invitación"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setInviteOpen(false)}>
              Cerrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
