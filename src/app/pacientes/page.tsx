"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { AppShell, SectionHeading, EmptyState } from "@/components/app-shell"
import api from "@/utils/api"

interface PatientRow {
  id: string
  name: string
  dob: string | null
  gender: string | null
  allergies: string | null
  medications: string | null
  role: string
}

function ageLabel(dob: string | null) {
  if (!dob) return "Edad no indicada"
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return age >= 0 ? `${age} años` : "Edad no indicada"
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")
}

export default function PacientesPage() {
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let cancelled = false
    api
      .getPatients()
      .then((rows: PatientRow[]) => { if (!cancelled) setPatients(rows ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = patients.filter((p) =>
    query.trim() === "" || p.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  return <AppShell title="Pacientes" eyebrow="Seguimiento clínico" showBack action={<Link href="/patients" className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-primary" aria-label="Añadir paciente"><Plus className="h-5 w-5" /></Link>}>
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3"><Search className="h-5 w-5 text-muted-foreground" /><input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Buscar paciente" aria-label="Buscar paciente" value={query} onChange={(e) => setQuery(e.target.value)} /></div>

    <div className="mt-6 flex items-center justify-between"><SectionHeading title="Todos los pacientes" /><span className="text-sm text-muted-foreground">{patients.length} {patients.length === 1 ? "activo" : "activos"}</span></div>

    <div className="mt-3 space-y-3">
      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        patients.length === 0
          ? <div className="mt-2"><EmptyState title="Aún no hay pacientes" detail="Crea el primer perfil para empezar a registrar constantes, notas y citas." /></div>
          : <div className="mt-2"><EmptyState title="Sin resultados" detail={`Nada coincide con "${query}".`} /></div>
      ) : (
        filtered.map((p) => (
          <Link key={p.id} href={`/patients/${p.id}`} className="block rounded-2xl border border-border bg-card p-4 shadow-sm">
            <article><div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold text-primary">{initials(p.name)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div><h3 className="font-semibold">{p.name}</h3><p className="mt-0.5 text-sm text-muted-foreground">{ageLabel(p.dob)}</p></div>
                  <span className="text-xs text-muted-foreground">{p.role === "owner" ? "Propietario" : p.role === "caregiver" ? "Cuidador" : "Lector"}</span>
                </div>
                {(p.allergies || p.medications) && <p className="mt-3 truncate text-xs text-muted-foreground">{p.allergies ? `Alergias: ${p.allergies}` : ""}{p.allergies && p.medications ? " · " : ""}{p.medications ? `Medicación: ${p.medications}` : ""}</p>}
              </div>
            </div></article>
          </Link>
        ))
      )}
    </div>
  </AppShell>
}
