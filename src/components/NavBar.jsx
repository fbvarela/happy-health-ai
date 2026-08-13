"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, CalendarDays, HeartPulse, LayoutDashboard, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useUnreadCount } from "@/hooks/useUnreadCount";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/patients", label: "Pacientes", icon: HeartPulse },
  { href: "/appointments", label: "Citas", icon: CalendarDays },
];

export default function NavBar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const { setDrawerOpen } = useApp();
  const { count } = useUnreadCount();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="sidebar-nav">
        <div className="sidebar-logo">Happy Health</div>
        <div className="sidebar-items">
          <div className="sidebar-section">Cuidados</div>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`sideitem ${pathname === href ? "active" : ""}`}
            >
              <span className="sideitem-icon"><Icon size={18} /></span>
              <span className="sideitem-label">{label}</span>
            </Link>
          ))}
          <div className="sidebar-section">Actividad</div>
          <Link href="/notifications" className={`sideitem ${pathname === "/notifications" ? "active" : ""}`}>
            <span className="sideitem-icon"><Bell size={18} /></span>
            <span className="sideitem-label">Notificaciones</span>
            {count > 0 && <span className="ml-auto badge badge-sun">{count}</span>}
          </Link>
          <Link href="/dashboard" className={`sideitem ${pathname === "/" ? "active" : ""}`}>
            <span className="sideitem-icon"><Activity size={18} /></span>
            <span className="sideitem-label">Constantes</span>
          </Link>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-footer-row">
            <span className="sidebar-lang-btn">{currentUser?.email}</span>
          </div>
          <button type="button" className="sidebar-logout-btn" onClick={() => logout()}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="nav-mobile-bar">
        <div className="nav-logo">Happy Health</div>
        <div className="flex items-center gap-2">
          <Link href="/notifications" aria-label="Notificaciones" className="relative btn btn-sm btn-ghost">
            <Bell size={18} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--sun)] text-white text-[10px] flex items-center justify-center font-semibold">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            className="btn btn-sm btn-sun"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
