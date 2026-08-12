import { getSession } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { getEnv } from "@/lib/env";

/**
 * POST /api/stripe/checkout
 * Body: { plan: 'monthly' | 'annual' | 'bundle-monthly' | 'bundle-annual' }
 * Creates a Stripe Checkout session for the selected plan.
 */
export async function POST(request) {
  const session = await getSession();
  if (!session.userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let plan;
  try {
    ({ plan } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const prices = {
    monthly: getEnv("STRIPE_HEALTH_MONTHLY"),
    annual: getEnv("STRIPE_HEALTH_ANNUAL"),
    "bundle-monthly": getEnv("STRIPE_BUNDLE_MONTHLY"),
    "bundle-annual": getEnv("STRIPE_BUNDLE_ANNUAL"),
  };

  const priceId = prices[plan];
  if (!priceId) {
    return Response.json({ error: "Unknown plan" }, { status: 400 });
  }

  const appUrl = getEnv("NEXT_PUBLIC_APP_URL")?.replace(/\/$/, "");
  const stripe = getStripe();

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: session.userId,
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/dashboard?checkout=cancelled`,
  });

  return Response.json({ url: checkout.url });
}
