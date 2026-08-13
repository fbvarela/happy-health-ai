import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";
import { getSignedFileUrl } from "@/lib/r2";
import { redirect } from "next/navigation";
import PatientDetail from "./PatientDetail";

export const dynamic = "force-dynamic";

export default async function PatientPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) redirect("/dashboard");

  const [patient] = await sql`
    SELECT id, name, dob, gender, allergies, medications, avatar_key, created_at, updated_at
    FROM patients WHERE id = ${id}
  `;

  let avatarUrl = null;
  if (patient?.avatar_key) {
    try {
      avatarUrl = await getSignedFileUrl(patient.avatar_key);
    } catch {
      avatarUrl = null;
    }
  }

  const members = await sql`
    SELECT pm.role, u.id, u.email, u.name
    FROM patient_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.patient_id = ${id}
    ORDER BY CASE pm.role WHEN 'owner' THEN 0 WHEN 'caregiver' THEN 1 ELSE 2 END, u.name
  `;

  const invites = await sql`
    SELECT pi.id, pi.email, pi.role, pi.status, pi.created_at
    FROM patient_invites pi
    WHERE pi.patient_id = ${id} AND pi.status = 'pending'
    ORDER BY pi.created_at DESC
  `;

  return (
    <PatientDetail
      patient={patient}
      avatarUrl={avatarUrl}
      myRole={access.role}
      myName={user.name}
      members={members}
      invites={invites}
    />
  );
}
