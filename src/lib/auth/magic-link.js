import { createHash, randomBytes } from "node:crypto";
import sql from "@/lib/db";
import { getEnv } from "@/lib/env";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT = 5; // magic links per email per hour

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Sends a magic link to the given email (creates the user if new).
 * Returns { message } on success — never confirms whether the user existed.
 */
export async function sendMagicLink(email) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error("Email is required");

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await sql`
    SELECT COUNT(*)::int AS n
    FROM magic_links
    WHERE email = ${normalized} AND created_at > ${oneHourAgo}
  `;
  if (recent[0].n >= RATE_LIMIT) {
    throw new Error("Too many requests. Try again in an hour.");
  }

  await sql`
    INSERT INTO users (email) VALUES (${normalized})
    ON CONFLICT (email) DO NOTHING
  `;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await sql`
    INSERT INTO magic_links (email, token_hash, expires_at)
    VALUES (${normalized}, ${hashToken(token)}, ${expiresAt})
  `;

  const origin = getEnv("NEXT_PUBLIC_APP_URL")?.replace(/\/$/, "") || "";
  const magicLink = `${origin}/api/auth/callback?token=${token}`;

  if (!getEnv("RESEND_API_KEY")) {
    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║  💚 MAGIC LINK (dev mode)                ║");
    console.log(`║  To: ${normalized}`);
    console.log(`║  ${magicLink}`);
    console.log("╚══════════════════════════════════════════╝\n");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getEnv("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEnv("EMAIL_FROM") ?? "noreply@happyfactory.app",
      to: normalized,
      subject: "Your Happy Health sign-in link",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#3d2b1f">💚 Happy Health</h2>
          <p>Click the button below to sign in. This link expires in 1 hour.</p>
          <a href="${magicLink}"
             style="display:inline-block;background:#4a7c59;color:#fff;text-decoration:none;
                    padding:12px 24px;border-radius:6px;font-weight:600;margin:16px 0">
            Sign in to Happy Health
          </a>
          <p style="color:#6b7280;font-size:14px">
            Or copy this link:<br/>
            <a href="${magicLink}" style="color:#4a7c59;word-break:break-all">${magicLink}</a>
          </p>
          <p style="color:#9ca3af;font-size:12px">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    console.error("[magic-link] Resend error:", res.status);
    throw new Error("Failed to send email");
  }
}

/**
 * Validates a magic-link token. Returns the user or null.
 */
export async function verifyMagicLink(token) {
  if (!token) return null;
  const now = new Date();
  const rows = await sql`
    SELECT id, email, used, expires_at
    FROM magic_links
    WHERE token_hash = ${hashToken(token)}
    LIMIT 1
  `;
  const link = rows[0];
  if (!link || link.used || new Date(link.expires_at) < now) return null;

  await sql`UPDATE magic_links SET used = TRUE WHERE id = ${link.id}`;

  const users = await sql`
    SELECT id, email, name, locale FROM users WHERE email = ${link.email} LIMIT 1
  `;
  return users[0] ?? null;
}
