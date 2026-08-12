"use client";

import { useAuth } from "@/context/AuthContext";

export default function PendingPage() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-5">
      <div className="w-full max-w-sm bg-surface rounded-[14px] border-[1.5px] border-line shadow-card p-8 text-center">
        <div className="text-5xl mb-2">⏳</div>
        <h1 className="font-serif text-[1.6rem] text-bark mb-2">
          Cuenta pendiente de aprobación
        </h1>
        <p className="text-muted text-sm mb-6">
          {currentUser?.email ? (
            <>
              <span className="font-semibold text-bark">{currentUser.email}</span>{" "}
              todavía no está aprobada. Un administrador debe revisar tu cuenta
              antes de que puedas usarla. Te avisaremos cuando esté lista.
            </>
          ) : (
            "Un administrador debe revisar tu cuenta antes de que puedas usarla."
          )}
        </p>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
