"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import BottomNav from "@/components/BottomNav";
import NavDrawer from "@/components/NavDrawer";
import FAB from "@/components/FAB";
import Toast from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";

/**
 * App shell for authenticated pages: sidebar/topbar, bottom nav, FAB, toasts.
 * Blocks unapproved users (redirects to /pending).
 */
export default function ClientLayout({ children }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.replace("/login");
      } else if (currentUser.status !== "approved") {
        router.replace("/pending");
      }
    }
  }, [loading, currentUser, router]);

  if (loading || !currentUser || currentUser.status !== "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted">Cargando…</p>
      </div>
    );
  }

  return (
    <>
      <NavBar />
      <div className="app">{children}</div>
      <BottomNav />
      <NavDrawer />
      <FAB />
      <Toast />
    </>
  );
}
