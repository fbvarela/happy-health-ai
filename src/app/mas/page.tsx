'use client'

import Link from "next/link"
import { ChevronRight, CircleHelp, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react"
import { AppShell, SectionHeading } from "@/components/app-shell"
import { useAuth } from "@/context/AuthContext"

const settings = [
  { label: "Mi perfil", detail: "Datos personales y preferencias", icon: UserRound, href: "/settings" },
  { label: "Configuración", detail: "Notificaciones, privacidad y acceso", icon: Settings, href: "/settings" },
  { label: "Seguridad y permisos", detail: "Gestiona el acceso del equipo", icon: ShieldCheck, href: "/admin/approvals" },
  { label: "Ayuda y soporte", detail: "Respuestas y contacto", icon: CircleHelp, href: "/disclaimer" },
]

export default function MasPage() {
  const { currentUser, logout } = useAuth()
  const initial = (currentUser?.name?.[0] ?? currentUser?.email?.[0] ?? "U").toUpperCase()

  return <AppShell title="Más" eyebrow="Cuenta y preferencias"><section className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/15 text-xl font-bold">{initial}</div><div><p className="text-lg font-semibold">{currentUser?.name ?? currentUser?.email ?? "Usuario"}</p><p className="mt-1 text-sm text-primary-foreground/75">Cuidador responsable</p></div></div><Link href="/settings" className="mt-5 block w-full rounded-xl bg-primary-foreground/10 px-4 py-3 text-sm font-semibold text-primary-foreground text-center">Ver mi perfil</Link></section><div className="mt-7"><SectionHeading title="Preferencias" /><div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">{settings.map(({ label, detail, icon: Icon, href }, index) => <Link key={label} href={href} className={`flex w-full items-center gap-3 p-4 text-left ${index > 0 ? "border-t border-border" : ""}`}><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-semibold">{label}</p><p className="mt-0.5 text-sm text-muted-foreground">{detail}</p></div><ChevronRight className="h-5 w-5 text-muted-foreground" /></Link>)}</div></div><button onClick={() => logout()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-semibold text-critical"><LogOut className="h-4 w-4" />Cerrar sesión</button><p className="mt-6 text-center text-xs text-muted-foreground">Happy Health · Versión 2.4.0</p></AppShell>
}
