"use client";

import { useRef, useState } from "react";
import { MessageSquareText, Send, X } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { useApp } from "@/context/AppContext";

const SUGGESTED = [
  "¿Qué significa una saturación del 91%?",
  "¿Cómo ha evolucionado la frecuencia cardíaca esta semana?",
  "Ayúdame a preparar preguntas para el médico",
  "¿Por qué el score de hoy es más bajo que ayer?",
];

/** v7 UIMessage: text lives in parts[], content may be empty. */
function messageText(m) {
  if (typeof m?.content === "string" && m.content) return m.content;
  if (Array.isArray(m?.parts)) {
    return m.parts
      .filter((p) => p?.type === "text" && typeof p.text === "string")
      .map((p) => p.text)
      .join("");
  }
  return "";
}

/**
 * ChatWidget — floating assistant bubble (bottom-right) opening a chat modal.
 * Context = active patient (SPEC §4.10). ES-only, no-medical-advice guardrail
 * lives in the system prompt (lib/chat.js).
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [position, setPosition] = useState(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const { activePatientId } = useApp();

  const { messages, sendMessage, status, error } = useChat({
    api: "/api/chat",
    body: { patientId: activePatientId ?? null },
  });

  const send = (text) => {
    const t = (text ?? draft).trim();
    if (!t || status === "streaming") return;
    sendMessage?.({ text: t });
    setDraft("");
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-foreground/30" onClick={() => setOpen(false)} />}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[min(70vh,560px)] w-[min(calc(100vw-2rem),380px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" role="dialog" aria-label="Asistente de salud">
          <div className="flex items-center justify-between border-b border-border bg-primary p-4 text-primary-foreground">
            <div className="flex flex-row items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/15">AI</div>
              <div>
                 <p className="text-sm font-semibold">Asistente de salud</p>
                 <p className="text-xs text-primary-foreground/75">Información, nunca consejo médico</p>
              </div>
            </div>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-xl text-primary-foreground hover:bg-primary-foreground/10"
              aria-label="Cerrar chat"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div>
                {!activePatientId && (
                    <p className="mb-2 text-center text-xs text-warning-foreground">
                    ⚠️ Selecciona un paciente para que el asistente use sus datos.
                  </p>
                )}
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Pregunta sobre las constantes, notas y el estado de tus pacientes.
                </p>
                <div className="space-y-2">
                  {SUGGESTED.map((q) => (
                    <button key={q} type="button" className="block w-full rounded-xl border border-border bg-background p-3 text-left text-sm text-foreground hover:bg-muted" onClick={() => send(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-xl p-3 text-sm leading-6 ${m.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-muted text-foreground"}`}
                  >
                    {m.role === "user" ? (
                      messageText(m)
                    ) : (
                      <ReactMarkdown components={{ p: "p", ul: "ul", ol: "ol", code: "code" }}>
                        {messageText(m)}
                      </ReactMarkdown>
                    )}
                  </div>
                ))}
                {status === "streaming" && (
                  <div className="mr-8 rounded-xl bg-muted p-3 text-sm text-muted-foreground">Escribiendo…</div>
                )}
                 {error && <p className="text-xs text-destructive">{error.message}</p>}
              </div>
            )}
          </div>

          <form
            className="flex gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe tu pregunta…"
              aria-label="Mensaje"
            />
            <button
              type="submit"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
              aria-label="Enviar"
              disabled={status === "streaming" || !draft.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`fixed z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ${open ? "rotate-90" : ""} ${position ? "" : "bottom-20 right-4"}`}
        style={position ? { left: position.left, top: position.top, touchAction: "none" } : { touchAction: "none" }}
        aria-label="Abrir asistente"
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          dragRef.current = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, startX: event.clientX, startY: event.clientY };
          movedRef.current = false;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return;
          const left = Math.max(8, Math.min(window.innerWidth - 64, event.clientX - dragRef.current.offsetX));
          const top = Math.max(8, Math.min(window.innerHeight - 64, event.clientY - dragRef.current.offsetY));
          if (Math.abs(event.clientX - dragRef.current.startX) > 3 || Math.abs(event.clientY - dragRef.current.startY) > 3) movedRef.current = true;
          setPosition({ left, top });
        }}
        onPointerUp={(event) => {
          dragRef.current = null;
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
        onClick={() => {
          if (movedRef.current) { movedRef.current = false; return; }
          setOpen((v) => !v);
        }}
      >
        {open ? <X size={26} /> : <MessageSquareText size={26} />}
      </button>
    </>
  );
}
