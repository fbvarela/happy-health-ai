import { getSession } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { getEnv } from "@/lib/env";
import sql from "@/lib/db";

/** POST /api/stripe/portal — opens the Stripe billing portal. */
export async function POST() {
  const session = await getSession();
  if (!session.userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rows = await sql`
    SELECT stripe_customer_id FROM subscriptions
    WHERE user_id = ${session.userId} AND stripe_customer_id IS NOT NULL
    LIMIT 1
  `;
  const customerId = rows[0]?.stripe_customer_id;
  if (!customerId) {
    return Response.json({ error: "No subscription found" }, { status: 404 });
  }

  const appUrl = getEnv("NEXT_PUBLIC_APP_URL")?.replace(/\/$/, "");
  const portal = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard`,
  });

  return Response.json({ url: portal.url });
}
