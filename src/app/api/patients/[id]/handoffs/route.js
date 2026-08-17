import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";

async function getCurrentCaregiver(patientId) {
  const [handoff] = await sql`
    SELECT to_user_id
    FROM caregiver_handoffs
    WHERE patient_id = ${patientId}
    ORDER BY transferred_at DESC
    LIMIT 1
  `;
  if (handoff) return handoff.to_user_id;

  const [owner] = await sql`
    SELECT user_id
    FROM patient_members
    WHERE patient_id = ${patientId} AND role = 'owner'
    LIMIT 1
  `;
  return owner?.user_id ?? null;
}

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [currentId, caregivers, history] = await Promise.all([
    getCurrentCaregiver(id),
    sql`
      SELECT u.id, u.name, u.email, pm.role
      FROM patient_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.patient_id = ${id} AND pm.role IN ('owner', 'caregiver')
      ORDER BY u.name, u.email
    `,
    sql`
      SELECT h.id, h.transferred_at, h.note,
             from_user.id AS from_id, from_user.name AS from_name,
             to_user.id AS to_id, to_user.name AS to_name
      FROM caregiver_handoffs h
      JOIN users from_user ON from_user.id = h.from_user_id
      JOIN users to_user ON to_user.id = h.to_user_id
      WHERE h.patient_id = ${id}
        AND h.transferred_at >= date_trunc('day', now())
      ORDER BY h.transferred_at DESC
    `,
  ]);

  return Response.json({
    current: caregivers.find((caregiver) => caregiver.id === currentId) ?? null,
    caregivers,
    history,
    currentUserId: user.id,
    canTransfer: ["owner", "caregiver"].includes(access.role),
  });
}

export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const targetId = body.toUserId;
  if (!targetId) return Response.json({ error: "Selecciona un cuidador" }, { status: 400 });

  const [target] = await sql`
    SELECT u.id, u.name, u.email
    FROM patient_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.patient_id = ${id}
      AND pm.user_id = ${targetId}
      AND pm.role IN ('owner', 'caregiver')
    LIMIT 1
  `;
  if (!target) return Response.json({ error: "El usuario no es cuidador de este paciente" }, { status: 400 });

  const currentId = await getCurrentCaregiver(id);
  if (currentId === targetId) {
    return Response.json({ error: "Este cuidador ya está al cargo" }, { status: 400 });
  }

  const [handoff] = await sql`
    INSERT INTO caregiver_handoffs (patient_id, from_user_id, to_user_id, created_by, note)
    VALUES (${id}, ${currentId ?? user.id}, ${targetId}, ${user.id}, ${body.note?.trim() || null})
    RETURNING id, transferred_at
  `;

  return Response.json({ ok: true, handoff, current: target });
}
