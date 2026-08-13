import Link from "next/link";
import VitalCharts from "@/components/vitals/VitalCharts";

export default async function PatientHistoryPage({ params }) {
  const { id } = await params;
  return (
    <div className="page">
      <Link href={`/patients/${id}`} className="text-sm text-muted hover:text-bark inline-block mb-3">
        ← Volver al paciente
      </Link>
      <h1 className="page-title">Tendencias</h1>
      <p className="page-sub mb-4">Evolución de las constantes por día, semana o mes.</p>
      <VitalCharts patientId={id} />
    </div>
  );
}
