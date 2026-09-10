import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { redirect } from "next/navigation";
import EmergenciesList from "./EmergenciesList";

export const dynamic = "force-dynamic";

export default async function EmergenciesPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { all } = await searchParams;
  const showAll = all === "1";

  const emergencies = showAll
    ? await sql`
        SELECT e.id, e.type, e.details, e.resolved, e.created_at,
               p.id AS patient_id, p.name AS patient_name
        FROM emergencies e
        JOIN patients p ON p.id = e.patient_id
        JOIN patient_members pm ON pm.patient_id = p.id
        WHERE pm.user_id = ${user.id} AND e.deleted_at IS NULL
        ORDER BY e.created_at DESC
      `
    : await sql`
        SELECT e.id, e.type, e.details, e.resolved, e.created_at,
               p.id AS patient_id, p.name AS patient_name
        FROM emergencies e
        JOIN patients p ON p.id = e.patient_id
        JOIN patient_members pm ON pm.patient_id = p.id
        WHERE pm.user_id = ${user.id} AND e.deleted_at IS NULL
        ORDER BY e.created_at DESC
      `;

  return <EmergenciesList emergencies={emergencies} showAll={showAll} />;
}