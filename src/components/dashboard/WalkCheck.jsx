"use client";

import { useEffect, useState } from "react";
import { Footprints } from "lucide-react";
import api from "@/utils/api";

export default function WalkCheck({ patientId }) {
  const [record, setRecord] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getVitals(patientId, "?days=1").then((rows) => {
      setRecord((rows ?? []).find((row) => row.type === "walk") ?? null);
    }).catch(() => {});
  }, [patientId]);

  const toggle = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (record) {
        await api.deleteVital(patientId, record.id);
        setRecord(null);
      } else {
        const response = await api.createVital(patientId, { type: "walk", value: 1 });
        setRecord(response?.vitals?.[0] ?? { type: "walk", value: 1 });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <button type="button" onClick={toggle} disabled={saving} className="mt-4 flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm disabled:opacity-50">
      <span className={`flex size-9 items-center justify-center rounded-xl ${record ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}><Footprints className="size-5" /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Paseo</span><span className="block text-xs text-muted-foreground">¿Ha salido a pasear hoy?</span></span>
      <span className={`flex size-7 items-center justify-center rounded-lg border text-sm font-bold ${record ? "border-success bg-success text-success-foreground" : "border-input bg-background text-transparent"}`}>✓</span>
    </button>
  );
}
