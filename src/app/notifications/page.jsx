"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, HeartPulse, CalendarDays, UserPlus } from "lucide-react";
import api from "@/utils/api";

const TYPE_META = {
  vital_alert: { icon: HeartPulse, label: "Alerta de salud", color: "#d94f3d" },
  appointment: { icon: CalendarDays, label: "Cita", color: "#5b7fa6" },
  share_invite: { icon: UserPlus, label: "Invitación", color: "#4a7c59" },
  system: { icon: Bell, label: "Sistema", color: "#8a7a66" },
};

/**
 * NotificationsPage — in-app notification center (D5: no web push in v1).
 */
export default function NotificationsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    api
      .getNotifications()
      .then((rows) => setItems(rows ?? []))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    let cancelled = false;
    api
      .getNotifications()
      .then((rows) => { if (!cancelled) setItems(rows ?? []); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    } catch { /* ignore */ }
  };

  const markAll = async () => {
    try {
      await api.markAllRead();
      setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    } catch { /* ignore */ }
  };

  const fmt = (iso) =>
    new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  if (items === null) return <p className="text-muted">Cargando…</p>;

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="page">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1 className="page-title">Notificaciones</h1>
          <p className="page-sub">
            Alertas de salud, citas e invitaciones.
          </p>
        </div>
        {unread > 0 && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={markAll}>
            <CheckCheck size={16} className="mr-1" /> Marcar todo
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mt4">{error}</p>}

      {items.length === 0 ? (
        <div className="card mt16">
          <div className="empty-state">
            <div className="empty-icon"><Bell size={28} /></div>
            <p>No hay notificaciones todavía.</p>
          </div>
        </div>
      ) : (
        <ul className="mt16 space-y-2">
          {items.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.system;
            const Icon = meta.icon;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  className={`w-full text-left bg-surface rounded-[14px] border p-4 flex items-start gap-3 ${
                    n.read_at ? "border-line opacity-70" : "border-sun"
                  }`}
                  onClick={() => !n.read_at && markRead(n.id)}
                >
                  <span className="mt-0.5 shrink-0">
                    <Icon size={20} style={{ color: meta.color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-row items-center justify-between gap-2">
                      <p className={`text-sm ${n.read_at ? "text-muted" : "text-bark font-semibold"}`}>
                        {n.title}
                      </p>
                      {!n.read_at && <span className="w-2 h-2 rounded-full bg-[var(--sun)] shrink-0" />}
                    </div>
                    {n.body && <p className="text-sm text-muted mt-0.5">{n.body}</p>}
                    <p className="text-xs text-muted mt-1">{fmt(n.created_at)}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
