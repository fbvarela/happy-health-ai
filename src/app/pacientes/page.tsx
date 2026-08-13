import { Plus, Search, SlidersHorizontal } from "lucide-react"
import { AppShell, SectionHeading, StatusPill } from "@/components/app-shell"

const patients = [
  { name: "Suso García", initials: "SG", age: "72 años", room: "Habitación 204", status: "Atención requerida", tone: "critical" as const, last: "Actualizado hace 4 min" },
  { name: "María López", initials: "ML", age: "68 años", room: "Habitación 108", status: "Estable", tone: "success" as const, last: "Actualizado hace 12 min" },
  { name: "Carlos Martín", initials: "CM", age: "81 años", room: "Habitación 312", status: "En observación", tone: "warning" as const, last: "Actualizado hace 26 min" },
  { name: "Ana Torres", initials: "AT", age: "65 años", room: "Habitación 117", status: "Estable", tone: "success" as const, last: "Actualizado hace 31 min" },
]

export default function PacientesPage() {
  return <AppShell title="Pacientes" eyebrow="Seguimiento clínico" action={<button className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-primary" aria-label="Añadir paciente"><Plus className="h-5 w-5" /></button>}>
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3"><Search className="h-5 w-5 text-muted-foreground" /><input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Buscar paciente" aria-label="Buscar paciente" /><button className="text-muted-foreground" aria-label="Filtrar pacientes"><SlidersHorizontal className="h-5 w-5" /></button></div>
    <div className="mt-6 flex items-center justify-between"><SectionHeading title="Todos los pacientes" /><span className="text-sm text-muted-foreground">24 activos</span></div>
    <div className="mt-3 space-y-3">{patients.map((patient) => <article key={patient.name} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold text-primary">{patient.initials}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{patient.name}</h3><p className="mt-0.5 text-sm text-muted-foreground">{patient.age} · {patient.room}</p></div><StatusPill tone={patient.tone}>{patient.status}</StatusPill></div><p className="mt-3 text-xs text-muted-foreground">{patient.last}</p></div></div></article>)}</div>
  </AppShell>
}
