"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Handshake } from "lucide-react";
import api from "@/utils/api";

export default function CaregiverHandoff({ patientId }) {
  const [data, setData] = useState(null);
  const [targetId, setTargetId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.getHandoffs(patientId).then((result) => {
      if (!cancelled) setData(result);
    }).catch((err) => {
      if (!cancelled) setError(err.message);
    });
    return () => { cancelled = true; };
  }, [patientId]);

  const transfer = async (toUserId) => {
    if (!toUserId || saving) return;
    setSaving(true);
    setError("");
    try {
      await api.createHandoff(patientId, { toUserId });
      setData(await api.getHandoffs(patientId));
      setTargetId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!data) return null;
  const otherCaregivers = data.caregivers.filter((caregiver) => caregiver.id !== data.current?.id);
  const currentName = data.current?.name || data.current?.email || "Sin asignar";
  const isCurrentUser = data.current?.id === data.currentUserId;

  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm" aria-labelledby="handoff-heading">
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Handshake className="size-5" /></span>
        <div className="min-w-0"><h2 id="handoff-heading" className="text-base font-semibold">Cuidador de hoy</h2><p className="mt-0.5 truncate text-lg font-semibold leading-tight text-foreground sm:text-xl">{currentName}</p></div>
      </div>
      {data.canTransfer && !isCurrentUser && data.currentUserId && <button type="button" onClick={() => transfer(data.currentUserId)} disabled={saving} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-primary disabled:opacity-50"><Handshake className="size-4" /> Tomar el relevo</button>}
      {data.canTransfer && otherCaregivers.length > 0 && (
        <div className="mt-3 flex gap-2">
          <select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring" aria-label="Transferir a cuidador">
            <option value="">Transferir a…</option>
            {otherCaregivers.map((caregiver) => <option key={caregiver.id} value={caregiver.id}>{caregiver.name || caregiver.email}</option>)}
          </select>
          <button type="button" onClick={() => transfer(targetId)} disabled={!targetId || saving} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50" aria-label="Transferir cuidado"><ArrowRight className="size-5" /></button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {data.history.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Hoy: {data.history.slice().reverse().map((handoff) => `${handoff.from_name || "Cuidador"} → ${handoff.to_name || "cuidador"}`).join(" · ")}</p>}
    </section>
  );
}
