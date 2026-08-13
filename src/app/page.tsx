'use client'

import { useState } from 'react'
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronRight,
  CirclePlus,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard-header'
import { PatientSummary } from '@/components/patient-summary'
import { VitalCard } from '@/components/vital-card'
import { BottomNav } from '@/components/bottom-nav'

const vitals = [
  { label: 'Saturación de oxígeno', value: '95', unit: '%', detail: 'SpO₂ · Hoy 08:40', status: 'normal' as const, icon: Activity },
  { label: 'Frecuencia cardíaca', value: '72', unit: 'ppm', detail: 'FC · Hoy 08:40', status: 'normal' as const, icon: Activity },
  { label: 'Tensión arterial', value: '120/80', unit: 'mmHg', detail: 'TA · Hoy 08:40', status: 'normal' as const, icon: Activity },
  { label: 'Temperatura', value: '36.5', unit: '°C', detail: 'Temp. · Hoy 08:40', status: 'normal' as const, icon: Activity },
]

export default function Page() {
  const [active, setActive] = useState('Inicio')
  const [showMenu, setShowMenu] = useState(false)

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background shadow-[0_0_32px_rgba(30,50,80,0.08)]">
        <DashboardHeader onMenu={() => setShowMenu(true)} />

        <div className="flex-1 overflow-y-auto px-4 pb-28 pt-5">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Resumen del turno</p>
              <h1 className="text-2xl font-semibold tracking-tight">Buenos días, Laura</h1>
              <p className="mt-1 text-sm text-muted-foreground">Última actualización hace 4 min</p>
            </div>
            <button type="button" className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors active:bg-accent" aria-label="Filtrar resumen">
              <SlidersHorizontal className="size-5" />
            </button>
          </div>

          <PatientSummary name="Suso Martínez" room="Habitación 204 · Seguimiento activo" initial="S" />

          <section className="mt-6" aria-labelledby="vitals-heading">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 id="vitals-heading" className="text-base font-semibold">Constantes vitales</h2>
                <p className="text-xs text-muted-foreground">Valores registrados hoy</p>
              </div>
              <button type="button" className="flex min-h-11 items-center gap-1 text-sm font-semibold text-primary" aria-label="Ver historial de constantes">
                Historial <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {vitals.map((vital) => <VitalCard key={vital.label} {...vital} footer={vital.detail} />)}
            </div>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-3" aria-label="Actividad del paciente">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-xl bg-accent text-primary"><FileText className="size-5" /></span><span className="text-xs font-medium text-success">Estable</span></div>
              <p className="font-mono text-2xl font-semibold tracking-tight">2 <span className="font-sans text-sm font-medium text-muted-foreground">hoy</span></p>
              <p className="mt-1 text-xs text-muted-foreground">Deposiciones</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><ShieldAlert className="size-5" /></span><span className="text-xs font-medium text-success">Sin alertas</span></div>
              <p className="font-mono text-2xl font-semibold tracking-tight">0</p>
              <p className="mt-1 text-xs text-muted-foreground">Incidentes</p>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-primary p-4 text-primary-foreground shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-semibold">Próxima cita</p><p className="mt-1 text-xs text-primary-foreground/75">Revisión de seguimiento</p></div>
              <CalendarDays className="size-5 opacity-80" />
            </div>
            <div className="mt-5 flex items-end justify-between"><p className="font-mono text-2xl font-semibold">Hoy, 16:30</p><button type="button" className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold hover:bg-primary-foreground/10 active:bg-primary-foreground/15">Ver cita <ChevronRight className="size-4" /></button></div>
          </section>
        </div>

        <button type="button" className="fixed bottom-24 right-5 z-20 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95" aria-label="Abrir mensajes"><MessageSquare className="size-6" /></button>
        <BottomNav active={active} onChange={setActive} />
      </div>

      {showMenu && <div className="fixed inset-0 z-50 bg-foreground/30" role="presentation" onClick={() => setShowMenu(false)}>
        <aside className="absolute right-0 top-0 flex h-full w-[min(88%,360px)] flex-col bg-card p-5 shadow-2xl" role="dialog" aria-label="Menú principal" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between"><p className="text-lg font-semibold">Menú</p><button type="button" className="flex size-11 items-center justify-center rounded-xl text-muted-foreground active:bg-accent" onClick={() => setShowMenu(false)} aria-label="Cerrar menú"><X className="size-5" /></button></div>
          <div className="mt-6 flex flex-col gap-2">
            {[['Pacientes', Users], ['Citas', CalendarDays], ['Incidentes', ShieldAlert], ['Configuración', SlidersHorizontal]].map(([label, Icon]) => <button type="button" key={label as string} className="flex min-h-14 items-center gap-3 rounded-xl px-3 text-left font-medium transition-colors active:bg-accent"><Icon className="size-5 text-primary" /><span>{label as string}</span><ChevronRight className="ml-auto size-4 text-muted-foreground" /></button>)}
          </div>
        </aside>
      </div>}
    </main>
  )
}
