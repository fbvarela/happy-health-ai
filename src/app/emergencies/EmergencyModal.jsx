"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import api from "@/utils/api";

export default function EmergencyModal({ open, onClose, patientId }) {
  const [emergencyType, setEmergencyType] = useState("");
  const [details, setDetails] = useState("");
  const [resolved, setResolved] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const emergencyTypes = [
    { value: "caída", label: "Caída" },
    { value: "desmayo", label: "Desmayo" },
    { value: "ahogamiento", label: "Ahogamiento" },
    { value: "infarto", label: "Infarto" },
    { value: "dolor agudo", label: "Dolor agudo" },
    { value: "otro", label: "Otro" },
  ];

  const handleClose = () => {
    setError("");
    setSuccess("");
    setSubmitting(false);
    // Reset form
    setEmergencyType("");
    setDetails("");
    setResolved(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      // Validate
      if (!emergencyType) {
        throw new Error("Seleccione un tipo de emergencia");
      }

      // Create emergency
      const emergencyData = {
        type: emergencyType,
        details: details.trim() || null,
        resolved: resolved,
      };

      await api.createEmergency(patientId, emergencyData);

      // Success
      setSuccess("Emergencia registrada correctamente");
      setSubmitting(false);

      // Close modal after a brief moment to show success message
      setTimeout(() => {
        handleClose();
        // Refresh the emergencies list by triggering a router refresh
        router.refresh();
      }, 1500);

      // Initiate call to 112 (emergency number)
      // This uses the tel: scheme which will trigger the native dialer
      const callLink = document.createElement("a");
      callLink.href = "tel:112";
      callLink.style.display = "none";
      document.body.appendChild(callLink);
      callLink.click();
      document.body.removeChild(callLink);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/30" onClick={handleClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Registrar Emergencia</h2>
            <button type="button" onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/50" aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-semibold">Tipo de emergencia *</label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring disabled:opacity-50"
                disabled={submitting}
              >
                <option value="">Seleccionar tipo...</option>
                {emergencyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {submitting && <p className="mt-1 text-xs text-muted-foreground">Guardando...</p>}
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold">Detalles adicionales</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describa cualquier información adicional sobre la emergencia..."
                className="block w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring disabled:opacity-50"
                disabled={submitting}
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="resolved-checkbox"
                checked={resolved}
                onChange={(e) => setResolved(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary disabled:opacity-50"
                disabled={submitting}
              />
              <label htmlFor="resolved-checkbox" className="text-sm font-medium text-foreground">
                Marcar como resuelta
              </label>
            </div>

            {error && (
              <p className="mt-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {success && (
              <p className="mt-2 text-sm text-success">
                {success}
              </p>
            )}

            <div className="mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                className="flex w-full justify-center rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent/50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex w-full justify-center rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50"
                disabled={submitting || !emergencyType}
              >
                {submitting ? "Registrando..." : "Registrar y Llamar a 112"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}