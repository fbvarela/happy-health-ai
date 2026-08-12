import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getAuthUrl, hasGoogleCreds } from "@/lib/auth/google";

const STATE_COOKIE = "hh_oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * GET /api/auth/google — starts the Google OAuth flow.
 * Stores a random state (10 min httpOnly cookie), redirects to Google.
 */
export async function GET() {
  if (!hasGoogleCreds()) {
    return Response.json(
      { error: "Google OAuth is not configured (GOOGLE_CLIENT_ID/SECRET)." },
      { status: 503 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_TTL_MS / 1000,
    path: "/",
  });

  return Response.redirect(getAuthUrl(state));
}
