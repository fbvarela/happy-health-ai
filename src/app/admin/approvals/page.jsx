"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, EmptyState } from "@/components/app-shell";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";

function ApprovalsList({ adminEmail }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    api
      .getPendingApprovals()
      .then(setPending)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const decide = async (userId, action) => {
    setBusy(userId);
    setError("");
    try {
      await api.decideApproval(userId, action);
      setPending((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {pending.length === 0 ? (
        <EmptyState title="No hay cuentas pendientes de revisión." detail="Cuando alguien solicite acceso verás aquí su cuenta." />
      ) : (
        pending.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{u.name || u.email}</p>
              <p className="truncate text-sm text-muted-foreground">{u.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">Registrado el {formatDate(u.created_at)}</p>
            </div>
            <div className="flex shrink-0 flex-row gap-2">
              <button
                type="button"
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                disabled={busy === u.id}
                onClick={() => decide(u.id, "approve")}
              >
                Aprobar
              </button>
              <button
                type="button"
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-destructive disabled:opacity-50"
                disabled={busy === u.id}
                onClick={() => decide(u.id, "deny")}
              >
                Rechazar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function AdminApprovalsPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [loading, currentUser, router]);

  if (loading || currentUser?.role !== "admin") return null;

  return (
    <AppShell title="Aprobaciones" eyebrow="Cuentas que esperan acceso a la aplicación">
      <ApprovalsList adminEmail={currentUser?.email} />
    </AppShell>
  );
}
