"use client";

import { useState } from "react";
import { Activity, NotebookPen, Plus } from "lucide-react";

/**
 * Floating action button — mobile only.
 * Primary actions: record a vital, add a note (wired up in Phase 3).
 */
export default function FAB({ onAddVital, onAddNote }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fab-root">
      {open && (
        <div className="fab-backdrop" onClick={() => setOpen(false)} />
      )}
      {open && (
        <div className="fab-actions">
          <button
            type="button"
            className="fab-action fab-action--1"
            onClick={() => { setOpen(false); onAddVital?.(); }}
          >
            <span className="fab-action-label">Record vital</span>
            <Activity className="fab-action-icon" />
          </button>
          <button
            type="button"
            className="fab-action fab-action--2"
            onClick={() => { setOpen(false); onAddNote?.(); }}
          >
            <span className="fab-action-label">Add note</span>
            <NotebookPen className="fab-action-icon" />
          </button>
        </div>
      )}
      <button
        type="button"
        aria-label="Quick actions"
        className={`fab-btn ${open ? "fab-btn--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
