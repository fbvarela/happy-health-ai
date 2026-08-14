import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, EmptyState } from "@/components/app-shell";
import { UserPlus } from "lucide-react";
import InvitesInbox from "@/components/InvitesInbox";
import PatientSwitcher from "@/components/dashboard/PatientSwitcher";
import VitalTiles from "@/components/dashboard/VitalTiles";
import DashboardLinks from "@/components/dashboard/DashboardLinks";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import { getSignedFileUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { patient: patientParam } = await searchParams;

  const patients = await sql`
    SELECT p.id, p.name, p.dob, p.allergies, p.medications, p.avatar_key, pm.role
    FROM patients p
    JOIN patient_members pm ON pm.patient_id = p.id
    WHERE pm.user_id = ${user.id}
    ORDER BY p.created_at DESC
  `;

  const active = patients.find((p) => p.id === patientParam) ?? patients[0] ?? null;

  // Sign the active patient's avatar
  let avatarUrl = null;
  if (active?.avatar_key) {
    try {
      avatarUrl = await getSignedFileUrl(active.avatar_key);
    } catch {
      avatarUrl = null;
    }
  }

  // Latest value per metric (ANY time) + thresholds for color coding
  let latest = {};
  let todayCounts = {};
  let settings = {};
  let incidents = [];
  if (active) {
    const rows = await sql`
      SELECT DISTINCT ON (type) type, value, unit, measured_at
      FROM vitals
      WHERE patient_id = ${active.id} AND deleted_at IS NULL
      ORDER BY type, measured_at DESC
    `;
    for (const r of rows) latest[r.type] = r;

    // Number of measures taken TODAY (for the small count on each tile)
    const countRows = await sql`
      SELECT type, COUNT(*)::int AS n
      FROM vitals
      WHERE patient_id = ${active.id} AND deleted_at IS NULL
        AND measured_at >= date_trunc('day', now())
      GROUP BY type
    `;
    for (const r of countRows) todayCounts[r.type] = r.n;

    const [s] = await sql`
      SELECT spo2_min, hr_min, hr_max, temp_min, temp_max, bp_sys_max, bp_dia_max
      FROM patient_settings WHERE patient_id = ${active.id}
    `;
    settings = {
      spo2_min: 92, hr_min: 50, hr_max: 120, temp_min: 36, temp_max: 37.5,
      bp_sys_max: 140, bp_dia_max: 90,
      ...(s ?? {}),
    };

    incidents = await sql`
      SELECT id, severity, created_at
      FROM incidents
      WHERE patient_id = ${active.id} AND deleted_at IS NULL AND active = true
      ORDER BY created_at DESC
      LIMIT 20
    `;
  }

  return (
    <AppShell
      title={active ? active.name : "Dashboard"}
      eyebrow="Resumen del turno"
      action={
        active && (
          <Link href={`/patients/${active.id}`} className="flex h-11 items-center justify-center gap-1 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-muted-foreground">
            Ver ficha completa
          </Link>
        )
      }
    >
      {active && (
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={active.name}
              className="h-16 w-16 shrink-0 rounded-full border-2 border-border object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-2xl text-white">
              {(active?.name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {patients.length === 0 ? (
        <div className="mt-6 space-y-4">
          <EmptyState title="Aún no hay pacientes" detail="Crea el primer perfil para empezar a registrar constantes, notas y citas." />
          <Link href="/patients" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            <UserPlus size={18} /> Crear paciente
          </Link>
        </div>
      ) : (
        <>
          {patients.length > 1 && (
            <div className="mt-6">
              <PatientSwitcher patients={patients} activeId={active.id} />
            </div>
          )}

          <VitalTiles
            latest={latest}
            todayCounts={todayCounts}
            settings={settings}
            patientId={active.id}
            incidents={incidents}
          />

          <div className="mt-6">
            <DashboardCharts patientId={active.id} />
          </div>

          <div className="mt-6">
            <DashboardLinks patientId={active.id} />
          </div>

          <div className="mt-6">
            <InvitesInbox />
          </div>

          {active.allergies && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="text-base font-semibold">Alergias</div>
              <p className="text-sm text-muted-foreground">{active.allergies}</p>
            </div>
          )}
          {active.medications && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="text-base font-semibold">Medicación</div>
              <p className="text-sm text-muted-foreground">{active.medications}</p>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
