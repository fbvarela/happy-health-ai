import { AppShell } from "@/components/app-shell";
import VitalCharts from "@/components/vitals/VitalCharts";
import MoodDistribution from "@/components/evolucion/MoodDistribution";

export default async function PatientHistoryPage({ params }) {
  const { id } = await params;
  return (
    <AppShell
      title="Tendencias"
      eyebrow="Evolución de las constantes por día, semana o mes"
      showBack
    >
      <MoodDistribution patientId={id} />
      <div className="mt-8"><VitalCharts patientId={id} /></div>
    </AppShell>
  );
}
