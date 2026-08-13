import Link from "next/link";
import {
  CalendarDays, ChevronRight, FileText, History, ShieldAlert, Settings,
} from "lucide-react";

/**
 * DashboardLinks — simple menu of other info (SPEC §13): name + link icon.
 * Accessible via the app menu (sidebar/bottom nav) and listed here too.
 */
export default function DashboardLinks({ patientId }) {
  const links = [
    { href: `/patients/${patientId}/history`, label: "Historial", icon: History },
    { href: `/patients/${patientId}/incidents`, label: "Incidentes", icon: ShieldAlert },
    { href: `/patients/${patientId}`, label: "Notas y fotos", icon: FileText },
    { href: "/appointments", label: "Citas", icon: CalendarDays },
    { href: "/settings", label: "Ajustes", icon: Settings },
  ];

  return (
    <div className="card mt16">
      <div className="card-title">Más</div>
      <ul className="mt2">
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
  );
}
