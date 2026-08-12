import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { exchangeCalendarCode, saveCalendarTokens } from "@/lib/calendar";
import { getCurrentUser } from "@/lib/auth/user";

const STATE_COOKIE = "hh_calendar_state";

/**
 * GET /api/calendar/callback?code=&state=
 * Google redirects here after calendar consent. Stores tokens for the
 * current caregiver, then back to /appointments.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  if (error) {
    return redirect("/appointments?calendar=denied");
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    console.error("[calendar/callback] invalid state");
    return redirect("/appointments?calendar=error");
  }

  try {
    const tokens = await exchangeCalendarCode(code);
    await saveCalendarTokens(user.id, tokens);
    return redirect("/appointments?calendar=connected");
  } catch (err) {
    console.error("[calendar/callback] failed:", err?.message ?? err);
    return redirect("/appointments?calendar=error");
  }
}
