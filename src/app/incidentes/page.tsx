import { AlertTriangle, Check, ChevronRight, Clock3 } from "lucide-react"
import { AppShell, SectionHeading, StatusPill } from "@/components/app-shell"

const incidents = [
  { title: "Saturación de oxígeno baja", patient: "Suso García · Habitación 204", time: "Hace 4 min", tone: "critical" as const, status: "Pendiente" },
  { title: "Toma de medicación retrasada", patient: "Carlos Martín · Habitación 312", time: "Hace 26 min", tone: "warning" as const, status: "En revisión" },
  { title: "Control de tensión completado", patient: "María López · Habitación 108", time: "Ayer, 18:42", tone: "success" as const, status: "Resuelto" },
]

export default function IncidentesPage() {
  return <AppShell title="Incidentes" eyebrow="Centro de alertas" action={<button className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground" aria-label="Filtrar alertas"><Clock3 className="h-5 w-5" /></button>}>
    <section className="rounded-2xl border border-critical/20 bg-critical/5 p-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-critical/10 text-critical"><AlertTriangle className="h-5 w-5" /></div><div><p className="text-sm font-semibold text-critical">1 alerta requiere atención</p><p className="mt-0.5 text-sm text-muted-foreground">Revisa el estado de tus pacientes.</p></div></div></section>
    <div className="mt-7 flex items-center justify-between"><SectionHeading title="Actividad reciente" /><span className="text-sm text-muted-foreground">3 alertas</span></div>
    <div className="mt-3 space-y-3">{incidents.map((incident) => <article key={incident.title} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex gap-3"><div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${incident.tone === "critical" ? "bg-critical/10 text-critical" : incident.tone === "warning" ? "bg-warning/15 text-warning-foreground" : "bg-success/10 text-success"}`}>{incident.tone === "success" ? <Check className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold leading-5">{incident.title}</h3><p className="mt-1 text-sm text-muted-foreground">{incident.patient}</p></div><ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" /></div><div className="mt-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">{incident.time}</span><StatusPill tone={incident.tone}>{incident.status}</StatusPill></div></div></div></article>)}</div>
  </AppShell>
}
