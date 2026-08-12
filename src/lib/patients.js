import sql from "@/lib/db";

export const ROLE_WEIGHT = { viewer: 1, caregiver: 2, owner: 3 };

/** Returns the member row for (userId, patientId) or null. */
export async function getMember(userId, patientId) {
  const rows = await sql`
    SELECT role FROM patient_members
    WHERE patient_id = ${patientId} AND user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Returns the member if the user has access to the patient with at least
 * `minRole` (viewer/caregiver/owner), otherwise null.
 */
export async function requirePatientAccess(userId, patientId, minRole = "viewer") {
  const member = await getMember(userId, patientId);
  if (!member) return null;
  if (ROLE_WEIGHT[member.role] < ROLE_WEIGHT[minRole]) return null;
  return member;
}
