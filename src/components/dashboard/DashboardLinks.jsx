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
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)] border border-line text-bark hover:border-sun transition-colors mx-auto"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Ocultar más opciones" : "Mostrar más opciones"}
      >
        {open ? <Minus size={20} /> : <Plus size={20} />}
      </button>

      {open && (
        <div className="card mt8">
          <ul>
            {links.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 py-3 border-b border-line last:border-0 hover:text-bark"
                >
                  <Icon size={18} className="text-muted shrink-0" />
                  <span className="font-medium">{label}</span>
                  <ChevronRight size={16} className="text-muted ml-auto shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
