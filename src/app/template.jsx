"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_PATHS = ["/login", "/offline", "/pending"];

/**
 * Auth guard only — pages render their own shell (v0 pages use AppShell,
 * legacy pages use ClientLayout themselves). No wrapping here.
 */
export default function Template({ children }) {
  const auth = useAuth();
  const { currentUser, loading } = auth ?? {};
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!currentUser && !PUBLIC_PATHS.includes(pathname)) {
      router.push("/login");
    }
  }, [currentUser, loading, pathname, router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Cargando…</div>
      </div>
    );
  }

  if (!currentUser && !PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
