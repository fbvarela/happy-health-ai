const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch { /* non-JSON error body */ }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getMe: () => request("/auth/me", { cache: "no-store" }),
  login: (email) =>
    request("/auth/send-link", { method: "POST", body: JSON.stringify({ email }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  getTier: () => request("/tier", { cache: "no-store" }),
};

export default api;
