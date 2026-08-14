import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, EmptyState } from "@/components/app-shell";
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
    <AppShell title="Ajustes" eyebrow="Umbrales de alerta por paciente" showBack>
      {patients.length === 0 ? (
        <div className="mt-2 space-y-4">
          <EmptyState title="Aún no hay pacientes" detail="Cuando crees un perfil podrás ajustar aquí sus umbrales de alerta." />
          <Link href="/patients" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Ir a pacientes
          </Link>
        </div>
      ) : (
        <div className="mt-2 space-y-4">
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
    </AppShell>
  );
}
