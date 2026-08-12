import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { exchangeCode } from "@/lib/auth/google";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/auth/user";
import sql from "@/lib/db";

const STATE_COOKIE = "hh_oauth_state";

/**
 * GET /api/auth/callback?code=<code>&state=<state>&next=/some/path
 * Google redirects here after consent. Verifies state, exchanges the code,
 * upserts the user, then redirects: approved → next, otherwise /pending.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!next.startsWith("/")) {
    return redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    console.error("[auth/callback] invalid or missing code/state");
    return redirect("/login?error=signin_failed");
  }

  let profile;
  try {
    ({ profile } = await exchangeCode(code));
  } catch (err) {
    console.error("[auth/callback] exchange failed:", err?.message ?? err);
    return redirect("/login?error=signin_failed");
  }

  const email = profile.email?.toLowerCase();
  if (!email) {
    console.error("[auth/callback] no email in Google profile");
    return redirect("/login?error=signin_failed");
  }

  // First sign-in → pending approval. Admins are auto-approved (ADMIN_EMAILS).
  const role = isAdminEmail(email) ? "admin" : "member";
  const initialStatus = role === "admin" ? "approved" : "pending";
  const rows = await sql`
    INSERT INTO users (email, name, google_id, avatar_url, role, status)
    VALUES (${email}, ${profile.name ?? null}, ${profile.sub ?? null}, ${profile.picture ?? null}, ${role}, ${initialStatus})
    ON CONFLICT (email) DO UPDATE SET
      name       = COALESCE(EXCLUDED.name, users.name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
      role       = CASE WHEN users.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END,
      status     = CASE WHEN EXCLUDED.role = 'admin' THEN 'approved' ELSE users.status END
    RETURNING id, email, name, locale, role, status
  `;
  const user = rows[0];
  if (!user) return redirect("/login?error=signin_failed");

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.role = user.role;
  session.status = user.status;
  await session.save();

  if (user.status !== "approved") {
    return redirect("/pending");
  }
  redirect(next);
}
