import { sendMagicLink } from "@/lib/auth/magic-link";

/**
 * POST /api/auth/send-link
 * Body: { email }
 * Sends a magic link (creates the user if new). Always returns a generic
 * success message to avoid leaking which emails are registered.
 */
export async function POST(request) {
  let email;
  try {
    ({ email } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await sendMagicLink(email);
    return Response.json({ message: "Magic link sent — check your email." });
  } catch (err) {
    console.error("[auth/send-link]", err?.message ?? err);
    const status = /too many/i.test(err?.message ?? "") ? 429 : 503;
    return Response.json({ error: err?.message ?? "Failed to send magic link" }, { status });
  }
}
