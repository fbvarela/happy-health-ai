export default function AppointmentsPage() {
  return (
    <div className="page">
      <h1 className="page-title">Appointments</h1>
      <p className="page-sub">Medical appointments and Google Calendar sync (Phase 4).</p>
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>No appointments yet.</p>
        </div>
      </div>
    </div>
  );
}
