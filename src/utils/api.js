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
  updateMemberRole: (id, userId, role) =>
    request(`/patients/${id}/members/${userId}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  removeMember: (id, userId) =>
    request(`/patients/${id}/members/${userId}`, { method: "DELETE" }),
  addMember: (id, data) =>
    request(`/patients/${id}/members`, { method: "POST", body: JSON.stringify(data) }),
  getCaregivers: (patientId) => request(`/users/caregivers?patientId=${patientId}`, { cache: "no-store" }),
  getInvites: () => request("/invites", { cache: "no-store" }),
  respondInvite: (id, action) =>
    request(`/invites/${id}`, { method: "POST", body: JSON.stringify({ action }) }),
  getVitals: (id, params = "") => request(`/patients/${id}/vitals${params}`, { cache: "no-store" }),
  createVital: (id, data) =>
    request(`/patients/${id}/vitals`, { method: "POST", body: JSON.stringify(data) }),
  updateVital: (id, vitalId, data) =>
    request(`/patients/${id}/vitals/${vitalId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteVital: (id, vitalId) =>
    request(`/patients/${id}/vitals/${vitalId}`, { method: "DELETE" }),
  getNotes: (id) => request(`/patients/${id}/notes`, { cache: "no-store" }),
  createNote: (id, data) =>
    request(`/patients/${id}/notes`, { method: "POST", body: JSON.stringify(data) }),
  updateNote: (id, noteId, data) =>
    request(`/patients/${id}/notes/${noteId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteNote: (id, noteId) =>
    request(`/patients/${id}/notes/${noteId}`, { method: "DELETE" }),
  getSettings: (id) => request(`/patients/${id}/settings`, { cache: "no-store" }),
  updateSettings: (id, data) =>
    request(`/patients/${id}/settings`, { method: "PUT", body: JSON.stringify(data) }),
  getAppointments: (id) => request(`/patients/${id}/appointments`, { cache: "no-store" }),
  getAppointment: (id, apptId) => request(`/patients/${id}/appointments/${apptId}`, { cache: "no-store" }),
  createAppointment: (id, data) =>
    request(`/patients/${id}/appointments`, { method: "POST", body: JSON.stringify(data) }),
  updateAppointment: (id, apptId, data) =>
    request(`/patients/${id}/appointments/${apptId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAppointment: (id, apptId) =>
    request(`/patients/${id}/appointments/${apptId}`, { method: "DELETE" }),
  calendarStatus: () => request("/calendar/status", { cache: "no-store" }),
  calendarDisconnect: () => request("/calendar/disconnect", { method: "POST" }),
  requestUploadUrl: (id, data) =>
    request(`/patients/${id}/uploads/signed-url`, { method: "POST", body: JSON.stringify(data) }),
  requestAvatarUrl: (id, data) =>
    request(`/patients/${id}/avatar/signed-url`, { method: "POST", body: JSON.stringify(data) }),
  confirmAvatar: (id, key) =>
    request(`/patients/${id}/avatar`, { method: "POST", body: JSON.stringify({ key }) }),
  getIncidents: (id) => request(`/patients/${id}/incidents`, { cache: "no-store" }),
  createIncident: (id, data) =>
    request(`/patients/${id}/incidents`, { method: "POST", body: JSON.stringify(data) }),
  getIncident: (id, incidentId) =>
    request(`/patients/${id}/incidents/${incidentId}`, { cache: "no-store" }),
  updateIncident: (id, incidentId, data) =>
    request(`/patients/${id}/incidents/${incidentId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteIncident: (id, incidentId) =>
    request(`/patients/${id}/incidents/${incidentId}`, { method: "DELETE" }),
  confirmUpload: (id, data) =>
    request(`/patients/${id}/uploads/confirm`, { method: "POST", body: JSON.stringify(data) }),
  getUploads: (id) => request(`/patients/${id}/uploads`, { cache: "no-store" }),
  updateUpload: (id, uploadId, data) =>
    request(`/patients/${id}/uploads/${uploadId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteUpload: (id, uploadId) =>
    request(`/patients/${id}/uploads/${uploadId}`, { method: "DELETE" }),
  getNotifications: () => request("/notifications", { cache: "no-store" }),
  getUnreadCount: () => request("/notifications/unread-count", { cache: "no-store" }),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => request("/notifications/read-all", { method: "POST" }),
};

export default api;
