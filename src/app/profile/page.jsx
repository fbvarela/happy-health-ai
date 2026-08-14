"use client";

import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/app-shell";

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const name = currentUser?.name || "Usuario";
  const initial = (name[0] || currentUser?.email?.[0] || "U").toUpperCase();

  return (
    <AppShell title="Mi perfil" eyebrow="Cuenta" showBack>
      <section className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">{initial}</div>
        <h2 className="mt-4 text-xl font-semibold">{name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{currentUser?.email || ""}</p>
        <p className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">La cuenta se gestiona mediante Google.</p>
      </section>
    </AppShell>
  );
}
