/**
 * StatBlock — a single metric card (latest SpO₂, HR, etc.).
 */
export default function StatBlock({ value, label, unit, tone = "default" }) {
  return (
    <div className="stat-block">
      <div className="stat-number">
        {value}
        {unit && <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}> {unit}</span>}
      </div>
      <div className="stat-label" style={{ color: tone === "alert" ? "#d94f3d" : undefined }}>
        {label}
      </div>
    </div>
  );
}
