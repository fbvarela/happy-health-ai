import { redirect } from "next/navigation";
import { verifyMagicLink } from "@/lib/auth/magic-link";
import { getSession } from "@/lib/session";

/**
 * GET /api/auth/callback?token=<token>&next=/some/path
 * Validates a magic-link token, creates an iron-session, then redirects.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!next.startsWith("/")) {
    return redirect("/dashboard");
  }

  const user = await verifyMagicLink(token);
  if (!user) {
    redirect("/login?error=invalid_token");
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.locale = user.locale;
  await session.save();

  redirect(next);
}
