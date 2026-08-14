"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarDays, ChevronRight, Clock3, MapPin, Plus } from "lucide-react"
import { AppShell, SectionHeading, StatusPill, EmptyState } from "@/components/app-shell"
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
}

function formatDay(iso: string) {
  const d = new Date(iso)
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const label = sameDay ? "HOY" : d.getDate() === today.getDate() + 1 ? "MAÑANA" : d.toLocaleDateString("es-ES", { weekday: "long" }).toUpperCase()
  return { day: label, date: String(d.getDate()), weekday: days[d.getDay()] }
}

export default function CitasPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .getPatients()
      .then(async (patients: { id: string; name: string }[]) => {
        const all: Appointment[] = []
        for (const p of patients) {
          const rows = await api.getAppointments(p.id)
          for (const a of rows ?? []) all.push({ ...a, patient_name: p.name })
        }
        all.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        if (!cancelled) setAppointments(all)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const next = appointments.find((a) => new Date(a.starts_at) >= new Date())
  const upcoming = appointments.filter((a) => new Date(a.starts_at) >= new Date()).slice(0, 5)

  return <AppShell title="Citas" eyebrow="Agenda del equipo" showBack action={<Link href="/appointments" className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-label="Crear cita"><Plus className="h-5 w-5" /></Link>}>
    {loading ? (
      <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p>
    ) : appointments.length === 0 ? (
      <div className="mt-2"><EmptyState title="No hay citas" detail="Crea una cita para empezar a organizar las consultas." /></div>
    ) : (
      <>
        {next && (
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold">{new Date(next.starts_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</p>
              <p className="mt-1 text-sm text-muted-foreground">{appointments.length} citas</p>
            </div>
            <Link href="/appointments" className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary" aria-label="Abrir calendario"><CalendarDays className="h-5 w-5" /></Link>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between"><SectionHeading title="Próximas citas" /><Link href="/appointments" className="text-sm font-semibold text-primary">Ver todas</Link></div>
        <div className="mt-3 space-y-3">
          {upcoming.map((a) => {
            const fd = formatDay(a.starts_at)
            const time = new Date(a.starts_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
            return (
              <Link key={a.id} href={`/citas/${a.id}?patient=${a.patient_id}`} className="block rounded-2xl border border-border bg-card p-4 shadow-sm">
                <article><div className="flex gap-4">
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-accent py-2 text-primary"><span className="text-[10px] font-bold tracking-wide">{fd.day}</span><span className="mt-1 text-2xl font-bold leading-7">{fd.date}</span><span className="text-[10px] font-medium">{fd.weekday}</span></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{a.title}</h3><p className="mt-1 text-sm text-muted-foreground">{a.patient_name}</p></div><ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" /></div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{time}</span>
                      {a.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.location}</span>}
                    </div>
                  </div>
                </div></article>
              </Link>
            )
          })}
          {upcoming.length === 0 && <div className="mt-2"><EmptyState title="Sin próximas citas" detail="No hay citas programadas para los próximos días." /></div>}
        </div>
      </>
    )}
  </AppShell>
}
