import sql from "@/lib/db";

/**
 * Returns true if the given plan allows access to premium features.
 * Both 'premium' (single-app) and 'bundle' (all-apps) unlock premium.
 */
export function isPremium(plan) {
  return plan === "premium" || plan === "bundle";
}

/**
 * Resolves the current subscription plan for a user from the DB.
 * Returns 'free' | 'premium' | 'bundle'.
 */
export async function getUserPlan(userId) {
  if (!userId) return "free";
  try {
    const rows = await sql`
      SELECT plan, status, current_period_end
      FROM subscriptions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const sub = rows[0];
    if (!sub) return "free";
    if (sub.status !== "active" && sub.status !== "trialing") return "free";
    if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) return "free";
    return sub.plan ?? "free";
  } catch {
    return "free";
  }
}
