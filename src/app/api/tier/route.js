import { getSession } from "@/lib/session";
import { getUserPlan } from "@/lib/tier";

/** GET /api/tier — returns the current user's plan and premium flag. */
export async function GET() {
  const session = await getSession();
  const plan = await getUserPlan(session?.userId);
  return Response.json({ plan, premium: plan === "premium" || plan === "bundle" });
}
