"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const TEST_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TEST_LOGIN === "true";
const TEST_LOGIN_EMAIL = process.env.NEXT_PUBLIC_TEST_LOGIN_EMAIL ?? "";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState("");

  const handleGoogle = () => {
    setLoading(true);
    // Full-page navigation: the API route performs the server-side OAuth 307
    // redirect to Google — client-side routing cannot follow that flow.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/api/auth/google");
  };

  const handleTestLogin = async () => {
    setTestLoading(true);
    setTestError("");
    try {
      const res = await fetch("/api/auth/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: TEST_LOGIN_EMAIL }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Test login falló");
      }
      // Full page load so the freshly-set session cookie is applied on the
      // server render (router.push races the Set-Cookie).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/dashboard");
    } catch (err) {
      setTestError(err.message);
      setTestLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-5">
      <div className="w-full max-w-sm bg-surface rounded-[14px] border-[1.5px] border-line shadow-card p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">💚</div>
          <h1 className="font-serif text-[1.8rem] text-bark mb-1">Happy Health</h1>
          <p className="text-muted text-sm">
            Lleva el control de la salud de tus mayores
          </p>
        </div>

        {error === "signin_failed" && (
          <p className="text-red-600 text-sm mb-4 text-center">
            No se pudo iniciar sesión. Inténtalo de nuevo.
          </p>
        )}
        {error === "denied" && (
          <p className="text-red-600 text-sm mb-4 text-center">
            Tu cuenta aún no está aprobada. Contacta con el administrador.
          </p>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="btn btn-primary w-full justify-center text-[1.05rem] py-4"
        >
          {loading ? (
            "Conectando…"
          ) : (
            <>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.5 35.4 44 30.1 44 24c0-1.3-.1-2.6-.4-3.9z"/>
              </svg>
              Continuar con Google
            </>
          )}
        </button>

        {TEST_LOGIN_ENABLED && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleTestLogin}
              disabled={testLoading}
              className="btn btn-ghost w-full justify-center"
            >
              {testLoading ? "Entrando…" : "Test login (dev)"}
            </button>
            {testError && <p className="text-red-600 text-sm mt-2 text-center">{testError}</p>}
          </div>
        )}

        <p className="text-xs text-muted mt-6 text-center">
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
