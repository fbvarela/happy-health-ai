"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, HeartPulse, CalendarDays, UserPlus } from "lucide-react";
import { AppShell, EmptyState } from "@/components/app-shell";
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

  if (items === null) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <AppShell
      title="Notificaciones"
      eyebrow="Alertas de salud, citas e invitaciones"
      action={
        unread > 0 && (
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
            onClick={markAll}
          >
            <CheckCheck size={16} /> Marcar todo
          </button>
        )
      }
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      {items.length === 0 ? (
        <div className="mt-2">
          <EmptyState title="No hay notificaciones todavía." detail="Cuando haya alertas de salud, citas o invitaciones las verás aquí." />
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.system;
            const Icon = meta.icon;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  className={`w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors flex items-start gap-3 ${
                    n.read_at ? "border-border opacity-70" : "border-primary"
                  }`}
                  onClick={() => !n.read_at && markRead(n.id)}
                >
                  <span className="mt-0.5 shrink-0">
                    <Icon size={20} style={{ color: meta.color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-row items-center justify-between gap-2">
                      <p className={`text-sm ${n.read_at ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
                        {n.title}
                      </p>
                      {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{fmt(n.created_at)}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
