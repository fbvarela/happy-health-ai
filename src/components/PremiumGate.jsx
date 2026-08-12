"use client";

import { useState } from "react";
import { Crown } from "lucide-react";

/**
 * PremiumGate — wraps premium-only features.
 * Shows a friendly upgrade card with single-app and bundle CTAs.
 */
export default function PremiumGate({ children, title = "Premium feature" }) {
  const [loading, setLoading] = useState(null);

  const startCheckout = async (plan) => {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch {
      // handled by UI state
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
      <div className="empty-icon"><Crown size={40} /></div>
      <h2 className="page-title" style={{ fontSize: "1.4rem" }}>{title}</h2>
      <p className="page-sub" style={{ marginBottom: "20px" }}>
        Upgrade to Premium to unlock this feature and support the care team.
      </p>
      <div className="flex gap12" style={{ justifyContent: "center", flexDirection: "row" }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading === "monthly"}
          onClick={() => startCheckout("monthly")}
        >
          {loading === "monthly" ? "Redirecting…" : "Single app — $9.99/mo"}
        </button>
        <button
          type="button"
          className="btn btn-sun"
          disabled={loading === "bundle-monthly"}
          onClick={() => startCheckout("bundle-monthly")}
        >
          {loading === "bundle-monthly" ? "Redirecting…" : "Happy Factory bundle — $19.99/mo"}
        </button>
      </div>
      {children}
    </div>
  );
}
