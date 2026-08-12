"use client";

import NavBar from "@/components/NavBar";
import BottomNav from "@/components/BottomNav";
import NavDrawer from "@/components/NavDrawer";
import FAB from "@/components/FAB";
import Toast from "@/components/ui/Toast";

/** App shell for authenticated pages: sidebar/topbar, bottom nav, FAB, toasts. */
export default function ClientLayout({ children }) {
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
