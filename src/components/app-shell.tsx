"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, Bell, CalendarDays, ChevronRight, Home, Menu, MoreHorizontal, ShieldAlert, Users, X } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"

const navItems = [
  { key: "inicio", label: "Inicio", href: "/", icon: Home },
  { key: "pacientes", label: "Pacientes", href: "/pacientes", icon: Users },
  { key: "incidentes", label: "Incidentes", href: "/incidentes", icon: ShieldAlert },
  { key: "citas", label: "Citas", href: "/citas", icon: CalendarDays },
  { key: "mas", label: "Más", href: "/mas", icon: MoreHorizontal },
]

export function AppShell({ children, title, eyebrow, action, showBack = false }: { children: ReactNode; title: string; eyebrow?: string; action?: ReactNode; showBack?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const activeKey = pathname === "/" ? "inicio" : pathname.split("/")[1]

  useEffect(() => {
    let cancelled = false
    fetch("/api/notifications/unread-count", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled) setUnread(Number(data?.count) || 0) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [pathname])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-xl items-center gap-3 px-6">
          {showBack && (
            <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>}
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {action}
            <Link href="/notifications" className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground" aria-label="Notificaciones">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-critical-foreground">{unread}</span>}
            </Link>
            <button type="button" onClick={() => setMenuOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/30" role="presentation" onClick={() => setMenuOpen(false)}>
          <aside className="absolute right-0 top-0 flex h-full w-[min(88%,360px)] flex-col bg-card p-5 shadow-2xl" role="dialog" aria-label="Menú principal" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between"><p className="text-lg font-semibold">Menú</p><button type="button" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground active:bg-accent"><X className="h-5 w-5" /></button></div>
            <div className="mt-6 flex flex-col gap-2">
              {navItems.map(({ key, label, href, icon: Icon }) => (
                <Link key={key} href={href} onClick={() => setMenuOpen(false)} className={`flex min-h-14 items-center gap-3 rounded-xl px-3 text-left font-medium transition-colors active:bg-accent ${activeKey === key ? "bg-accent" : ""}`}>
                  <Icon className="size-5 text-primary" /><span>{label}</span><ChevronRight className="ml-auto size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-xl px-6 pb-28 pt-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur" aria-label="Navegación principal">
        <div className="mx-auto grid max-w-xl grid-cols-5 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
          {navItems.map(({ key, label, href, icon: Icon }) => {
            const active = activeKey === key
            return <Link key={key} href={href} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-colors ${active ? "bg-accent text-primary" : "text-muted-foreground"}`} aria-current={active ? "page" : undefined}>
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          })}
        </div>
      </nav>
    </div>
  )
}

export function SectionHeading({ title, action }: { title: string; action?: string }) {
  return <div className="flex items-center justify-between gap-4"><h2 className="text-base font-semibold tracking-tight">{title}</h2>{action && <button className="flex items-center gap-1 text-sm font-semibold text-primary">{action}<ChevronRight className="h-4 w-4" /></button>}</div>
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "critical" }) {
  const styles = { neutral: "bg-muted text-muted-foreground", success: "bg-success/10 text-success", warning: "bg-warning/15 text-warning-foreground", critical: "bg-critical/10 text-critical" }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center"><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p></div>
}

export { navItems }
