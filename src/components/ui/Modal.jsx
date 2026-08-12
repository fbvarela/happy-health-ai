"use client";

/**
 * Modal — in-app dialog. Never use window.alert/confirm/prompt.
 * Mobile: renders as a bottom sheet (see .modal styles in globals.css).
 */
export default function Modal({ open, title, sub, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && <h2 className="modal-title">{title}</h2>}
        {sub && <p className="modal-sub">{sub}</p>}
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
