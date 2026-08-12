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
  logout: () => request("/auth/logout", { method: "POST" }),
  getTier: () => request("/tier", { cache: "no-store" }),
  getPendingApprovals: () => request("/admin/approvals", { cache: "no-store" }),
  decideApproval: (userId, action) =>
    request(`/admin/approvals/${userId}`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
  getPatients: () => request("/patients", { cache: "no-store" }),
  getPatient: (id) => request(`/patients/${id}`, { cache: "no-store" }),
  createPatient: (data) =>
    request("/patients", { method: "POST", body: JSON.stringify(data) }),
  updatePatient: (id, data) =>
    request(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deletePatient: (id) =>
    request(`/patients/${id}`, { method: "DELETE" }),
  invitePatient: (id, data) =>
    request(`/patients/${id}/invites`, { method: "POST", body: JSON.stringify(data) }),
  getInvites: () => request("/invites", { cache: "no-store" }),
  respondInvite: (id, action) =>
    request(`/invites/${id}`, { method: "POST", body: JSON.stringify({ action }) }),
};

export default api;
