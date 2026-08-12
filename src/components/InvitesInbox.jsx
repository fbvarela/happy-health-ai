"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";

const ROLE_LABELS = { owner: "Propietario", caregiver: "Cuidador", viewer: "Lector" };

/** InvitesInbox — shows the user's pending patient invites with accept/decline. */
export default function InvitesInbox() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    api
      .getInvites()
      .then((rows) => setInvites(rows ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (error) return null;
  if (invites.length === 0) return null;

  const respond = async (id, action) => {
    setBusy(id);
    try {
      await api.respondInvite(id, action);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      if (action === "accept") router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card mt16 border-sun">
      <div className="card-title">Invitaciones</div>
      {invites.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between gap-3 py-3 border-b border-line last:border-0">
          <div className="min-w-0">
            <p className="font-medium text-bark truncate">{inv.patient_name}</p>
            <p className="text-xs text-muted">
              {ROLE_LABELS[inv.role] ?? inv.role} · Te han invitado a cuidar de esta persona
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={busy === inv.id}
              onClick={() => respond(inv.id, "accept")}
            >
              Aceptar
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              disabled={busy === inv.id}
              onClick={() => respond(inv.id, "decline")}
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
