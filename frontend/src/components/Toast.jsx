import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import "./Toast.css";

/* ─────────────────────────────────────────────────────
   CONTEXT + HOOK
───────────────────────────────────────────────────── */
const ToastContext = createContext(null);

/**
 * useToast — call inside any component wrapped by <ToastProvider>.
 * Returns { showToast(message, variant) }.
 * Variants: "success" | "error" | "warning" | "info"
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ─────────────────────────────────────────────────────
   INLINE SVG ICONS
───────────────────────────────────────────────────── */
const ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

const CLOSE_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ─────────────────────────────────────────────────────
   ARIA: errors/warnings are assertive; info/success are polite
───────────────────────────────────────────────────── */
const ARIA_LIVE = {
  success: "polite",
  error:   "assertive",
  warning: "assertive",
  info:    "polite",
};

/* ─────────────────────────────────────────────────────
   SINGLE TOAST ITEM
───────────────────────────────────────────────────── */
function ToastItem({ toast, onDismiss }) {
  const { id, message, variant, exiting } = toast;

  return (
    <div
      className={`toast-item toast-${variant}${exiting ? " toast-exiting" : ""}`}
      role="status"
      aria-live={ARIA_LIVE[variant] ?? "polite"}
      aria-atomic="true"
    >
      <span className="toast-icon">{ICONS[variant]}</span>

      <p className="toast-message">{message}</p>

      <button
        type="button"
        className="toast-close"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        {CLOSE_ICON}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   PROVIDER
   Wrap the app root with <ToastProvider> to enable
   useToast() anywhere in the tree.
───────────────────────────────────────────────────── */
const AUTO_DISMISS_MS = 4000; // ms before auto-dismiss
const EXIT_ANIM_MS    = 220;  // must match toast-exit animation duration in CSS

let _nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts]   = useState([]);
  const timers                = useRef({});

  /* Dismiss a single toast (starts exit animation then removes) */
  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];

    // Flag as exiting — CSS exit animation plays
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );

    // Remove from state after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIM_MS);
  }, []);

  /* Public API: add a new toast */
  const showToast = useCallback((message, variant = "info") => {
    const id = _nextId++;

    setToasts((prev) => [...prev, { id, message, variant, exiting: false }]);

    // Schedule auto-dismiss
    timers.current[id] = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }, [dismiss]);

  /* Clean up all pending timers on unmount */
  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Rendered outside normal flow so toasts always overlay content */}
      <div
        className="toast-region"
        aria-label="Notifications"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
