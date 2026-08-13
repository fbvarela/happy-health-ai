import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import Link from "next/link";
import IncidentsList from "./IncidentsList";

export const dynamic = "force-dynamic";

export default async function IncidentsPage({ searchParams }) {
  const user = await getCurrentUser();
  const { all } = await searchParams;
  const showAll = all === "1";

  const incidents = showAll
    ? await sql`
        SELECT i.id, i.title, i.notes, i.severity, i.active, i.created_at,
               p.id AS patient_id, p.name AS patient_name
        FROM incidents i
        JOIN patients p ON p.id = i.patient_id
        JOIN patient_members pm ON pm.patient_id = p.id
        WHERE pm.user_id = ${user.id} AND i.deleted_at IS NULL
        ORDER BY i.active DESC, i.created_at DESC
      `
    : await sql`
        SELECT i.id, i.title, i.notes, i.severity, i.active, i.created_at,
               p.id AS patient_id, p.name AS patient_name
        FROM incidents i
        JOIN patients p ON p.id = i.patient_id
        JOIN patient_members pm ON pm.patient_id = p.id
        WHERE pm.user_id = ${user.id} AND i.deleted_at IS NULL AND i.active = true
        ORDER BY i.created_at DESC
      `;

  return <IncidentsList incidents={incidents} showAll={showAll} />;
}
