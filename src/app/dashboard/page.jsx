import { getSession } from "@/lib/session";
import StatBlock from "@/components/ui/StatBlock";
import { getUserPlan } from "@/lib/tier";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const plan = await getUserPlan(session?.userId);

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">
        Welcome back{session?.name ? `, ${session.name}` : ""}. Here&apos;s the
        current status of the people you care for.
      </p>

      {/* Latest vitals — populated in Phase 3 */}
      <div className="stats-row-grid" style={{ "--stats-cols": 4 }}>
        <StatBlock value="–" label="SpO₂" unit="%" />
        <StatBlock value="–" label="Heart rate" unit="bpm" />
        <StatBlock value="–" label="Blood pressure" unit="mmHg" />
        <StatBlock value="–" label="Temperature" unit="°C" />
      </div>

      <div className="card mt16">
        <div className="card-title">Care plan</div>
        <p className="dog-meta">
          No patients yet. Create your first patient profile to start recording
          vitals, notes and appointments (Phase 2).
        </p>
      </div>

      <div className="card mt16">
        <div className="card-title">Plan</div>
        <p className="dog-meta">
          Current plan: <span className="badge badge-sun">{plan}</span>
        </p>
        <p className="dog-meta mt8">
          {plan === "premium" || plan === "bundle"
            ? "Thanks for supporting Happy Health — all features unlocked."
            : "Free tier: 1 patient, 30 days of history. Upgrade to Premium for unlimited patients and full history."}
        </p>
      </div>
    </div>
  );
}
