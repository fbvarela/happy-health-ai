import { isCalendarConnected } from "@/lib/calendar";
import { getCurrentUser } from "@/lib/auth/user";

/** GET /api/calendar/status — { connected: boolean }. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({ connected: await isCalendarConnected(user.id) });
}
