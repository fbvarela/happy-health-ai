"use client";

import Link from "next/link";
import { Bell, FileText, HeartPulse, LogOut, Settings } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

/** Slide-in drawer — mobile only ("More" item in bottom nav). */
export default function NavDrawer() {
  const { drawerOpen, setDrawerOpen } = useApp();
  const { logout } = useAuth();

  if (!drawerOpen) return null;

  return (
    <>
      <div className="nav-drawer-overlay" onClick={() => setDrawerOpen(false)} />
      <div className={`nav-drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-section-label">Happy Health</div>
        <button type="button" className="drawer-item" onClick={() => setDrawerOpen(false)}>
          <HeartPulse size={18} /> Close
        </button>
        <div className="drawer-divider" />
        <Link href="/patients" className="drawer-item" onClick={() => setDrawerOpen(false)}>
          <FileText size={18} /> Care notes
        </Link>
        <Link href="/notifications" className="drawer-item" onClick={() => setDrawerOpen(false)}>
          <Bell size={18} /> Notifications
        </Link>
        <Link href="/settings" className="drawer-item" onClick={() => setDrawerOpen(false)}>
          <Settings size={18} /> Settings
        </Link>
        <div className="drawer-divider" />
        <button type="button" className="drawer-item" onClick={() => { setDrawerOpen(false); logout(); }}>
          <LogOut size={18} /> Log out
        </button>
      </div>
    </>
  );
}
