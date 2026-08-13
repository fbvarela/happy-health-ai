"use client";

import { useState } from "react";
import { LineChart, Minus, Plus } from "lucide-react";
import VitalCharts from "@/components/vitals/VitalCharts";

/**
 * DashboardCharts — toggle to show/hide the measures charts (day/week/month)
 * directly on the dashboard. Accessible bordered button (≥44px target).
 */
export default function DashboardCharts({ patientId }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt16">
      <button
        type="button"
        className="flex flex-row items-center justify-center w-11 h-11 min-h-[44px] rounded-[12px] bg-[var(--surface)] border-2 border-[var(--bark)] text-bark hover:bg-[var(--bg)] transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Ocultar gráficas" : "Mostrar gráficas"}
        aria-controls="dashboard-charts"
      >
        {open ? <Minus size={20} /> : <LineChart size={20} />}
      </button>

      {open && (
        <div id="dashboard-charts" className="mt8">
          <VitalCharts patientId={patientId} simple />
        </div>
      )}
    </div>
  );
}
