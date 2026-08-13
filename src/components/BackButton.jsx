"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * BackButton — returns to the previous page (coherent flow). Falls back to
 * `fallback` when there's no history (direct visit).
 */
export default function BackButton({ fallback = "/dashboard", label = "Volver" }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label={label}
      className="inline-flex items-center justify-center w-11 h-11 min-h-[44px] rounded-full bg-[var(--surface)] border-2 border-line text-bark hover:border-[var(--bark)] transition-colors mb-4"
    >
      <ArrowLeft size={20} />
    </button>
  );
}
