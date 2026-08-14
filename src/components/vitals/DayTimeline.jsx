"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import api from "@/utils/api";
import { METRICS, moodLabel } from "@/lib/metrics";
import Modal from "@/components/ui/Modal";

const TYPE_LABELS = {
  spo2: "SpO₂",
  hr: "Frecuencia",
  bp_systolic: "Tensión",
  bp_diastolic: "Tensión",
  temp: "Temperatura",
  poo: "Deposición",
  mood: "Ánimo",
  night_events: "Nocturno",
};

/**
 * DayTimeline — groups the last N days of vitals by day. Latest value of the
 * day is highlighted; a per-day min/max line is shown per metric (SPEC §4.1).
 */
export default function DayTimeline({ patientId, canEdit }) {
  const [days, setDays] = useState(null);
  const [error, setError] = useState("");
  const [busyDelete, setBusyDelete] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .getVitals(patientId, "?days=7")
      .then((rows) => {
        if (cancelled) return;
        const grouped = {};
        for (const v of rows ?? []) {
          const key = new Date(v.measured_at).toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          (grouped[key] ??= []).push(v);
        }
        setDays(grouped);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setDays([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, reload]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteVital(patientId, confirmDelete);
      setConfirmDelete(null);
      setReload((r) => r + 1);
    } catch (err) {
      setError(err.message);
      setConfirmDelete(null);
    }
  };

  const fmt = (iso) =>
    new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  const display = (v) => {
    if (v.type === "poo" || v.type === "night_events") return `${v.count ?? v.value}×`;
    if (v.type === "mood") return `${v.value} (${moodLabel(v.value) ?? ""})`;
    if (v.type === "bp_systolic") return `${v.value}/–`;
    if (v.type === "bp_diastolic") return `–/${v.value}`;
    return `${v.value}${METRICS[v.type]?.unit ?? ""}`;
  };

  const minMax = (group) => {
    // Group by metric type, show min–max where multiple readings exist
    const byType = {};
    for (const v of group) {
      if (v.type === "poo" || v.type === "bp_diastolic" || v.type === "mood" || v.type === "night_events") continue;
      const key = v.type === "bp_systolic" ? "Tensión (sys)" : TYPE_LABELS[v.type];
      (byType[key] ??= []).push(Number(v.value));
    }
    return Object.entries(byType)
      .map(([label, arr]) =>
        arr.length > 1
          ? `${label}: ${Math.min(...arr)}–${Math.max(...arr)}`
          : `${label}: ${arr[0]}`
      )
      .join(" · ");
  };

  if (days === null) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-row items-center justify-between">
        <div className="text-base font-semibold">Historial reciente</div>
        <Link href={`/patients/${patientId}/history`} className="text-sm text-muted-foreground hover:text-foreground">
          Ver tendencias →
        </Link>
      </div>

      {error && <p className="mt2 text-sm text-destructive">{error}</p>}

      {Object.keys(days).length === 0 ? (
        <p className="mt4 text-sm text-muted-foreground">
          Todavía no hay registros. Usa <b>Registrar</b> para añadir el primero.
        </p>
      ) : (
        <div className="mt4 space-y-5">
          {Object.entries(days).map(([day, vitals]) => {
            const latest = vitals[0]; // sorted DESC
            const isToday = new Date(vitals[0].measured_at).toDateString() === new Date().toDateString();
            return (
              <div key={day}>
                <div className="mb-2 flex flex-row items-center justify-between">
                  <p className={`text-sm font-semibold ${isToday ? "text-foreground" : "text-muted-foreground"}`}>
                    {day}
                    {isToday ? " · Hoy" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{minMax(vitals)}</p>
                </div>
                <ul className="space-y-1">
                  {vitals.map((v) => (
                    <li
                      key={v.id}
                      className={`flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2 ${
                        v.id === latest.id
                          ? "border-primary bg-muted"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {display(v)}
                          <span className="font-normal text-muted-foreground"> · {TYPE_LABELS[v.type]}</span>
                        </p>
                        {v.device || v.notes ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {v.device ? `${v.device}` : ""}
                            {v.device && v.notes ? " — " : ""}
                            {v.notes ? v.notes : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-row items-center gap-3">
                        <span className="text-xs text-muted-foreground">{fmt(v.measured_at)}</span>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              className="flex items-center justify-center text-destructive hover:bg-muted"
                              onClick={() => setConfirmDelete(v.id)}
                              aria-label="Eliminar registro"
                            >
                              <Trash2 size={14} />
                            </button>
                            <Modal
                              open={confirmDelete === v.id}
                              onClose={() => setConfirmDelete(null)}
                              title="Eliminar registro"
                            >
                              <p className="mb-4 text-muted-foreground">
                                ¿Seguro que quieres eliminar este registro? Se quitará del historial.
                              </p>
                              <div className="flex gap-3">
                                <button type="button" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 text-sm font-semibold text-destructive" onClick={handleDelete}>
                                  Eliminar
                                </button>
                                <button type="button" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setConfirmDelete(null)}>
                                  Cancelar
                                </button>
                              </div>
                            </Modal>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
