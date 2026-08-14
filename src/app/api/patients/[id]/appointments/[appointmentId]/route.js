import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import { requirePatientAccess } from "@/lib/patients";
import { deleteCalendarEvent, updateCalendarEvent, getAccessToken } from "@/lib/calendar";

/**
 * GET    /api/patients/[id]/appointments/[appointmentId] — one appointment (viewer+).
 * PATCH  /api/patients/[id]/appointments/[appointmentId] — update (caregiver+).
 * DELETE /api/patients/[id]/appointments/[appointmentId] — soft delete (caregiver+).
 */
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, appointmentId } = await params;
  const access = await requirePatientAccess(user.id, id, "viewer");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [row] = await sql`
    SELECT a.id, a.title, a.doctor_name, a.location, a.starts_at, a.ends_at,
           a.google_event_id, a.created_at, a.updated_at,
           p.name AS patient_name,
           u.name AS created_by_name
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    LEFT JOIN users u ON u.id = a.created_by
    WHERE a.id = ${appointmentId} AND a.patient_id = ${id} AND a.deleted_at IS NULL
  `;
  if (!row) return Response.json({ error: "No encontrado" }, { status: 404 });
  return Response.json(row);
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, appointmentId } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const [existing] = await sql`
    SELECT * FROM appointments WHERE id = ${appointmentId} AND patient_id = ${id} AND deleted_at IS NULL
  `;
  if (!existing) return Response.json({ error: "No encontrado" }, { status: 404 });

  const fields = [];
  const values = [];
  const add = (name, value) => {
    values.push(value);
    fields.push(`"${name}" = $${values.length}`);
  };

  if (body.title !== undefined) {
    const title = (body.title ?? "").trim();
    if (!title) return Response.json({ error: "El título es obligatorio" }, { status: 400 });
    add("title", title);
  }
  if (body.doctor_name !== undefined) add("doctor_name", (body.doctor_name ?? "").trim() || null);
  if (body.location !== undefined) add("location", (body.location ?? "").trim() || null);
  if (body.starts_at !== undefined) {
    const t = new Date(body.starts_at);
    if (Number.isNaN(t.getTime())) return Response.json({ error: "Fecha no válida" }, { status: 400 });
    add("starts_at", t);
  }
  if (body.ends_at !== undefined) {
    if (body.ends_at) {
      const t = new Date(body.ends_at);
      if (Number.isNaN(t.getTime())) return Response.json({ error: "Fecha no válida" }, { status: 400 });
      add("ends_at", t);
    } else {
      add("ends_at", null);
    }
  }

  if (fields.length === 0) {
    return Response.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  // Mirror to Google if the editing user is connected AND owns the calendar event
  const hasToken = await getAccessToken(user.id);
  if (hasToken && existing.google_event_id) {
    try {
      await updateCalendarEvent(user.id, existing.google_event_id, {
        title: body.title,
        location: body.location,
        startsAt: body.starts_at,
        endsAt: body.ends_at,
      });
    } catch (err) {
      console.error("[appointments] calendar update failed:", err?.message ?? err);
    }
  }

  values.push(appointmentId);
  fields.push(`updated_at = now()`);
  const rows = await sql(
    `UPDATE appointments SET ${fields.join(", ")} WHERE id = $${values.length}
     RETURNING id, title, doctor_name, location, starts_at, ends_at, google_event_id, updated_at`,
    values
  );
  return Response.json(rows[0]);
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, appointmentId } = await params;
  const access = await requirePatientAccess(user.id, id, "caregiver");
  if (!access) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [existing] = await sql`
    SELECT google_event_id FROM appointments WHERE id = ${appointmentId} AND patient_id = ${id} AND deleted_at IS NULL
  `;
  if (!existing) return Response.json({ error: "No encontrado" }, { status: 404 });

  const hasToken = await getAccessToken(user.id);
  if (hasToken && existing.google_event_id) {
    try {
      await deleteCalendarEvent(user.id, existing.google_event_id);
    } catch (err) {
      console.error("[appointments] calendar delete failed:", err?.message ?? err);
    }
  }

  await sql`UPDATE appointments SET deleted_at = now() WHERE id = ${appointmentId}`;
  return Response.json({ ok: true });
}
