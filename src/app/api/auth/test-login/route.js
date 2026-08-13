import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/auth/user";
import sql from "@/lib/db";

/**
 * POST /api/auth/test-login — bypass login (platform convention, TEST-LOGIN.md).
 * Body: { email } — dev/preview only. Hard 404 in production.
 */
export async function POST(request) {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    return new Response(null, { status: 404 });
  }

  let email;
  try {
    ({ email } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  email = (email ?? "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Email requerido" }, { status: 400 });

  const allowed = (process.env.TEST_LOGIN_EMAIL ?? "").toLowerCase();
  if (allowed && email !== allowed) {
    return Response.json({ error: "Credenciales no válidas" }, { status: 403 });
  }

  // Upsert the user (approved, role by ADMIN_EMAILS) and create a session directly
  const role = isAdminEmail(email) ? "admin" : "member";
  const rows = await sql`
    INSERT INTO users (email, name, role, status)
    VALUES (${email}, ${email.split("@")[0]}, ${role}, 'approved')
    ON CONFLICT (email) DO UPDATE SET
      role   = CASE WHEN users.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END,
      status = 'approved'
    RETURNING id, email, name, role, status
  `;
  const user = rows[0];

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.role = user.role;
  session.status = user.status;
  await session.save();

  return Response.json({ ok: true });
}
