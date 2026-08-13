"use client";

import { useRouter } from "next/navigation";

/** PatientSwitcher — compact selector to switch the active patient on the dashboard. */
export default function PatientSwitcher({ patients, activeId }) {
  const router = useRouter();

  return (
    <div className="flex gap-2 flex-wrap">
      {patients.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => router.push(`/dashboard?patient=${p.id}`)}
          className={`btn btn-sm ${p.id === activeId ? "btn-primary" : "btn-ghost"}`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
