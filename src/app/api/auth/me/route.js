import { getCurrentUser } from "@/lib/auth/user";

/** GET /api/auth/me — returns the current user (null if not logged in). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json(null);
  }
  return Response.json(user);
}
