"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Mail, Pencil, Send, Trash2, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
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
    <AppShell title={patient.name} eyebrow="Paciente" showBack>
      <div className="flex flex-row items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={patient.name}
            className="h-20 w-20 shrink-0 rounded-full border-2 border-border object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-3xl text-primary-foreground">
            {(patient.name ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-[2.2rem] font-semibold leading-none text-foreground break-words">
            {patient.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
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
            className="ml-auto flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
            onClick={() => setEditOpen(true)}
            aria-label="Editar paciente"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {/* Pinned info (SPEC §4.2) — always visible */}
      <div className="stats-row-grid" style={{ "--stats-cols": 2 }}>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-base font-semibold">Alergias</div>
          <p className="text-sm text-muted-foreground">{patient.allergies || "Sin alergias registradas"}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-base font-semibold">Medicación actual</div>
          <p className="text-sm text-muted-foreground">{patient.medications || "Sin medicación registrada"}</p>
        </div>
      </div>

      {/* Latest vitals — populated in Phase 3 */}
      <div className="mt16 space-y-4">
        <QuickRecord patientId={patient.id} canEdit={canEdit} onSaved={() => setRefresh((r) => r + 1)} />
        <DayTimeline key={refresh} patientId={patient.id} canEdit={canEdit} />
      </div>

      <Link
        href={`/patients/${patient.id}/incidents`}
        className="mt16 block rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
      >
        <div className="flex flex-row items-center justify-between">
          <div>
            <div className="text-base font-semibold">Incidentes</div>
            <p className="text-sm text-muted-foreground">Heridas, caídas y otros con fotos.</p>
          </div>
          <span className="text-2xl">›</span>
        </div>
      </Link>

      <Link
        href="/appointments"
        className="mt16 block rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
      >
        <div className="flex flex-row items-center justify-between">
          <div>
            <div className="text-base font-semibold">Citas</div>
            <p className="text-sm text-muted-foreground">Consultas médicas y calendario.</p>
          </div>
          <span className="text-2xl">›</span>
        </div>
      </Link>

      {/* Members */}
      <div className="mt16 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-row items-center justify-between">
          <div className="text-base font-semibold">Quién cuida</div>
          {isOwner && (
            <div className="flex flex-row items-center gap-2">
              <button type="button" className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted" onClick={openAdd} aria-label="Añadir cuidador">
                <UserPlus size={18} />
              </button>
              <button type="button" className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground" onClick={() => setInviteOpen(true)} aria-label="Invitar por email">
                <Mail size={18} />
              </button>
            </div>
          )}
        </div>
        <ul className="mt4 space-y-2">
          {localMembers.map((m) => (
            <li key={m.id} className="flex flex-row items-center justify-between gap-3 border-b border-border py-2 last:border-0">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{m.name || m.email}</p>
                {m.name && <p className="truncate text-xs text-muted-foreground">{m.email}</p>}
              </div>
              <div className="flex flex-row items-center gap-2 shrink-0">
                {isOwner && m.role === "owner" ? (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{m.name || m.email}</span>
                ) : isOwner ? (
                  <>
                    <select
                      className="h-9 max-w-[130px] rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring"
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      aria-label={`Rol de ${m.name || m.email}`}
                    >
                      <option value="caregiver">Cuidador</option>
                      <option value="viewer">Lector</option>
                    </select>
                    <button
                      type="button"
                      className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-destructive hover:bg-muted"
                      onClick={() => handleRemoveMember(m.id, m.name || m.email)}
                    >
                      Quitar
                    </button>
                  </>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{ROLE_LABELS[m.role] ?? m.role}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {memberErr && <p className="mt2 text-sm text-destructive">{memberErr}</p>}

        {isOwner && localInvites.length > 0 && (
          <div className="mt4 border-t border-border pt-4">
            <p className="mb-2 text-xs text-muted-foreground">Invitaciones pendientes</p>
            <ul className="space-y-1">
              {localInvites.map((inv, i) => (
                <li key={i} className="text-sm text-muted-foreground">
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
            <div className="rounded-2xl border border-destructive/30 bg-card p-5">
              <p className="mb-3 font-semibold text-foreground">
                ¿Seguro que quieres eliminar a {patient.name}? Se borrarán todos sus datos.
              </p>
              <div className="flex gap-3">
                <button type="button" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 text-sm font-semibold text-destructive" onClick={handleDelete}>
                  Sí, eliminar
                </button>
                <button type="button" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 text-sm font-semibold text-destructive" onClick={handleDelete}>
              <Trash2 size={16} /> Eliminar paciente
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
          {memberErr && <p className="text-sm text-destructive">{memberErr}</p>}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Cuidador</label>
            {caregivers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay más usuarios aprobados para añadir.</p>
            ) : (
              <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={pickUserId} onChange={(e) => setPickUserId(e.target.value)} required>
                <option value="">— Selecciona —</option>
                {caregivers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name || c.email}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Rol</label>
            <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={pickRole} onChange={(e) => setPickRole(e.target.value)}>
              <option value="caregiver">Cuidador (edita)</option>
              <option value="viewer">Lector (solo ver)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={!pickUserId} aria-label="Añadir cuidador">
              <UserPlus size={18} />
            </button>
            <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setAddOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invitar a cuidar">
        <form onSubmit={handleInvite} className="space-y-4">
          {inviteErr && <p className="text-sm text-destructive">{inviteErr}</p>}
          {inviteMsg && <p className="text-sm text-success">{inviteMsg}</p>}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Email del cuidador</label>
            <input
              type="email"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="cuidador@ejemplo.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Rol</label>
            <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={busy}>
              <Send size={18} /> {busy ? "Enviando…" : "Enviar invitación"}
            </button>
            <button type="button" className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setInviteOpen(false)}>
              Cerrar
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
