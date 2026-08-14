import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Check, ChevronRight, Clock3 } from "lucide-react";
import { AppShell, SectionHeading, StatusPill, EmptyState } from "@/components/app-shell";

export const dynamic = "force-dynamic";

const SEVERITY_META = {
  green: { tone: "success", label: "Resuelto", icon: Check },
  orange: { tone: "warning", label: "En revisión", icon: AlertTriangle },
  red: { tone: "critical", label: "Pendiente", icon: AlertTriangle },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Ayer" : `Hace ${d} días`;
}

export default async function IncidentesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const incidents = await sql`
    SELECT i.id, i.title, i.notes, i.severity, i.active, i.created_at,
           p.id AS patient_id, p.name AS patient_name
    FROM incidents i
    JOIN patients p ON p.id = i.patient_id
    JOIN patient_members pm ON pm.patient_id = p.id
    WHERE pm.user_id = ${user.id} AND i.deleted_at IS NULL
    ORDER BY i.active DESC, i.created_at DESC
    LIMIT 50
  `;

  const activeCount = incidents.filter((i) => i.active).length;
  const worst = activeCount > 0
    ? incidents
        .filter((i) => i.active)
        .sort((a, b) => ({ red: 3, orange: 2, green: 1 }[b.severity] ?? 0) - ({ red: 3, orange: 2, green: 1 }[a.severity] ?? 0))[0]
    : null;

  return (
    <AppShell
      title="Incidentes"
      eyebrow="Centro de alertas"
      showBack
      action={<Link href="/incidents" className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground" aria-label="Filtrar alertas"><Clock3 className="h-5 w-5" /></Link>}
    >
      {activeCount > 0 ? (
        <section className="rounded-2xl border border-critical/20 bg-critical/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-critical/10 text-critical"><AlertTriangle className="h-5 w-5" /></div>
            <div><p className="text-sm font-semibold text-critical">{activeCount} {activeCount === 1 ? "alerta" : "alertas"} requieren atención</p><p className="mt-0.5 text-sm text-muted-foreground">Revisa el estado de tus pacientes.</p></div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-success/20 bg-success/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success"><Check className="h-5 w-5" /></div>
            <div><p className="text-sm font-semibold text-success">Sin alertas activas</p><p className="mt-0.5 text-sm text-muted-foreground">Todo en orden hoy.</p></div>
          </div>
        </section>
      )}

      <div className="mt-7 flex items-center justify-between"><SectionHeading title="Actividad reciente" /><span className="text-sm text-muted-foreground">{incidents.length} {incidents.length === 1 ? "registro" : "registros"}</span></div>

      <div className="mt-3 space-y-3">
        {incidents.length === 0 ? (
          <div className="mt-2"><EmptyState title="No hay incidentes" detail="Los incidentes registrados de tus pacientes aparecerán aquí." /></div>
        ) : (
          incidents.map((incident) => {
            const meta = SEVERITY_META[incident.severity] ?? SEVERITY_META.green;
            const Icon = meta.icon;
            return (
              <Link key={incident.id} href={`/patients/${incident.patient_id}/incidents?open=${incident.id}`} className="block rounded-2xl border border-border bg-card p-4 shadow-sm">
                <article><div className="flex gap-3">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${incident.severity === "red" ? "bg-critical/10 text-critical" : incident.severity === "orange" ? "bg-warning/15 text-warning-foreground" : "bg-success/10 text-success"}`}>{<Icon className="h-5 w-5" />}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div><h3 className="font-semibold leading-5">{incident.title}</h3><p className="mt-1 text-sm text-muted-foreground">{incident.patient_name}</p></div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{timeAgo(incident.created_at)}</span>
                      <StatusPill tone={meta.tone}>{incident.active ? meta.label : "Resuelto"}</StatusPill>
                    </div>
                  </div>
                </div></article>
              </Link>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
