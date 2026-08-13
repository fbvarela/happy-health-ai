"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays, ChevronRight, FileText, History, Minus, Plus, ShieldAlert, Settings,
} from "lucide-react";

/**
 * DashboardLinks — simple menu of other info (SPEC §13): a "+" toggle icon
 * shows/hides rows of name + link icon.
 */
export default function DashboardLinks({ patientId }) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: `/patients/${patientId}/history`, label: "Historial", icon: History },
    { href: `/patients/${patientId}/incidents`, label: "Incidentes", icon: ShieldAlert },
    { href: `/patients/${patientId}`, label: "Notas y fotos", icon: FileText },
    { href: "/appointments", label: "Citas", icon: CalendarDays },
    { href: "/settings", label: "Ajustes", icon: Settings },
  ];

  return (
    <div className="mt16">
      <button
        type="button"
        className="flex flex-row items-center justify-center w-11 h-11 min-h-[44px] rounded-[12px] bg-[var(--surface)] border-2 border-[var(--bark)] text-bark hover:bg-[var(--bg)] transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Ocultar más opciones" : "Mostrar más opciones"}
        aria-controls="dashboard-links"
      >
        {open ? <Minus size={20} /> : <Plus size={20} />}
      </button>

      {open && (
        <div id="dashboard-links" className="mt8 space-y-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-row items-center gap-3 p-3.5 rounded-[12px] bg-[var(--surface)] border-2 border-line hover:border-[var(--bark)] transition-colors"
            >
              <Icon size={20} className="text-muted shrink-0" />
              <span className="font-medium text-bark">{label}</span>
              <ChevronRight size={18} className="text-muted ml-auto shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
