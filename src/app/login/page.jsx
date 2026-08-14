"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const handleGoogle = () => {
    setLoading(true);
    // Full-page navigation: the API route performs the server-side OAuth 307
    // redirect to Google — client-side routing cannot follow that flow.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/api/auth/google");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 text-5xl">💚</div>
          <h1 className="mb-1 text-3xl font-semibold tracking-tight">Happy Health</h1>
          <p className="text-sm text-muted-foreground">
            Lleva el control de la salud de tus mayores
          </p>
        </div>

        {error === "signin_failed" && (
          <p className="mb-4 text-center text-sm text-destructive">
            No se pudo iniciar sesión. Inténtalo de nuevo.
          </p>
        )}
        {error === "denied" && (
          <p className="mb-4 text-center text-sm text-destructive">
            Tu cuenta aún no está aprobada. Contacta con el administrador.
          </p>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary px-4 text-[1.05rem] font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? (
            "Conectando…"
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.5 35.4 44 30.1 44 24c0-1.3-.1-2.6-.4-3.9z"/>
              </svg>
              Continuar con Google
            </>
          )}
        </button>

        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
          Esta aplicación guarda información de salud. Nunca la compartimos y
          nunca se muestra públicamente. No es un dispositivo médico: consulta
          siempre con un médico para las decisiones de salud.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
