import { getCurrentUser } from "@/lib/auth/user";
import sql from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, BarChart3, ChevronRight, HeartPulse, Thermometer, UserPlus } from "lucide-react";
import { AppShell, EmptyState } from "@/components/app-shell";
import { getDashboardData } from "@/lib/dashboard";
import { computeHealthScore } from "@/lib/health-score";
import PooCounter from "@/components/dashboard/PooCounter";
import MoodPicker from "@/components/dashboard/MoodPicker";
import NightEventsPicker from "@/components/dashboard/NightEventsPicker";
import MedicationChecklist from "@/components/dashboard/MedicationChecklist";
import WalkCheck from "@/components/dashboard/WalkCheck";
import MealQualityPicker from "@/components/dashboard/MealQualityPicker";
import SpO2Recorder from "@/components/dashboard/SpO2Recorder";
import CaregiverHandoff from "@/components/dashboard/CaregiverHandoff";

export const dynamic = "force-dynamic";

const WARNING_DOT = <span className="size-2 shrink-0 rounded-full bg-warning" aria-hidden="true" />;

function MeasureCard({ label, icon: Icon, today, yesterday, unit, count, accent = "text-primary" }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent ${accent}`}>
            <Icon className="size-4" />
          </span>
          <p className="min-w-0 truncate text-xs font-semibold sm:text-sm">{label}</p>
        </div>
        {today == null && <span title="Sin medición hoy">{WARNING_DOT}</span>}
      </div>

      <p className="mt-3 font-mono text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
        {today ?? "–"}
        {unit && today != null && <span className="text-sm font-medium text-muted-foreground"> {unit}</span>}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Ayer {yesterday != null ? `${yesterday}${unit ?? ""}` : "–"}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{count} hoy</p>
    </section>
  );
}

function HealthScoreCard({ score }) {
  if (!score) return null;
  const tone = score.color === "verde" ? "success" : score.color === "naranja" ? "warning" : "critical";
  const toneClass = tone === "success" ? "text-success bg-success/10" : tone === "warning" ? "text-warning-foreground bg-warning/15" : "text-critical bg-critical/10";
  return <section className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"><span className={`flex size-11 items-center justify-center rounded-xl text-sm font-bold ${toneClass}`}>{score.score}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Puntuación de salud</p><p className="mt-0.5 text-xs text-muted-foreground">Orientativa: SpO₂ 45%, ánimo 15%, comidas 15%, nocturno 10%, paseo 15%.</p></div><span className={`size-3 rounded-full ${tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-critical"}`} title="Estado de la puntuación" aria-label="Estado de la puntuación" /></section>;
}

export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { patient: patientParam } = await searchParams;

  const patients = await sql`
    SELECT p.id, p.name, pm.role
    FROM patients p
    JOIN patient_members pm ON pm.patient_id = p.id
    WHERE pm.user_id = ${user.id}
    ORDER BY p.created_at DESC
  `;

  const active = patients.find((p) => p.id === patientParam) ?? patients[0] ?? null;

  const data = active ? await getDashboardData(active.id) : null;
  const healthScore = active ? await computeHealthScore(active.id) : null;
  const today = data?.today ?? {};
  const yesterday = data?.yesterday ?? {};
  const counts = data?.todayCounts ?? {};

  const spo2 = today.spo2?.value ?? null;
  const spo2Yesterday = yesterday.spo2?.value ?? null;
  const spo2Count = counts.spo2 ?? 0;

  const hr = today.hr?.value ?? null;
  const hrYesterday = yesterday.hr?.value ?? null;
  const hrCount = counts.hr ?? 0;

  const temp = today.temp?.value ?? null;
  const tempYesterday = yesterday.temp?.value ?? null;
  const tempCount = counts.temp ?? 0;

  const bp = today.bp_systolic != null ? `${today.bp_systolic.value}/${today.bp_diastolic?.value ?? "–"}` : null;
  const bpYesterday = yesterday.bp_systolic != null ? `${yesterday.bp_systolic.value}/${yesterday.bp_diastolic?.value ?? "–"}` : null;
  const bpCount = Math.max(counts.bp_systolic ?? 0, counts.bp_diastolic ?? 0);

  const nightToday = today.night_events ?? null;
  const nightYesterday = yesterday.night_events ?? null;

  const pooToday = today.poo ?? null;
  const pooYesterday = yesterday.poo ?? null;
  const pooCount = counts.poo ?? 0;
  const mealToday = today.meal_quality?.value ?? null;
  const mealYesterday = yesterday.meal_quality?.value ?? null;

  return (
    <AppShell
      title={active ? active.name : "Resumen del turno"}
      eyebrow="Resumen del turno"
      action={
        active && (
          <Link href={`/patients/${active.id}`} className="flex h-11 items-center justify-center gap-1 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-muted-foreground">
            Ver ficha <ChevronRight className="size-4" />
          </Link>
        )
      }
    >
      {patients.length === 0 ? (
        <div className="space-y-4">
          <EmptyState title="Aún no hay pacientes" detail="Crea el primer perfil para empezar a registrar constantes, notas y citas." />
          <Link href="/patients" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            <UserPlus size={18} /> Crear paciente
          </Link>
        </div>
      ) : (
        <div key={active.id}>
          {patients.length > 1 && (
            <div className="mb-5 grid grid-cols-2 gap-3">
              {patients.map((p) => (
                <Link
                  key={p.id}
                  href={`/?patient=${p.id}`}
                  className={`rounded-2xl border p-3 shadow-sm transition-colors ${p.id === active.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${p.id === active.id ? "bg-primary-foreground/15" : "bg-accent text-primary"}`}>
                      {(p.name ?? "?").charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      <span className={`block text-xs ${p.id === active.id ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{p.id === active.id ? "Paciente activo" : "Cambiar"}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

           <HealthScoreCard score={healthScore} />
          <CaregiverHandoff patientId={active.id} />
           <SpO2Recorder patientId={active.id} today={spo2} yesterday={spo2Yesterday} count={spo2Count} />

          <div className="mt-4 grid grid-cols-3 gap-3">
            <MoodPicker patientId={active.id} today={today.mood?.value ?? null} yesterday={yesterday.mood?.value ?? null} />
            <NightEventsPicker patientId={active.id} today={nightToday} yesterday={nightYesterday} />
            <PooCounter patientId={active.id} today={pooToday} yesterday={pooYesterday} count={pooCount} />
          </div>

          <MedicationChecklist patientId={active.id} />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MealQualityPicker patientId={active.id} today={mealToday} yesterday={mealYesterday} />
            <WalkCheck patientId={active.id} className="mt-0" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <MeasureCard label="Frec." icon={HeartPulse} today={hr} yesterday={hrYesterday} unit="ppm" count={hrCount} />
            <MeasureCard label="Tensión" icon={Activity} today={bp} yesterday={bpYesterday} count={bpCount} />
            <MeasureCard label="Temp." icon={Thermometer} today={temp} yesterday={tempYesterday} unit="°C" count={tempCount} />
          </div>

          <Link href={`/patients/${active.id}/history`} className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-primary shadow-sm">
            <BarChart3 className="size-5" /> Ver evolución
            <ChevronRight className="size-4" />
          </Link>
        </div>
      )}
    </AppShell>
  );
}
