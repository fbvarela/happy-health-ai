import BackButton from "@/components/BackButton";
import VitalCharts from "@/components/vitals/VitalCharts";

export default async function PatientHistoryPage({ params }) {
  const { id } = await params;
  return (
    <div className="page">
      <BackButton fallback={`/patients/${id}`} label="Volver" />
      <h1 className="page-title">Tendencias</h1>
      <p className="page-sub mb-4">Evolución de las constantes por día, semana o mes.</p>
      <VitalCharts patientId={id} />
    </div>
  );
}
