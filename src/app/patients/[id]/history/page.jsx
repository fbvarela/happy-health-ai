import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import VitalCharts from "@/components/vitals/VitalCharts";

export default async function PatientHistoryPage({ params }) {
  const { id } = await params;
  return (
    <div className="page">
      <Link
        href={`/patients/${id}`}
        aria-label="Volver al paciente"
        className="inline-flex items-center justify-center w-11 h-11 min-h-[44px] rounded-full bg-[var(--surface)] border-2 border-line text-bark hover:border-[var(--bark)] transition-colors mb-4"
      >
        <ArrowLeft size={20} />
      </Link>
      <h1 className="page-title">Tendencias</h1>
      <p className="page-sub mb-4">Evolución de las constantes por día, semana o mes.</p>
      <VitalCharts patientId={id} />
    </div>
  );
}
