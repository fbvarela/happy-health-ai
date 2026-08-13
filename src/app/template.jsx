"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ClientLayout from "@/components/ClientLayout";

const PUBLIC_PATHS = ["/login", "/offline", "/pending"];

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

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  return <ClientLayout>{children}</ClientLayout>;
}
