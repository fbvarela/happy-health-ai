"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarDays, HeartPulse, LayoutDashboard, Menu, MessageSquareText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: HeartPulse },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/chat", label: "AI Chat", icon: MessageSquareText },
];

export default function NavBar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const { setDrawerOpen } = useApp();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="sidebar-nav">
        <div className="sidebar-logo">Happy Health</div>
        <div className="sidebar-items">
          <div className="sidebar-section">Care</div>
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
          <div className="sidebar-section">Activity</div>
          <Link href="/dashboard" className={`sideitem ${pathname === "/" ? "active" : ""}`}>
            <span className="sideitem-icon"><Activity size={18} /></span>
            <span className="sideitem-label">Vitals</span>
          </Link>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-footer-row">
            <span className="sidebar-lang-btn">{currentUser?.email}</span>
          </div>
          <button type="button" className="sidebar-logout-btn" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="nav-mobile-bar">
        <div className="nav-logo">Happy Health</div>
        <button
          type="button"
          aria-label="Open menu"
          className="btn btn-sm btn-sun"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={18} />
        </button>
      </div>
    </>
  );
}
