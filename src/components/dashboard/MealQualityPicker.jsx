"use client";

import { useState } from "react";
import { Utensils } from "lucide-react";
import api from "@/utils/api";
import { useApp } from "@/context/AppContext";

const LEVELS = [
  { value: 3, label: "Bien", tone: "green" },
  { value: 2, label: "Regular", tone: "orange" },
  { value: 1, label: "Poco", tone: "red" },
];

const COLORS = {
  green: { dot: "bg-success", selected: "border-success bg-success/10 text-success" },
  orange: { dot: "bg-warning", selected: "border-warning bg-warning/15 text-warning" },
  red: { dot: "bg-critical", selected: "border-critical bg-critical/10 text-critical" },
};

export default function MealQualityPicker({ patientId, today, yesterday }) {
  const { refreshPatientData } = useApp();
  const [value, setValue] = useState(today ?? null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const current = LEVELS.find((level) => level.value === Number(value));
  const previous = LEVELS.find((level) => level.value === Number(yesterday));

  const choose = async (next) => {
    if (saving) return;
    setSaving(true);
    try {
      await api.createVital(patientId, { type: "meal_quality", value: next });
      setValue(next);
      setOpen(false);
      refreshPatientData();
    } finally {
      setSaving(false);
    }
  };

  return <section className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-accent text-primary"><Utensils className="size-4" /></span><p className="text-sm font-semibold">Comidas</p></div><p className="mt-3 flex items-center gap-2 text-2xl font-semibold">{current && <span className={`size-3 rounded-full ${COLORS[current.tone].dot}`} />}{current?.label ?? "–"}</p><p className="mt-0.5 text-xs text-muted-foreground">Ayer {previous?.label ?? "–"}</p>{!open ? <button type="button" onClick={() => setOpen(true)} className="mt-3 flex min-h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-primary">Registrar</button> : <div className="mt-3 grid grid-cols-3 gap-1.5">{LEVELS.map((level) => <button key={level.value} type="button" disabled={saving} onClick={() => choose(level.value)} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-[11px] font-semibold disabled:opacity-50 ${value === level.value ? COLORS[level.tone].selected : "border-border bg-background text-muted-foreground"}`}><span className={`size-3 rounded-full ${COLORS[level.tone].dot}`} />{level.label}</button>)}</div>}</section>;
}
