"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/utils/api";
import { METRICS } from "@/lib/vitals";
import Modal from "@/components/ui/Modal";

const TYPE_LABELS = {
  spo2: "SpO₂",
  hr: "Frecuencia",
  bp_systolic: "Tensión",
  bp_diastolic: "Tensión",
  temp: "Temperatura",
  poo: "Deposición",
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
    if (v.type === "poo") return `${v.count ?? v.value}×`;
    if (v.type === "bp_systolic") return `${v.value}/–`;
    if (v.type === "bp_diastolic") return `–/${v.value}`;
    return `${v.value}${METRICS[v.type]?.unit ?? ""}`;
  };

  const minMax = (group) => {
    // Group by metric type, show min–max where multiple readings exist
    const byType = {};
    for (const v of group) {
      if (v.type === "poo" || v.type === "bp_diastolic") continue;
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

  if (days === null) return <p className="text-muted">Cargando…</p>;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="card-title">Historial reciente</div>
        <Link href={`/patients/${patientId}/history`} className="text-sm text-muted hover:text-bark">
          Ver tendencias →
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm mt2">{error}</p>}

      {Object.keys(days).length === 0 ? (
        <p className="dog-meta mt4">
          Todavía no hay registros. Usa <b>Registrar</b> para añadir el primero.
        </p>
      ) : (
        <div className="mt4 space-y-5">
          {Object.entries(days).map(([day, vitals]) => {
            const latest = vitals[0]; // sorted DESC
            const isToday = new Date(vitals[0].measured_at).toDateString() === new Date().toDateString();
            return (
              <div key={day}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm font-semibold ${isToday ? "text-bark" : "text-muted"}`}>
                    {day}
                    {isToday ? " · Hoy" : ""}
                  </p>
                  <p className="text-xs text-muted">{minMax(vitals)}</p>
                </div>
                <ul className="space-y-1">
                  {vitals.map((v) => (
                    <li
                      key={v.id}
                      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-[10px] border ${
                        v.id === latest.id
                          ? "border-sun bg-[var(--bg)]"
                          : "border-line bg-[var(--surface)]"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-bark text-sm">
                          {display(v)}
                          <span className="text-muted font-normal"> · {TYPE_LABELS[v.type]}</span>
                        </p>
                        {v.device || v.notes ? (
                          <p className="text-xs text-muted truncate">
                            {v.device ? `${v.device}` : ""}
                            {v.device && v.notes ? " — " : ""}
                            {v.notes ? v.notes : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted">{fmt(v.measured_at)}</span>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              className="text-xs text-red-600 hover:underline"
                              onClick={() => setConfirmDelete(v.id)}
                            >
                              Eliminar
                            </button>
                            <Modal
                              open={confirmDelete === v.id}
                              onClose={() => setConfirmDelete(null)}
                              title="Eliminar registro"
                            >
                              <p className="text-muted mb-4">
                                ¿Seguro que quieres eliminar este registro? Se quitará del historial.
                              </p>
                              <div className="flex gap-3">
                                <button type="button" className="btn btn-danger flex-1 justify-center" onClick={handleDelete}>
                                  Eliminar
                                </button>
                                <button type="button" className="btn btn-ghost flex-1 justify-center" onClick={() => setConfirmDelete(null)}>
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
