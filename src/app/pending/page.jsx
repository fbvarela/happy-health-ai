"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PendingPage() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mb-2 text-5xl">⏳</div>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          Cuenta pendiente de aprobación
        </h1>
        <p className="mb-6 text-sm leading-6 text-muted-foreground">
          {currentUser?.email ? (
            <>
              <span className="font-semibold text-foreground">{currentUser.email}</span>{" "}
              todavía no está aprobada. Un administrador debe revisar tu cuenta
              antes de que puedas usarla. Te avisaremos cuando esté lista.
            </>
          ) : (
            "Un administrador debe revisar tu cuenta antes de que puedas usarla."
          )}
        </p>
        <button
          type="button"
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors active:bg-accent"
          onClick={logout}
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
