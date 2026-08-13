import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import SettingsThresholds from "@/components/settings/SettingsThresholds";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const patients = await sql`
    SELECT p.id, p.name, pm.role
    FROM patients p
    JOIN patient_members pm ON pm.patient_id = p.id
    WHERE pm.user_id = ${user.id}
    ORDER BY p.created_at DESC
  `;

  return (
    <div className="page">
      <h1 className="page-title">Ajustes</h1>
      <p className="page-sub">Umbrales de alerta por paciente.</p>

      {patients.length === 0 ? (
        <div className="card mt16">
          <div className="empty-state">
            <div className="empty-icon">⚙️</div>
            <p>Aún no hay pacientes.</p>
            <Link href="/patients" className="btn btn-primary mt4">Ir a pacientes</Link>
          </div>
        </div>
      ) : (
        <div className="mt16 space-y-4">
          {patients.map((p) => (
            <SettingsThresholds
              key={p.id}
              patientId={p.id}
              patientName={p.name}
              canEdit={p.role !== "viewer"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
