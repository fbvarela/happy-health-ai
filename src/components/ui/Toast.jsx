"use client";

import { useApp } from "@/context/AppContext";

const TONES = {
  info: "var(--leaf)",
  success: "var(--leaf)",
  warn: "var(--sun)",
  error: "#d94f3d",
};

/** Toast stack — bottom center on mobile, bottom right on desktop. */
export default function Toast() {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(72px + env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "min(92vw, 380px)",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: "var(--bark)",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-lg)",
            borderLeft: `4px solid ${TONES[t.type] ?? TONES.info}`,
            fontSize: "0.9rem",
            animation: "slideUp 0.2s",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
