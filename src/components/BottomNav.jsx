"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, HeartPulse, LayoutDashboard, MessageSquareText, MoreHorizontal } from "lucide-react";
import { useApp } from "@/context/AppContext";

const ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/patients", label: "Pacientes", icon: HeartPulse },
  { href: "/appointments", label: "Citas", icon: CalendarDays },
  { href: "/chat", label: "Chat", icon: MessageSquareText },
];

/** Bottom nav — mobile only (hidden on desktop via .bottom-nav). */
export default function BottomNav() {
  const pathname = usePathname();
  const { setDrawerOpen } = useApp();

  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`bottom-nav-item ${pathname === href ? "active" : ""}`}
        >
          <Icon size={20} className="bottom-nav-item-icon" />
          {label}
        </Link>
      ))}
      <button
        type="button"
        className="bottom-nav-item"
        onClick={() => setDrawerOpen(true)}
      >
        <MoreHorizontal size={20} className="bottom-nav-item-icon" />
        Más
      </button>
    </nav>
  );
}
