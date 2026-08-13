import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import Link from "next/link";
import { HeartPulse } from "lucide-react";
import InvitesInbox from "@/components/InvitesInbox";
import PatientSwitcher from "@/components/dashboard/PatientSwitcher";
import VitalTiles from "@/components/dashboard/VitalTiles";

export const dynamic = "force-dynamic";

function getYesterday() {
  return new Date(Date.now() - 24 * 3600 * 1000);
}

export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();
  const { patient: patientParam } = await searchParams;

  const patients = await sql`
    SELECT p.id, p.name, p.dob, p.allergies, p.medications, pm.role
    FROM patients p
    JOIN patient_members pm ON pm.patient_id = p.id
    WHERE pm.user_id = ${user.id}
    ORDER BY p.created_at DESC
  `;

  const active = patients.find((p) => p.id === patientParam) ?? patients[0] ?? null;

  // Latest value per metric (last 24h) + thresholds for color coding
  let latest = {};
  let settings = {};
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
  }

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">
        {active ? active.name : "Bienvenido, " + (user.name ?? "")}
      </p>

      {patients.length === 0 ? (
        <div className="card mt16">
          <div className="empty-state">
            <div className="empty-icon"><HeartPulse size={28} /></div>
            <p>Aún no hay pacientes. Crea el primer perfil para empezar.</p>
            <Link href="/patients" className="btn btn-primary mt4">
              Crear paciente
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

          <VitalTiles latest={latest} settings={settings} patientId={active.id} />

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
