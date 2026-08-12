import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import Link from "next/link";
import InvitesInbox from "@/components/InvitesInbox";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const patients = await sql`
    SELECT p.id, p.name, p.dob, p.allergies, p.medications, pm.role
    FROM patients p
    JOIN patient_members pm ON pm.patient_id = p.id
    WHERE pm.user_id = ${user.id}
    ORDER BY p.created_at DESC
  `;

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">
        Bienvenido de nuevo{user?.name ? `, ${user.name}` : ""}. Estado actual de
        las personas a las que cuidas.
      </p>

      <InvitesInbox />

      {patients.length === 0 ? (
        <div className="card mt16">
          <div className="empty-state">
            <div className="empty-icon">💚</div>
            <p>
              Aún no hay pacientes. Crea el primer perfil para empezar a
              registrar constantes, notas y citas.
            </p>
            <Link href="/patients" className="btn btn-primary mt4">
              Crear paciente
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mt16">
          <h2 className="text-lg font-semibold text-bark">Pacientes</h2>
          {patients.map((p) => (
            <Link key={p.id} href={`/patients/${p.id}`} className="block">
              <div className="bg-surface rounded-[14px] border-[1.5px] border-line p-5 hover:border-sun transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-bark text-[1.1rem]">{p.name}</p>
                    <p className="text-muted text-sm mt-1">
                      {p.allergies ? `Alergias: ${p.allergies}` : "Sin alergias registradas"}
                    </p>
                    {p.medications && (
                      <p className="text-muted text-sm mt-0.5">
                        Medicación: {p.medications}
                      </p>
                    )}
                  </div>
                  <span className="text-2xl">›</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
