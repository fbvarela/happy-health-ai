import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";
import { createCalendarEvent, getAccessToken } from "@/lib/calendar";

/**
 * GET /api/patients/[id]/appointments — all non-deleted appointments (viewer+).
 * POST /api/patients/[id]/appointments — create (caregiver+). If the current
 *   user has Google Calendar connected, also creates the event (one-way, D4).
 *   Body: { title, doctor_name, location, starts_at, ends_at }
 */
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const rows = await sql`
    SELECT a.id, a.title, a.doctor_name, a.location, a.starts_at, a.ends_at,
           a.google_event_id, a.created_at, a.updated_at,
           u.name AS created_by_name
    FROM appointments a
    LEFT JOIN users u ON u.id = a.created_by
    WHERE a.patient_id = ${id} AND a.deleted_at IS NULL
    ORDER BY a.starts_at ASC
  `;
  return Response.json(rows);
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

  const title = (body.title ?? "").trim();
  if (!title) return Response.json({ error: "El título es obligatorio" }, { status: 400 });

  const startsAt = new Date(body.starts_at);
  if (Number.isNaN(startsAt.getTime())) {
    return Response.json({ error: "Fecha no válida" }, { status: 400 });
  }
  const endsAt = body.ends_at ? new Date(body.ends_at) : null;
  const doctorName = (body.doctor_name ?? "").trim() || null;
  const location = (body.location ?? "").trim() || null;

  let googleEventId = null;
  const hasToken = await getAccessToken(user.id);
  if (hasToken) {
    try {
      googleEventId = await createCalendarEvent(user.id, {
        title,
        doctorName,
        location,
        startsAt,
        endsAt: endsAt ?? startsAt,
      });
    } catch (err) {
      console.error("[appointments] calendar create failed:", err?.message ?? err);
    }
  }

  const [row] = await sql`
    INSERT INTO appointments (patient_id, title, doctor_name, location, starts_at, ends_at, google_event_id, created_by)
    VALUES (${id}, ${title}, ${doctorName}, ${location}, ${startsAt}, ${endsAt}, ${googleEventId}, ${user.id})
    RETURNING id, title, doctor_name, location, starts_at, ends_at, google_event_id, created_at, updated_at
  `;
  return Response.json(row, { status: 201 });
}
