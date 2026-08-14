import { AppShell } from "@/components/app-shell";
import VitalCharts from "@/components/vitals/VitalCharts";

export default async function PatientHistoryPage({ params }) {
  const { id } = await params;
  return (
    <AppShell
      title="Tendencias"
      eyebrow="Evolución de las constantes por día, semana o mes"
      showBack
    >
      <VitalCharts patientId={id} />
    </AppShell>
  );
}
