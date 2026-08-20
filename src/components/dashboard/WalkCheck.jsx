"use client";

import { useEffect, useState } from "react";
import { Footprints } from "lucide-react";
import api from "@/utils/api";
import { getWalkCalendarWindow, splitWalkRows } from "@/lib/walk-check";
import { useApp } from "@/context/AppContext";

export default function WalkCheck({ patientId, className = "mt-4" }) {
  const { refreshPatientData } = useApp();
  const [record, setRecord] = useState(null);
  const [yesterdayWalked, setYesterdayWalked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { from, to } = getWalkCalendarWindow();
    api.getVitals(patientId, `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then((rows) => {
      const result = splitWalkRows(rows);
      setRecord(result.todayRecord);
      setYesterdayWalked(result.yesterdayWalked);
    }).catch(() => {});
  }, [patientId]);

  const toggle = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (record) {
        await api.deleteVital(patientId, record.id);
        setRecord(null);
        refreshPatientData();
      } else {
        const response = await api.createVital(patientId, { type: "walk", value: 1 });
        setRecord(response?.vitals?.[0] ?? { type: "walk", value: 1 });
        refreshPatientData();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <button type="button" onClick={toggle} disabled={saving} className={`${className} flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm disabled:opacity-50`}>
      <span className={`flex size-9 items-center justify-center rounded-xl ${record ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}><Footprints className="size-5" /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Paseo {record ? "Sí" : "No"}</span><span className="block text-[11px] text-muted-foreground">Ayer: {yesterdayWalked ? "Sí" : "No"}</span></span>
      <span className={`flex size-7 items-center justify-center rounded-lg border text-sm font-bold ${record ? "border-success bg-success text-success-foreground" : "border-input bg-background text-transparent"}`}>✓</span>
    </button>
  );
}
