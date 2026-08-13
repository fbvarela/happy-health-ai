import { ChevronRight, CircleHelp, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react"
import { AppShell, SectionHeading } from "@/components/app-shell"

const settings = [
  { label: "Mi perfil", detail: "Datos personales y preferencias", icon: UserRound },
  { label: "Configuración", detail: "Notificaciones, privacidad y acceso", icon: Settings },
  { label: "Seguridad y permisos", detail: "Gestiona el acceso del equipo", icon: ShieldCheck },
  { label: "Ayuda y soporte", detail: "Respuestas y contacto", icon: CircleHelp },
]

export default function MasPage() {
  return <AppShell title="Más" eyebrow="Cuenta y preferencias"><section className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/15 text-xl font-bold">AL</div><div><p className="text-lg font-semibold">Ana López</p><p className="mt-1 text-sm text-primary-foreground/75">Enfermera responsable</p></div></div><button className="mt-5 w-full rounded-xl bg-primary-foreground/10 px-4 py-3 text-sm font-semibold text-primary-foreground">Ver mi perfil</button></section><div className="mt-7"><SectionHeading title="Preferencias" /><div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">{settings.map(({ label, detail, icon: Icon }, index) => <button key={label} className={`flex w-full items-center gap-3 p-4 text-left ${index > 0 ? "border-t border-border" : ""}`}><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-semibold">{label}</p><p className="mt-0.5 text-sm text-muted-foreground">{detail}</p></div><ChevronRight className="h-5 w-5 text-muted-foreground" /></button>)}</div></div><button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-semibold text-critical"><LogOut className="h-4 w-4" />Cerrar sesión</button><p className="mt-6 text-center text-xs text-muted-foreground">Happy Health · Versión 2.4.0</p></AppShell>
}
