"use client";

import { useState } from "react";
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

/**
 * ChatWidget — floating assistant bubble (bottom-right) opening a chat modal.
 * Context = active patient (SPEC §4.10). ES-only, no-medical-advice guardrail
 * lives in the system prompt (lib/chat.js).
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { activePatientId } = useApp();

  const { messages, input, handleInputChange, handleSubmit, status, error, setInput } = useChat({
    api: "/api/chat",
    body: { patientId: activePatientId ?? null },
  });

  const sendSuggested = (q) => {
    // useChat reads input from state; flush the update before submitting
    setInput(q);
    requestAnimationFrame(() => handleSubmit(new Event("submit")));
  };

  return (
    <>
      {open && <div className="chat-widget-overlay" onClick={() => setOpen(false)} />}
      {open && (
        <div className="chat-widget-panel" role="dialog" aria-label="Asistente de salud">
          <div className="chat-widget-header">
            <div className="flex items-center gap-2">
              <div className="chat-widget-avatar">💬</div>
              <div>
                <p className="font-semibold text-bark text-sm">Asistente de salud</p>
                <p className="text-xs text-muted">Información, nunca consejo médico</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              aria-label="Cerrar chat"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="chat-widget-body">
            {messages.length === 0 ? (
              <div className="chat-widget-empty">
                {!activePatientId && (
                  <p className="text-xs text-muted text-center mb-2">
                    ⚠️ Selecciona un paciente para que el asistente use sus datos.
                  </p>
                )}
                <p className="text-muted text-sm text-center mb-4">
                  Pregunta sobre las constantes, notas y el estado de tus pacientes.
                </p>
                <div className="space-y-2">
                  {SUGGESTED.map((q) => (
                    <button key={q} type="button" className="suggested-chip" onClick={() => sendSuggested(q)}>
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
                    className={`chat-widget-msg ${m.role === "user" ? "chat-widget-msg--user" : "chat-widget-msg--ai"}`}
                  >
                    {m.role === "user" ? (
                      m.content
                    ) : (
                      <ReactMarkdown components={{ p: "p", ul: "ul", ol: "ol", code: "code" }}>
                        {m.content}
                      </ReactMarkdown>
                    )}
                  </div>
                ))}
                {status === "streaming" && (
                  <div className="chat-widget-msg chat-widget-msg--ai">Escribiendo…</div>
                )}
                {error && <p className="text-red-600 text-xs">{error.message}</p>}
              </div>
            )}
          </div>

          <form
            className="chat-widget-inputbar"
            onSubmit={handleSubmit}
          >
            <input
              className="input"
              value={input ?? ""}
              onChange={handleInputChange}
              placeholder="Escribe tu pregunta…"
              aria-label="Mensaje"
            />
            <button
              type="submit"
              className="btn btn-primary shrink-0"
              aria-label="Enviar"
              disabled={status === "streaming" || !input?.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`chat-widget-bubble ${open ? "chat-widget-bubble--open" : ""}`}
        aria-label="Abrir asistente"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={26} /> : <MessageSquareText size={26} />}
      </button>
    </>
  );
}
