"use client";

import { useState } from "react";
import { LineChart, Minus, Plus } from "lucide-react";
import VitalCharts from "@/components/vitals/VitalCharts";

/**
 * DashboardCharts — toggle (+/−) to show/hide the measures charts
 * (day/week/month) directly on the dashboard.
 */
export default function DashboardCharts({ patientId }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt16">
      <button
        type="button"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)] border border-line text-bark hover:border-sun transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Ocultar gráficas" : "Mostrar gráficas"}
      >
        {open ? <Minus size={20} /> : <LineChart size={20} />}
      </button>

      {open && (
        <div className="mt8">
          <VitalCharts patientId={patientId} simple />
        </div>
      )}
    </div>
  );
}
