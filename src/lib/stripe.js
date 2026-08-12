import Stripe from "stripe";
import { getEnv } from "@/lib/env";

let _stripe;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(getEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}
