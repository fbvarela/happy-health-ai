import { getSession } from "@/lib/session";

/** POST /api/auth/logout — clears the session cookie. */
export async function POST() {
  const session = await getSession();
  session.destroy();
  return Response.json({ ok: true });
}
