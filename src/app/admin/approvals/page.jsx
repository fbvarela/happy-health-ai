"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  if (loading) return <p className="text-muted">Cargando…</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {pending.length === 0 ? (
        <div className="bg-surface rounded-[14px] border-[1.5px] border-line p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-muted">No hay cuentas pendientes de revisión.</p>
        </div>
      ) : (
        pending.map((u) => (
          <div
            key={u.id}
            className="bg-surface rounded-[14px] border-[1.5px] border-line p-5 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="font-semibold text-bark truncate">{u.name || u.email}</p>
              <p className="text-muted text-sm truncate">{u.email}</p>
              <p className="text-xs text-muted mt-1">Registrado el {formatDate(u.created_at)}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy === u.id}
                onClick={() => decide(u.id, "approve")}
              >
                Aprobar
              </button>
              <button
                type="button"
                className="btn btn-danger"
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
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="font-serif text-[1.6rem] text-bark mb-1">Aprobaciones</h1>
      <p className="text-muted text-sm mb-6">
        Revisa las cuentas que esperan acceso a la aplicación.
      </p>
      <ApprovalsList adminEmail={currentUser?.email} />
    </div>
  );
}
