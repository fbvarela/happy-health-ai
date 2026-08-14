import Link from "next/link"
import { CalendarDays, ChevronRight, Clock3, MapPin, Plus } from "lucide-react"
import { AppShell, SectionHeading, StatusPill } from "@/components/app-shell"

const appointments = [
  { day: "HOY", date: "13", weekday: "Miércoles", title: "Revisión de enfermería", patient: "Suso García", time: "10:30 – 11:00", place: "Habitación 204", tone: "warning" as const },
  { day: "MAÑANA", date: "14", weekday: "Jueves", title: "Consulta de cardiología", patient: "María López", time: "09:00 – 09:30", place: "Consultorio 2", tone: "neutral" as const },
  { day: "VIERNES", date: "15", weekday: "Viernes", title: "Control de seguimiento", patient: "Carlos Martín", time: "12:15 – 12:45", place: "Habitación 312", tone: "neutral" as const },
]

export default function CitasPage() {
  return <AppShell title="Citas" eyebrow="Agenda del equipo" action={<Link href="/appointments" className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-label="Crear cita"><Plus className="h-5 w-5" /></Link>}>
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm"><div><p className="text-sm font-semibold">Marzo 2026</p><p className="mt-1 text-sm text-muted-foreground">8 citas programadas</p></div><Link href="/appointments" className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary" aria-label="Abrir calendario"><CalendarDays className="h-5 w-5" /></Link></div>
    <div className="mt-7 flex items-center justify-between"><SectionHeading title="Próximas citas" /><Link href="/appointments" className="text-sm font-semibold text-primary">Ver calendario</Link></div>
    <div className="mt-3 space-y-3">{appointments.map((appointment) => <Link key={appointment.title} href="/appointments" className="block rounded-2xl border border-border bg-card p-4 shadow-sm"><article><div className="flex gap-4"><div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-accent py-2 text-primary"><span className="text-[10px] font-bold tracking-wide">{appointment.day}</span><span className="mt-1 text-2xl font-bold leading-7">{appointment.date}</span><span className="text-[10px] font-medium">{appointment.weekday}</span></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{appointment.title}</h3><p className="mt-1 text-sm text-muted-foreground">{appointment.patient}</p></div><ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" /></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{appointment.time}</span><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{appointment.place}</span></div>{appointment.tone === "warning" && <div className="mt-3"><StatusPill tone="warning">Próxima</StatusPill></div>}</div></div></article></Link>)}</div>
  </AppShell>
}
