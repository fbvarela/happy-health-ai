import { getEnv } from "@/lib/env";

const SCOPES = ["openid", "email", "profile"];

export function hasGoogleCreds() {
  return Boolean(getEnv("GOOGLE_CLIENT_ID") && getEnv("GOOGLE_CLIENT_SECRET"));
}

export function getRedirectUri() {
  const configured = getEnv("GOOGLE_REDIRECT_URI");
  if (configured) return configured;
  const origin = (getEnv("NEXT_PUBLIC_APP_URL") ?? "").replace(/\/$/, "");
  return `${origin}/api/auth/callback`;
}

/** Builds the Google consent URL. `state` must be verified on callback. */
export function getAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: getEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * Exchanges the authorization code for tokens and returns the profile.
 * Returns { accessToken, refreshToken, expiresIn, profile }.
 */
export async function exchangeCode(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getEnv("GOOGLE_CLIENT_ID"),
      client_secret: getEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    console.error("[auth/google] token exchange failed:", res.status);
    throw new Error("Token exchange failed");
  }

  const tokens = await res.json();

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    console.error("[auth/google] userinfo failed:", profileRes.status);
    throw new Error("Failed to fetch profile");
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresIn: tokens.expires_in,
    profile: await profileRes.json(),
  };
}
