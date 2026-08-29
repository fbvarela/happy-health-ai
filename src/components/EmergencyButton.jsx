"use client";

import { useState } from "react";
import EmergencyModal from "@/app/emergencies/EmergencyModal";

export default function EmergencyButton({ patientId }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Emergency Button - Fixed position */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-red-600 bg-opacity-90 hover:bg-red-600/80 text-white shadow-2l hover:shadow-xl transition-all duration-200"
        aria-label="Botón de emergencia"
        title="Emergencia"
      >
        <span className="text-2xl font-bold">+</span>
        <span className="absolute bottom-full mb-2 right-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
          Emergencia
        </span>
      </button>

      {/* Emergency Modal */}
      <EmergencyModal open={open} onClose={() => setOpen(false)} patientId={patientId} />
    </>
  );
}