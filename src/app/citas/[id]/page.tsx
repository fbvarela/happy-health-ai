"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CalendarDays, Clock3, MapPin, Pencil, Plus, Save, Trash2, UserRound, X } from "lucide-react"
import { AppShell, StatusPill } from "@/components/app-shell"
import api from "@/utils/api"

interface Appointment {
  id: string
  title: string
  doctor_name: string | null
  location: string | null
  starts_at: string
  ends_at: string | null
  patient_id: string
  patient_name: string
  google_event_id: string | null
}

export default function CitaDetailPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const patientId = searchParams.get("patient") ?? ""

  const [appt, setAppt] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: "", doctor_name: "", location: "", starts_at: "" })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const toLocalInput = (iso: string) => {
    const d = new Date(iso)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const load = useCallback(async () => {
    if (!patientId || !params.id) return
    try {
      const a = await api.getAppointment(patientId, params.id)
      setAppt(a)
      setForm({ title: a.title, doctor_name: a.doctor_name ?? "", location: a.location ?? "", starts_at: toLocalInput(a.starts_at) })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [patientId, params.id])

  useEffect(() => {
    if (!patientId || !params.id) return
    let cancelled = false
    api
      .getAppointment(patientId, params.id)
      .then((a) => {
        if (cancelled) return
        setAppt(a)
        setForm({ title: a.title, doctor_name: a.doctor_name ?? "", location: a.location ?? "", starts_at: toLocalInput(a.starts_at) })
      })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [patientId, params.id])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      await api.updateAppointment(patientId, params.id, form)
      setEditing(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await api.deleteAppointment(patientId, params.id)
      router.push("/citas")
    } catch (err) {
      setError(err.message)
      setConfirmDelete(false)
    }
  }

  const dateLabel = appt ? new Date(appt.starts_at).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""
  const timeLabel = appt ? new Date(appt.starts_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""

  return <AppShell title="Cita" eyebrow="Detalle" showBack>
    {loading ? (
      <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p>
    ) : error && !appt ? (
      <p className="py-10 text-center text-sm text-red-600">{error}</p>
    ) : appt ? (
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Header card */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{appt.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground capitalize">{dateLabel}</p>
              {appt.google_event_id && <div className="mt-2"><StatusPill tone="success">En Google Calendar</StatusPill></div>}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 rounded-xl bg-muted p-3"><Clock3 className="h-5 w-5 text-primary" /><span className="text-sm font-medium">{timeLabel}</span></div>
            {appt.doctor_name && <div className="flex items-center gap-3 rounded-xl bg-muted p-3"><UserRound className="h-5 w-5 text-primary" /><span className="text-sm font-medium">{appt.doctor_name}</span></div>}
            {appt.location && <div className="flex items-center gap-3 rounded-xl bg-muted p-3"><MapPin className="h-5 w-5 text-primary" /><span className="text-sm font-medium">{appt.location}</span></div>}
            <div className="flex items-center gap-3 rounded-xl bg-muted p-3"><UserRound className="h-5 w-5 text-primary" /><span className="text-sm font-medium">{appt.patient_name}</span></div>
          </div>
        </section>

        {/* Actions */}
        {!editing && (
          <div className="flex gap-3">
            <button type="button" onClick={() => setEditing(true)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Pencil className="h-4 w-4" />Editar</button>
            <button type="button" onClick={() => setConfirmDelete(true)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-destructive"><Trash2 className="h-4 w-4" />Eliminar</button>
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <form onSubmit={save} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold">Editar cita</h3>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Título</label><input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Médico</label><input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Lugar</label><input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Inicio</label><input type="datetime-local" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required /></div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Guardando…" : "Guardar"}</button>
              <button type="button" onClick={() => setEditing(false)} className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium"><X className="h-4 w-4" /></button>
            </div>
          </form>
        )}
      </div>
    ) : null}

    {confirmDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-5" role="presentation" onClick={() => setConfirmDelete(false)}>
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold">Eliminar cita</h3>
          <p className="mt-2 text-sm text-muted-foreground">¿Seguro que quieres eliminar esta cita?{appt?.google_event_id ? " También se quitará de Google Calendar." : ""}</p>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={remove} className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground"><Trash2 className="h-4 w-4" />Eliminar</button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium">Cancelar</button>
          </div>
        </div>
      </div>
    )}

    <div className="mt-6 flex justify-center"><Link href="/appointments" className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-muted-foreground"><CalendarDays className="h-4 w-4" />Ver todas las citas</Link></div>
  </AppShell>
}
