import { getStripe } from "@/lib/stripe";
import { getEnv } from "@/lib/env";
import sql from "@/lib/db";

/**
 * POST /api/stripe/webhook
 * Handles subscription lifecycle events. Bundle price IDs map to
 * plan 'bundle' — same price IDs as every other Happy Factory app.
 */
export async function POST(request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const secret = getEnv("STRIPE_WEBHOOK_SECRET");

  if (!signature || !secret) {
    return Response.json({ error: "Missing webhook signature" }, { status: 400 });
  }

  let event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[stripe/webhook] signature error:", err?.message);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object;
        const bundleIds = [
          getEnv("STRIPE_BUNDLE_MONTHLY"),
          getEnv("STRIPE_BUNDLE_ANNUAL"),
        ].filter(Boolean);
        let plan = "premium";
        if (cs.subscription) {
          const sub = await stripe.subscriptions.retrieve(cs.subscription);
          const priceId = sub.items?.data?.[0]?.price?.id;
          if (bundleIds.includes(priceId)) plan = "bundle";
        }
        await sql`
          INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, plan, status)
          VALUES (${cs.client_reference_id}, ${cs.customer}, ${cs.subscription}, ${plan}, 'active')
          ON CONFLICT (stripe_customer_id) DO UPDATE
            SET stripe_subscription_id = EXCLUDED.stripe_subscription_id,
                plan = EXCLUDED.plan,
                status = 'active'
        `;
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const priceId = sub.items?.data?.[0]?.price?.id;
        const bundleIds = [
          getEnv("STRIPE_BUNDLE_MONTHLY"),
          getEnv("STRIPE_BUNDLE_ANNUAL"),
        ].filter(Boolean);
        const plan = bundleIds.includes(priceId) ? "bundle" : "premium";

        await sql`
          UPDATE subscriptions
          SET plan = ${plan},
              status = ${sub.status},
              current_period_end = ${sub.current_period_end ? new Date(sub.current_period_end * 1000) : null}
          WHERE stripe_subscription_id = ${sub.id}
        `;
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error:", err?.message ?? err);
    return Response.json({ error: "Webhook handling failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
