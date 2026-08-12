import { getSession } from "@/lib/session";
import StatBlock from "@/components/ui/StatBlock";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">
        Bienvenido de nuevo{session?.name ? `, ${session.name}` : ""}. Este es el
        estado actual de las personas a las que cuidas.
      </p>

      {/* Latest vitals — populated in Phase 3 */}
      <div className="stats-row-grid" style={{ "--stats-cols": 4 }}>
        <StatBlock value="–" label="SpO₂" unit="%" />
        <StatBlock value="–" label="Frecuencia cardíaca" unit="ppm" />
        <StatBlock value="–" label="Presión arterial" unit="mmHg" />
        <StatBlock value="–" label="Temperatura" unit="°C" />
      </div>

      <div className="card mt16">
        <div className="card-title">Pacientes</div>
        <p className="dog-meta">
          Aún no hay pacientes. Crea el primer perfil de paciente para empezar a
          registrar constantes, notas y citas (Fase 2).
        </p>
      </div>
    </div>
  );
}
