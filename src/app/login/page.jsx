"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // null | "sent" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    const result = await login(email);
    if (result.success) {
      setStatus("sent");
    } else {
      setErrorMsg(result.error);
      setStatus("error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-5">
      <div className="w-full max-w-sm bg-surface rounded-[14px] border-[1.5px] border-line shadow-card p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">💚</div>
          <h1 className="font-serif text-[1.8rem] text-bark mb-1">Happy Health</h1>
          <p className="text-muted text-sm">
            Sign in to keep track of the people you care for
          </p>
        </div>

        {status === "sent" ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">📬</div>
            <p className="text-bark font-semibold mb-2">Check your email</p>
            <p className="text-muted text-sm">
              We sent a magic link to {email}. Click it to sign in (expires in 1
              hour).
            </p>
            <button
              type="button"
              className="btn btn-ghost mt-4"
              onClick={() => { setStatus(null); setEmail(""); }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            {status === "error" && (
              <p className="text-red-600 text-sm mb-4">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full justify-center"
              disabled={loading}
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}

        <p className="text-xs text-muted mt-6 text-center">
          This app stores health information. We never share it and never show
          it publicly. Not a medical device — always consult a doctor for
          medical decisions.
        </p>
      </div>
    </div>
  );
}
