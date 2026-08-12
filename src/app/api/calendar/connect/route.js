import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getCalendarAuthUrl, hasCalendarCreds } from "@/lib/calendar";
import { getCurrentUser } from "@/lib/auth/user";

const STATE_COOKIE = "hh_calendar_state";
const TTL_S = 10 * 60;

/**
 * GET /api/calendar/connect — starts Google Calendar OAuth (caregiver's account).
 * The consent is tied to the signed-in caregiver (D4).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasCalendarCreds()) {
    return Response.json(
      { error: "Google Calendar no está configurado (GOOGLE_CLIENT_ID/SECRET)." },
      { status: 503 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TTL_S,
    path: "/",
  });

  return Response.redirect(getCalendarAuthUrl(state));
}
