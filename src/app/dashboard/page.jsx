import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import Link from "next/link";
import { HeartPulse, UserPlus } from "lucide-react";
import InvitesInbox from "@/components/InvitesInbox";
import PatientSwitcher from "@/components/dashboard/PatientSwitcher";
import VitalTiles from "@/components/dashboard/VitalTiles";
import IncidentsSection from "@/components/dashboard/IncidentsSection";
import { getSignedFileUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

function getYesterday() {
  return new Date(Date.now() - 24 * 3600 * 1000);
}

export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();
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

  // Latest value per metric (last 24h) + thresholds for color coding
  let latest = {};
  let settings = {};
  let incidents = [];
  if (active) {
    const since = getYesterday();
    const rows = await sql`
      SELECT DISTINCT ON (type) type, value, unit, measured_at
      FROM vitals
      WHERE patient_id = ${active.id} AND deleted_at IS NULL AND measured_at >= ${since}
      ORDER BY type, measured_at DESC
    `;
    for (const r of rows) latest[r.type] = r;

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
    <div className="page">
      <div className="flex flex-row items-center gap-4">
        {active && (avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={active.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-line shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[var(--sun)] flex items-center justify-center text-white font-serif text-2xl shrink-0">
            {(active?.name ?? "?").charAt(0).toUpperCase()}
          </div>
        ))}
        <div>
          <h1 className="font-serif text-[2.2rem] font-semibold text-bark leading-none">
            {active ? active.name : "Dashboard"}
          </h1>
          {active && (
            <Link href={`/patients/${active.id}`} className="text-sm text-muted hover:text-bark inline-flex items-center gap-1 mt-1">
              Ver ficha completa <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="card mt16">
          <div className="empty-state">
            <div className="empty-icon"><HeartPulse size={28} /></div>
            <p>Aún no hay pacientes. Crea el primer perfil para empezar.</p>
            <Link href="/patients" className="btn btn-primary mt4">
              <UserPlus size={18} className="mr-1" /> Crear paciente
            </Link>
          </div>
        </div>
      ) : (
        <>
          {patients.length > 1 && (
            <div className="mt16">
              <PatientSwitcher patients={patients} activeId={active.id} />
            </div>
          )}

          <VitalTiles
            latest={latest}
            settings={settings}
            patientId={active.id}
            incidents={incidents}
          />

          <div className="mt16">
            <IncidentsSection patientId={active.id} canEdit={active.role !== "viewer"} />
          </div>

          <div className="mt16">
            <InvitesInbox />
          </div>

          {active.allergies && (
            <div className="card mt16">
              <div className="card-title">Alergias</div>
              <p className="dog-meta">{active.allergies}</p>
            </div>
          )}
          {active.medications && (
            <div className="card mt16">
              <div className="card-title">Medicación</div>
              <p className="dog-meta">{active.medications}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
