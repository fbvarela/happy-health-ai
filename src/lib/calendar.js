import sql from "@/lib/db";
import { getEnv } from "@/lib/env";
import { getSession } from "@/lib/session";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

export function hasCalendarCreds() {
  return Boolean(getEnv("GOOGLE_CLIENT_ID") && getEnv("GOOGLE_CLIENT_SECRET"));
}

export function getCalendarRedirectUri() {
  const configured = getEnv("GOOGLE_CALENDAR_REDIRECT_URI");
  if (configured) return configured;
  const origin = (getEnv("NEXT_PUBLIC_APP_URL") ?? "").replace(/\/$/, "");
  return `${origin}/api/calendar/callback`;
}

/** Builds the Google consent URL for calendar.events scope. */
export function getCalendarAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: getEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: getCalendarRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Exchanges the calendar authorization code for tokens. */
export async function exchangeCalendarCode(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getEnv("GOOGLE_CLIENT_ID"),
      client_secret: getEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: getCalendarRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    console.error("[calendar] token exchange failed:", res.status);
    throw new Error("No se pudo conectar con Google Calendar");
  }
  const tokens = await res.json();
  if (!tokens.refresh_token) {
    throw new Error("Google no devolvió refresh_token (consent no concedido)");
  }
  return tokens;
}

/** Stores tokens for the current user. */
export async function saveCalendarTokens(userId, tokens) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  await sql`
    INSERT INTO google_calendar_tokens (user_id, access_token, refresh_token, expires_at)
    VALUES (${userId}, ${tokens.access_token}, ${tokens.refresh_token}, ${expiresAt})
    ON CONFLICT (user_id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      updated_at = now()
  `;
}

/** Returns a valid access token for the user, refreshing if needed. */
export async function getAccessToken(userId) {
  const [row] = await sql`
    SELECT access_token, refresh_token, expires_at
    FROM google_calendar_tokens WHERE user_id = ${userId}
  `;
  if (!row) return null;

  if (new Date(row.expires_at) > new Date(Date.now() + 5 * 60 * 1000)) {
    return row.access_token;
  }

  // Refresh
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getEnv("GOOGLE_CLIENT_ID"),
      client_secret: getEnv("GOOGLE_CLIENT_SECRET"),
      refresh_token: row.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error("[calendar] refresh failed:", res.status);
    return null;
  }
  const tokens = await res.json();
  await sql`
    UPDATE google_calendar_tokens
    SET access_token = ${tokens.access_token},
        expires_at = ${new Date(Date.now() + tokens.expires_in * 1000)},
        updated_at = now()
    WHERE user_id = ${userId}
  `;
  return tokens.access_token;
}

/** True if the current user has a calendar connection. */
export async function isCalendarConnected(userId) {
  const [row] = await sql`
    SELECT 1 FROM google_calendar_tokens WHERE user_id = ${userId} AND refresh_token IS NOT NULL
  `;
  return Boolean(row);
}

/** Calls the Google Calendar API with automatic refresh. */
async function gcalFetch(userId, path, options = {}) {
  const token = await getAccessToken(userId);
  if (!token) throw new Error("Google Calendar no conectado");

  const res = await fetch(`https://www.googleapis.com/calendar/v3/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[calendar] API ${res.status}:`, body.slice(0, 300));
    throw new Error("Error de Google Calendar");
  }
  return res.status === 204 ? null : res.json();
}

/** Creates an event in the caregiver's primary calendar. */
export async function createCalendarEvent(userId, { title, doctorName, location, startsAt, endsAt }) {
  const body = {
    summary: title,
    location: location ?? undefined,
    description: doctorName ? `Médico: ${doctorName}` : undefined,
    start: { dateTime: new Date(startsAt).toISOString() },
    end: { dateTime: new Date(endsAt ?? startsAt).toISOString() },
  };
  const event = await gcalFetch(userId, "calendars/primary/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return event.id;
}

/** Updates an existing event. */
export async function updateCalendarEvent(userId, eventId, fields) {
  const body = {};
  if (fields.title !== undefined) body.summary = fields.title;
  if (fields.location !== undefined) body.location = fields.location || undefined;
  if (fields.startsAt !== undefined) {
    body.start = { dateTime: new Date(fields.startsAt).toISOString() };
  }
  if (fields.endsAt !== undefined) {
    body.end = { dateTime: new Date(fields.endsAt).toISOString() };
  }
  await gcalFetch(userId, `calendars/primary/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** Deletes an event. */
export async function deleteCalendarEvent(userId, eventId) {
  await gcalFetch(userId, `calendars/primary/events/${eventId}`, { method: "DELETE" });
}

export async function getSessionUser() {
  const session = await getSession();
  return session.userId ?? null;
}
