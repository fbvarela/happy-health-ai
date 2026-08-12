import { getSession } from "@/lib/session";

/** GET /api/auth/me — returns the current user (null if not logged in). */
export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return Response.json(null);
  }
  return Response.json({
    id: session.userId,
    email: session.email,
    name: session.name,
    locale: session.locale,
  });
}
