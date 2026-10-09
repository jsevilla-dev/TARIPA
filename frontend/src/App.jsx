import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import "./App.css";
import { useToast } from "./components/Toast.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

/* ─────────────────────────────────────────────
   ADMIN AUTH HELPERS
───────────────────────────────────────────── */
const ADMIN_TOKEN_KEY = "taripa_admin_token";
const ADMIN_USER_KEY  = "taripa_admin_user";

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
const getAdminUser  = () => {
  try { return JSON.parse(localStorage.getItem(ADMIN_USER_KEY)); } catch { return null; }
};
const clearAdminAuth = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
};
const saveAdminAuth = (token, admin) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
};

/**
 * authFetch — drop-in replacement for fetch() that attaches
 * the admin Bearer token to every request. If the server
 * responds 401 (expired / revoked token), clears auth and
 * reloads so the login screen appears.
 */
const authFetch = async (url, options = {}) => {
  const token = getAdminToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    clearAdminAuth();
    window.location.reload();
    // Return a never-resolving promise so callers don't see partial data
    return new Promise(() => {});
  }
  return response;
};

/* ─────────────────────────────────────────────
   SVG ICONS
───────────────────────────────────────────── */
const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Tenants: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Rooms: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Meters: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  Rates: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Billing: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Reports: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Delete: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Electricity: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  Water: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  Alert: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Check: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Filter: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Print: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Building2: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  ),
  DoorOpen: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 4h3a2 2 0 0 1 2 2v14" />
      <path d="M2 20h20" />
      <path d="M13 20V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16" />
      <circle cx="9" cy="12" r="1" />
    </svg>
  ),
  Gauge: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  ),
  SlidersHorizontal: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" />
      <line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" />
      <line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" />
      <line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="16" x2="16" y1="18" y2="22" />
    </svg>
  ),
  ReceiptText: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M14 8H8" /><path d="M16 12H8" /><path d="M13 16H8" />
    </svg>
  ),
  BarChart3: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
    </svg>
  ),
  Smartphone: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  ),
  BedDouble: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
      <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <path d="M12 4v6" />
      <path d="M2 18h20" />
    </svg>
  ),
  Droplets: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
    </svg>
  ),
  CalendarDays: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" />
      <path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
    </svg>
  ),
  ArrowUpRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  Wallet: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  ),
  LogOut: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  ),
};

const navigationItems = [
  { id: "dashboard", label: "Dashboard", Icon: Icons.Dashboard },
  { id: "rooms", label: "Rooms", Icon: Icons.DoorOpen },
  { id: "tenants", label: "Tenants", Icon: Icons.Tenants },
  { id: "meters", label: "Meter Readings", Icon: Icons.Gauge },
  { id: "rates", label: "Utility Rates", Icon: Icons.SlidersHorizontal },
  { id: "billing", label: "Billing & Invoices", Icon: Icons.ReceiptText },
  { id: "reports", label: "Reports", Icon: Icons.BarChart3 },
];

/* ─────────────────────────────────────────────
   ADMIN LOGIN COMPONENT
───────────────────────────────────────────── */
function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const isFormValid = username.trim().length > 0 && password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Login failed. Please try again.");
        return;
      }
      saveAdminAuth(data.data.token, data.data.admin);
      onLoginSuccess(data.data.token, data.data.admin);
    } catch {
      setError("Unable to reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="insta-login-page">
      {/* ── TOP BRAND MARK (like Instagram top-left logo) ── */}
      <div className="insta-top-brand">
        <img src="/taripa-owl.jpg" alt="TARIPA" className="insta-top-logo" />
        <span className="insta-top-name">TARIPA</span>
      </div>

      {/* ── MAIN 2-COLUMN CONTAINER ── */}
      <main className="insta-main-container">
        {/* Left Column: Headline & Floating Showcase */}
        <section className="insta-left-col">
          <h1 className="insta-hero-headline">
            Rent, submeters, and receipts&nbsp;—<br />
            <span className="insta-highlight">reconciled every cycle.</span>
          </h1>

          <div className="insta-mockup-wrapper">
            {/* Phone/Card Frame */}
            <div className="insta-mockup-frame">
              <img
                src="/images/taripa-owl-building.png"
                alt="TARIPA Residential Building & Submeter System"
                className="insta-mockup-img"
              />
            </div>
          </div>
        </section>

        {/* Center Hairline Divider */}
        <div className="insta-divider" />

        {/* Right Column: Clean Form */}
        <section className="insta-right-col">
          <div className="insta-form-box">
            <h2 className="insta-form-title">Log into TARIPA</h2>
            <p className="insta-form-subtitle">Admin billing & property management portal</p>

            {/* Portal Switcher */}
            <div className="insta-portal-switch">
              <button type="button" className="insta-portal-btn active">
                Admin Portal
              </button>
              <a href="/client" className="insta-portal-btn">
                Tenant Portal
              </a>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="insta-input-wrapper">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="Username or email"
                  autoComplete="username"
                  className="insta-input"
                  autoFocus
                  required
                />
              </div>

              <div className="insta-input-wrapper">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="insta-input"
                  style={{ paddingRight: "44px" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="insta-pass-toggle-btn"
                  title={showPass ? "Hide password" : "Show password"}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>

              {error && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "10px 14px", borderRadius: "10px", fontSize: "12.5px", fontWeight: 600, marginBottom: "12px" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="insta-btn-submit"
                disabled={!isFormValid || loading}
              >
                {loading ? "Logging in…" : "Log in"}
              </button>

              <a
                href="#forgot"
                onClick={(e) => { e.preventDefault(); alert("Contact system administrator to reset admin credentials in .env."); }}
                className="insta-forgot-link"
              >
                Forgot password?
              </a>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   APP SHELL
───────────────────────────────────────────── */
function App() {
// ── Admin auth state ──────────────────────
  const [adminToken, setAdminToken] = useState(() => getAdminToken());
  const [adminUser,  setAdminUser]  = useState(() => getAdminUser());

  const [activePage, setActivePage] = useState("dashboard");
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("taripa_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth <= 992) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("taripa_sidebar_collapsed", String(next));
        } catch {}
        return next;
      });
    }
  }, []);

  const closeSidebar = useCallback(() => {
    if (window.innerWidth <= 992) {
      setMobileSidebarOpen(false);
    } else {
      setSidebarCollapsed(true);
      try {
        localStorage.setItem("taripa_sidebar_collapsed", "true");
      } catch {}
    }
  }, []);

  const handleLoginSuccess = useCallback((token, admin) => {
    setAdminToken(token);
    setAdminUser(admin);
  }, []);

  const handleLogout = useCallback(() => {
    clearAdminAuth();
    setAdminToken(null);
    setAdminUser(null);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTenants, setSearchTenants] = useState([]);
  const [searchRooms, setSearchRooms] = useState([]);
  const searchContainerRef = useRef(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingBills, setPendingBills] = useState([]);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("taripa_read_notifs") || "[]");
    } catch {
      return [];
    }
  });
  const notifContainerRef = useRef(null);

  useEffect(() => {
    // Only poll health when authenticated
    if (!adminToken) return;
    fetch("/api/health")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setBackendStatus("Connected");
        } else {
          setBackendStatus("Database connection failed");
        }
      })
      .catch(() => {
        setBackendStatus("Backend unavailable");
      });

    // Preload lightweight search & notification data
    authFetch("/api/tenants")
      .then((r) => r.json())
      .then((data) => { if (data.success) setSearchTenants(data.data); })
      .catch(() => {});

    authFetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => { if (data.success) setSearchRooms(data.data); })
      .catch(() => {});

    authFetch("/api/billing?status=Pending")
      .then((r) => r.json())
      .then((data) => { if (data.success) setPendingBills(data.data || []); })
      .catch(() => {});
  }, [adminToken, activePage]);

  // Click outside listener for search & notification dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const notifications = useMemo(() => {
    const list = [];
    (pendingBills || []).forEach((b) => {
      list.push({
        id: `bill-${b.id}`,
        type: "billing",
        title: "Pending Payment",
        message: `${b.full_name || "Tenant"} · Room ${b.room_number || "—"} (₱${Number(b.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })})`,
        time: b.billing_month ? new Date(b.billing_month).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "This month",
        page: "billing",
      });
    });

    (searchRooms || [])
      .filter((r) => r.status === "Available" || (r.occupied_count < r.capacity))
      .slice(0, 3)
      .forEach((r) => {
        const slots = Math.max(0, (r.capacity || 0) - (r.occupied_count || 0));
        list.push({
          id: `room-avail-${r.id}`,
          type: "room",
          title: `Room ${r.room_number} Available`,
          message: `${slots} of ${r.capacity} slot${slots > 1 ? "s" : ""} open for tenancy`,
          time: "Ready",
          page: "rooms",
        });
      });

    return list;
  }, [pendingBills, searchRooms]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readNotifIds.includes(n.id)).length;
  }, [notifications, readNotifIds]);

  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem("taripa_read_notifs", JSON.stringify(allIds));
    } catch {
      /* ignore storage failure */
    }
  };

  const handleNotificationClick = (item) => {
    if (!readNotifIds.includes(item.id)) {
      const next = [...readNotifIds, item.id];
      setReadNotifIds(next);
      try {
        localStorage.setItem("taripa_read_notifs", JSON.stringify(next));
      } catch {
        /* ignore storage failure */
      }
    }
    setActivePage(item.page);
    setNotificationsOpen(false);
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matchedTenants = searchTenants
      .filter((t) => t.full_name?.toLowerCase().includes(q) || t.room_number?.toString().includes(q))
      .slice(0, 4)
      .map((t) => ({
        id: `tenant-${t.id}`,
        title: t.full_name,
        subtitle: t.room_number ? `Room ${t.room_number} · ${t.status}` : t.status,
        page: "tenants",
        badge: "Tenant",
      }));

    const matchedRooms = searchRooms
      .filter((r) => r.room_number?.toString().includes(q))
      .slice(0, 3)
      .map((r) => ({
        id: `room-${r.id}`,
        title: `Room ${r.room_number}`,
        subtitle: `${r.occupied_count}/${r.capacity} Occupants`,
        page: "rooms",
        badge: "Room",
      }));

    return [...matchedTenants, ...matchedRooms];
  }, [searchQuery, searchTenants, searchRooms]);

  // ── Auth gate: show login if no token ─────
  if (!adminToken) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const isOnline = backendStatus === "Connected";

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* ── MOBILE OVERLAY ── */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ── */}
      {/* ── SIDEBAR (Floating Liquid Glass Card) ── */}
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileSidebarOpen ? "mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <div className="brand" onClick={() => setActivePage("dashboard")}>
            <div className="brand-badge">
              <img src="/taripa-owl.jpg" alt="TARIPA" />
            </div>
            <div className="brand-text">
              <strong>TARIPA</strong>
              <span>PROPERTY & UTILITIES</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={closeSidebar}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Navigation */}
        <nav className="navigation">
          <p className="nav-section-title">WORKSPACE</p>
          {navigationItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${activePage === id ? "active" : ""}`}
              onClick={() => {
                setActivePage(id);
                if (window.innerWidth <= 992) setMobileSidebarOpen(false);
              }}
            >
              <span className="nav-icon">
                <Icon />
              </span>
              <span className="nav-label-text">{label}</span>
            </button>
          ))}

          <p className="nav-section-title" style={{ marginTop: "20px" }}>PREVIEW</p>
          <a
            href="/client"
            className="nav-item"
            style={{ textDecoration: "none" }}
            onClick={() => {
              if (window.innerWidth <= 992) setMobileSidebarOpen(false);
            }}
          >
            <span className="nav-icon">
              <Icons.Smartphone />
            </span>
            <span className="nav-label-text">Tenant Portal</span>
          </a>
        </nav>

        {/* Admin user + logout */}
        <div className="sidebar-admin-user">
          <div className="sidebar-admin-avatar">
            {(adminUser?.username || "AD").slice(0, 2).toUpperCase()}
          </div>
          <div className="sidebar-admin-info">
            <strong>{adminUser?.username || "Admin"}</strong>
            <span className="sidebar-admin-badge">System Admin</span>
          </div>
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <Icons.LogOut />
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        {/* ── STICKY TOPBAR ── */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-menu-btn mobile-menu-btn"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? "Open sidebar" : "Toggle sidebar"}
              aria-label="Toggle navigation menu"
            >
              <Icons.Menu />
            </button>

            {/* Breadcrumb capsule */}
            <div className="topbar-capsule">
              <span style={{ color: "#64748B" }}>TARIPA</span>
              <span className="context-sep">/</span>
              <span className="breadcrumb-current">
                {navigationItems.find((n) => n.id === activePage)?.label ?? "Dashboard"}
              </span>
            </div>

            {/* Billing Cycle capsule */}
            <div
              className="topbar-capsule topbar-billing-capsule"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                height: "42px",
                padding: "0 16px",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", color: "#64748B", flexShrink: 0 }}>
                <Icons.CalendarDays />
              </span>
              <span className="cycle-label" style={{ color: "#64748B", fontWeight: 500, marginRight: "4px" }}>
                Billing Cycle:
              </span>
              <span style={{ fontWeight: 700, color: "#090D16" }}>
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="global-search-wrapper" ref={searchContainerRef}>
              <div className="topbar-search-capsule">
                <span className="search-icon" style={{ display: "grid", placeItems: "center", color: "#94A3B8" }}>
                  <Icons.Search />
                </span>
                <input
                  type="text"
                  placeholder="Search"
                  aria-label="Search"
                  className="topbar-search-input"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setSearchOpen(true);
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchOpen(false);
                    }}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {searchOpen && searchQuery.trim() && (
                <div className="search-results-dropdown">
                  {searchResults.length === 0 ? (
                    <div className="search-no-results">No matching records found</div>
                  ) : (
                    searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="search-result-item"
                        onClick={() => {
                          setActivePage(item.page);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <div className="search-result-info">
                          <span className="search-result-title">{item.title}</span>
                          <span className="search-result-sub">{item.subtitle}</span>
                        </div>
                        <span className="search-result-badge">{item.badge}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="notification-wrapper" ref={notifContainerRef}>
              <button
                type="button"
                className="topbar-bell-btn"
                title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "System Notifications"}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((prev) => !prev)}
              >
                <Icons.Bell />
                <span className="topbar-bell-dot" aria-hidden="true" />
              </button>

              {notificationsOpen && (
                <div className="notifications-dropdown animate-scale-in" role="region" aria-label="Notifications list">
                  <div className="notifications-header">
                    <div className="notifications-header-title">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="notifications-badge">{unreadCount} new</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="notifications-mark-read"
                        onClick={handleMarkAllRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div className="notifications-empty">
                        <div className="notifications-empty-icon"><Icons.Check /></div>
                        <p className="notifications-empty-title">All caught up!</p>
                        <p className="notifications-empty-sub">No pending bills or room vacancy alerts.</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isUnread = !readNotifIds.includes(n.id);
                        return (
                          <div
                            key={n.id}
                            className={`notification-item ${isUnread ? "unread" : ""}`}
                            onClick={() => handleNotificationClick(n)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleNotificationClick(n);
                              }
                            }}
                          >
                            <div className={`notification-item-icon notif-${n.type}`}>
                              {n.type === "billing" ? <Icons.Billing /> : <Icons.Rooms />}
                            </div>
                            <div className="notification-item-body">
                              <div className="notification-item-header">
                                <span className="notification-item-title">{n.title}</span>
                                <span className="notification-item-time">{n.time}</span>
                              </div>
                              <p className="notification-item-msg">{n.message}</p>
                            </div>
                            {isUnread && <span className="notification-item-unread-dot" />}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="notifications-footer">
                    <button
                      type="button"
                      className="notifications-footer-action"
                      onClick={() => {
                        setActivePage("billing");
                        setNotificationsOpen(false);
                      }}
                    >
                      View Billing & Invoices →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT WRAPPER ── */}
        <div className="page-content animate-fade-in" key={activePage}>
          {activePage === "dashboard" ? (
            <Dashboard onNavigate={setActivePage} />
          ) : activePage === "tenants" ? (
            <TenantsPage />
          ) : activePage === "rooms" ? (
            <RoomsPage />
          ) : activePage === "meters" ? (
            <MeterReadingsPage />
          ) : activePage === "rates" ? (
            <UtilityRatesPage />
          ) : activePage === "billing" ? (
            <BillingPage />
          ) : activePage === "reports" ? (
            <ReportsPage />
          ) : null}
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE HEADER (reusable)
───────────────────────────────────────────── */
function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    Active: "badge-active",
    Inactive: "badge-inactive",
    Paid: "badge-paid",
    Pending: "badge-pending",
    Overdue: "badge-overdue",
    Available: "badge-active",
    Full: "badge-inactive",
  };
  return (
    <span className={`status-badge ${map[status] ?? "badge-default"}`}>
      {status}
    </span>
  );
}

/* ─────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────── */
function Dashboard({ onNavigate }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [dbInvoices, setDbInvoices] = useState([]);
  const [collectModalInv, setCollectModalInv] = useState(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [paidToast, setPaidToast] = useState("");

  const admin = getAdminUser();
  const adminName = admin?.username || "Admin";

  const loadData = () => {
    authFetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => { if (data.success) setDashboardData(data.data); })
      .catch((e) => console.error("Failed to load dashboard data:", e));

    authFetch("/api/billing")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setDbInvoices(data.data);
        }
      })
      .catch((e) => console.error("Failed to load billing records:", e));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Display real invoices from database (unpaid first, then recent)
  const displayInvoices = useMemo(() => {
    if (!dbInvoices || dbInvoices.length === 0) return [];
    const sorted = [...dbInvoices].sort((a, b) => {
      const aUnpaid = a.status !== "Paid" ? 0 : 1;
      const bUnpaid = b.status !== "Paid" ? 0 : 1;
      if (aUnpaid !== bUnpaid) return aUnpaid - bUnpaid;
      return Number(b.id) - Number(a.id);
    });
    return sorted.slice(0, 6).map((b) => {
      const tenantName = b.full_name || "Resident";
      const initials = tenantName
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .slice(0, 2)
        .toUpperCase() || "TN";
      const dateStr = b.billing_month
        ? new Date(b.billing_month).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "—";
      return {
        id: b.id,
        dbId: b.id,
        code: `INV-${String(b.id).padStart(4, "0")}`,
        tenant: tenantName,
        initials,
        room: b.room_number ? `Room ${b.room_number}` : "Room —",
        total: Number(b.total_amount || 0),
        due: dateStr,
        status: b.status || "Pending",
      };
    });
  }, [dbInvoices]);

  const handleCollectPayment = async (inv) => {
    if (inv.dbId) {
      setIsCollecting(true);
      try {
        const res = await authFetch(`/api/billing/${inv.dbId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Paid" }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setPaidToast(`Payment collected for ${inv.tenant}!`);
          loadData();
          setCollectModalInv(null);
        } else {
          alert(json.message || "Failed to update billing record.");
        }
      } catch (err) {
        console.error("Failed to collect payment:", err);
      } finally {
        setIsCollecting(false);
      }
    } else {
      setPaidToast(`Payment of ${formatCurrency(inv.total)} recorded!`);
      setCollectModalInv(null);
    }
  };

  const totalTenants = Number(dashboardData?.total_tenants || 0);
  const totalCapacity = Number(dashboardData?.total_capacity || (dashboardData?.total_rooms ? dashboardData.total_rooms * 2 : 0));
  const occPercent = totalCapacity > 0 ? ((totalTenants / totalCapacity) * 100).toFixed(1) : "0.0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#090D16", letterSpacing: "-0.02em", margin: 0 }}>
            Good day, {adminName}
          </h1>
          <p style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0", fontWeight: 500 }}>
            Property overview and billing performance for this cycle.
          </p>
        </div>
        <button
          type="button"
          className="btn-cobalt"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            height: "42px",
            padding: "0 22px",
            borderRadius: "9999px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            color: "#FFFFFF",
          }}
          onClick={() => onNavigate?.("billing")}
        >
          <Icons.Plus />
          Generate Monthly Bills
        </button>
      </div>

      {paidToast && (
        <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", padding: "10px 16px", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13.5px", fontWeight: 600 }}>
          <span>✓ {paidToast}</span>
          <button type="button" onClick={() => setPaidToast("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px" }}>×</button>
        </div>
      )}

      {/* ── KPI METRIC CARDS ROW (4 CARDS) ── */}
      <section aria-label="Key metrics" className="dashboard-kpi-4col">
        {/* Card 1: TOTAL COLLECTIONS */}
        <div className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p className="eyebrow" style={{ margin: 0 }}>TOTAL COLLECTIONS</p>
            <span className="glass-inset" style={{ width: "36px", height: "36px", borderRadius: "12px", display: "grid", placeItems: "center", color: "#2563EB" }}>
              <Icons.Wallet />
            </span>
          </div>
          <p style={{ fontSize: "28px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
            {formatCurrency(dashboardData?.total_collected || 0)}
          </p>
          <div style={{ fontSize: "12.5px", fontWeight: 500, color: "#64748B", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", borderRadius: "9999px", border: "1px solid #A7F3D0", background: "#ECFDF5", padding: "2px 8px", fontSize: "11.5px", fontWeight: 700, color: "#059669" }}>
              Settled
            </span>
            <span>from paid invoices</span>
          </div>
        </div>

        {/* Card 2: OUTSTANDING UNPAID DUES */}
        <div className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p className="eyebrow" style={{ margin: 0 }}>OUTSTANDING UNPAID DUES</p>
            <span className="glass-inset" style={{ width: "36px", height: "36px", borderRadius: "12px", display: "grid", placeItems: "center", color: "#2563EB" }}>
              <Icons.Alert />
            </span>
          </div>
          <p style={{ fontSize: "28px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
            {formatCurrency(dashboardData?.outstanding_amount || 0)}
          </p>
          <div style={{ fontSize: "12.5px", fontWeight: 500, color: "#64748B" }}>
            <strong style={{ color: (dashboardData?.pending_bills || 0) > 0 ? "#D97706" : "#059669", fontWeight: 700 }}>
              {dashboardData?.pending_bills || 0} pending {dashboardData?.pending_bills === 1 ? "invoice" : "invoices"}
            </strong>{" "}
            this cycle
          </div>
        </div>

        {/* Card 3: OCCUPANCY RATE */}
        <div className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p className="eyebrow" style={{ margin: 0 }}>OCCUPANCY RATE</p>
            <span className="glass-inset" style={{ width: "36px", height: "36px", borderRadius: "12px", display: "grid", placeItems: "center", color: "#2563EB" }}>
              <Icons.BedDouble />
            </span>
          </div>
          <p style={{ fontSize: "28px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
            {totalTenants}/{totalCapacity} Slots
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="glass-inset" style={{ height: "8px", flex: 1, borderRadius: "9999px", overflow: "hidden" }}>
              <div className="liquid-bar" style={{ width: `${Math.min(100, Math.max(0, occPercent))}%`, height: "100%", borderRadius: "9999px" }} />
            </div>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#090D16" }}>{occPercent}%</span>
          </div>
        </div>

        {/* Card 4: ACTIVE TENANTS */}
        <div className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p className="eyebrow" style={{ margin: 0 }}>ACTIVE TENANTS</p>
            <span className="glass-inset" style={{ width: "36px", height: "36px", borderRadius: "12px", display: "grid", placeItems: "center", color: "#2563EB" }}>
              <Icons.Tenants />
            </span>
          </div>
          <p style={{ fontSize: "28px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
            {totalTenants} {totalTenants === 1 ? "Occupant" : "Occupants"}
          </p>
          <div style={{ fontSize: "12.5px", fontWeight: 500, color: "#64748B" }}>
            across <strong style={{ color: "#090D16" }}>{dashboardData?.total_rooms || 0} rooms</strong> ({dashboardData?.available_rooms || 0} vacant)
          </div>
        </div>
      </section>

      {/* ── 2-COLUMN SECTION: RECENT INVOICES & UTILITY CONSUMPTION ── */}
      <div className="dashboard-grid-2col">
        {/* Left Column: Recent Invoices */}
        <div className="glass" style={{ borderRadius: "24px", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 24px 16px" }}>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#090D16", margin: 0 }}>Recent Billing Invoices</h2>
              <p style={{ fontSize: "13px", color: "#64748B", margin: "2px 0 0" }}>
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} · database records
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("billing")}
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "transparent", border: "none", color: "#2563EB", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", padding: "4px 8px", borderRadius: "9999px" }}
            >
              View all ↗
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
                  <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px 12px 24px" }}>INVOICE #</th>
                  <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>TENANT</th>
                  <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>ROOM</th>
                  <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>TOTAL</th>
                  <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>BILLING DATE</th>
                  <th className="eyebrow" style={{ textAlign: "center", padding: "12px 16px" }}>STATUS</th>
                  <th className="eyebrow" style={{ textAlign: "right", padding: "12px 24px 12px 16px" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {displayInvoices.length > 0 ? (
                  displayInvoices.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.05)" }}>
                      <td style={{ padding: "14px 16px 14px 24px", fontFamily: "monospace", fontSize: "12.5px", color: "#64748B" }}>
                        {inv.code}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ width: "28px", height: "28px", borderRadius: "9999px", background: "linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%)", border: "1px solid #FFFFFF", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: 700, color: "#475569" }}>
                            {inv.initials}
                          </span>
                          <span style={{ fontWeight: 600, color: "#090D16", fontSize: "13.5px" }}>{inv.tenant}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748B" }}>{inv.room}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#090D16", fontSize: "13.5px" }}>
                        {formatCurrency(inv.total)}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748B" }}>{inv.due}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "2px 10px",
                          borderRadius: "9999px",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          background: inv.status === "Paid" ? "#ECFDF5" : inv.status === "Overdue" ? "#FEF2F2" : "#FFFBEB",
                          color: inv.status === "Paid" ? "#059669" : inv.status === "Overdue" ? "#DC2626" : "#D97706",
                          border: inv.status === "Paid" ? "1px solid #A7F3D0" : inv.status === "Overdue" ? "1px solid #FECACA" : "1px solid #FDE68A",
                        }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px 14px 16px", textAlign: "right" }}>
                        {inv.status !== "Paid" ? (
                          <button
                            type="button"
                            className="btn-cobalt"
                            style={{
                              height: "32px",
                              padding: "0 16px",
                              borderRadius: "9999px",
                              fontSize: "12.5px",
                              fontWeight: 600,
                              cursor: "pointer",
                              color: "#FFFFFF",
                            }}
                            onClick={() => setCollectModalInv(inv)}
                          >
                            Collect
                          </button>
                        ) : (
                          <span style={{ fontSize: "12.5px", color: "#059669", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            ✓ Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px 20px" }}>
                      <p style={{ margin: 0, fontWeight: 700, color: "#090D16", fontSize: "14px" }}>No Billing Records Yet</p>
                      <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748B" }}>Click "+ Generate Monthly Bills" above to record cycle invoices.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Utility Consumption */}
        <div className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#090D16", margin: 0 }}>Utility Consumption</h2>
            <p style={{ fontSize: "13px", color: "#64748B", margin: "2px 0 0" }}>Submeter recorded consumption & costs</p>
          </div>

          {/* Electricity Inset Box */}
          <div className="glass-inset" style={{ borderRadius: "20px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: "40px", height: "40px", borderRadius: "13px", background: "#FFFFFF", border: "1px solid #FFFFFF", display: "grid", placeItems: "center", color: "#2563EB", boxShadow: "0 1px 3px rgba(15,23,42,0.08)" }}>
                <Icons.Electricity />
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#64748B", margin: 0 }}>Electricity</p>
                <p style={{ fontSize: "22px", fontWeight: 800, color: "#090D16", margin: 0 }}>
                  {Number(dashboardData?.electricity?.kwh || 0).toLocaleString()} <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>kWh</span>
                </p>
              </div>
              <p style={{ fontSize: "13.5px", fontWeight: 700, color: "#090D16", margin: 0 }}>
                {formatCurrency(dashboardData?.electricity?.cost || 0)}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", fontWeight: 500, color: "#64748B", marginTop: "12px", borderTop: "1px solid rgba(15,23,42,0.06)", paddingTop: "8px" }}>
              <span>Total tracked usage</span>
              <span style={{ fontWeight: 600, color: "#090D16" }}>
                {dashboardData?.electricity?.kwh > 0
                  ? `₱${(dashboardData.electricity.cost / dashboardData.electricity.kwh).toFixed(2)}/kWh avg`
                  : "Database tracked"}
              </span>
            </div>
          </div>

          {/* Water Inset Box */}
          <div className="glass-inset" style={{ borderRadius: "20px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: "40px", height: "40px", borderRadius: "13px", background: "#FFFFFF", border: "1px solid #FFFFFF", display: "grid", placeItems: "center", color: "#2563EB", boxShadow: "0 1px 3px rgba(15,23,42,0.08)" }}>
                <Icons.Droplets />
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#64748B", margin: 0 }}>Water</p>
                <p style={{ fontSize: "22px", fontWeight: 800, color: "#090D16", margin: 0 }}>
                  {Number(dashboardData?.water?.cum || 0).toLocaleString()} <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>Cu.M</span>
                </p>
              </div>
              <p style={{ fontSize: "13.5px", fontWeight: 700, color: "#090D16", margin: 0 }}>
                {formatCurrency(dashboardData?.water?.cost || 0)}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", fontWeight: 500, color: "#64748B", marginTop: "12px", borderTop: "1px solid rgba(15,23,42,0.06)", paddingTop: "8px" }}>
              <span>Total tracked usage</span>
              <span style={{ fontWeight: 600, color: "#090D16" }}>
                {dashboardData?.water?.cum > 0
                  ? `₱${(dashboardData.water.cost / dashboardData.water.cum).toFixed(2)}/Cu.M avg`
                  : "Database tracked"}
              </span>
            </div>
          </div>

          {/* Footer usage callout */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px 0", fontSize: "12.5px", color: "#64748B" }}>
            <span>Highest usage</span>
            <strong style={{ color: "#090D16" }}>
              {dashboardData?.highest_usage_room
                ? `Room ${dashboardData.highest_usage_room.room_number} · ${Number(dashboardData.highest_usage_room.kwh).toFixed(0)} kWh`
                : "No submeter records yet"}
            </strong>
          </div>
        </div>
      </div>

      {/* ── COLLECT PAYMENT MODAL ── */}
      {collectModalInv && (
        <div className="modal-overlay" onClick={() => setCollectModalInv(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px", borderRadius: "24px" }}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">PAYMENT COLLECTION</p>
                <h3 className="modal-title">Record Payment</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setCollectModalInv(null)}>
                <Icons.Close />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="glass-inset" style={{ borderRadius: "16px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#64748B" }}>Invoice #</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "monospace" }}>{collectModalInv.code}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#64748B" }}>Resident</span>
                  <span style={{ fontSize: "13px", fontWeight: 700 }}>{collectModalInv.tenant}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#64748B" }}>Room</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{collectModalInv.room}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#090D16" }}>Total Amount Due</span>
                  <span style={{ fontSize: "17px", fontWeight: 800, color: "#2563EB" }}>{formatCurrency(collectModalInv.total)}</span>
                </div>
              </div>
              <p style={{ fontSize: "12.5px", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                Marking this bill as collected will update the payment audit trail and adjust outstanding balances for the current cycle.
              </p>
            </div>
            <div className="modal-footer" style={{ borderTop: "1px solid rgba(15,23,42,0.06)", paddingTop: "14px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCollectModalInv(null)}
                disabled={isCollecting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-cobalt"
                style={{ height: "40px", padding: "0 20px", borderRadius: "9999px", fontWeight: 600, fontSize: "13px", color: "#FFFFFF", cursor: "pointer" }}
                onClick={() => handleCollectPayment(collectModalInv)}
                disabled={isCollecting}
              >
                {isCollecting ? "Recording…" : "Confirm & Mark Paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TENANTS PAGE
───────────────────────────────────────────── */
function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [query, setQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("All rooms");
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    contact_number: "",
    room_id: "",
    move_in_date: "",
    status: "Active",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const loadTenants = () => {
    authFetch("/api/tenants")
      .then((r) => r.json())
      .then((data) => { if (data.success) setTenants(data.data); })
      .catch((e) => console.error("Failed to load tenants:", e));
  };

  const loadRooms = () => {
    authFetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => { if (data.success) setRooms(data.data); })
      .catch((e) => console.error("Failed to load rooms:", e));
  };

  useEffect(() => { loadTenants(); loadRooms(); }, []);

  const resetForm = useCallback(() => {
    setFormData({ full_name: "", contact_number: "", room_id: "", move_in_date: new Date().toISOString().substring(0, 10), status: "Active" });
    setFormError("");
    setFormSuccess("");
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingTenant(null);
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    if (!showForm) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, closeForm]);

  const openAddForm = () => { setEditingTenant(null); resetForm(); setShowForm(true); };

  const openEditForm = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      full_name: tenant.full_name || "",
      contact_number: tenant.contact_number || "",
      room_id: tenant.room_id ? String(tenant.room_id) : "",
      move_in_date: tenant.move_in_date ? tenant.move_in_date.substring(0, 10) : "",
      status: tenant.status || "Active",
    });
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((c) => ({ ...c, [name]: value }));
    setFormError("");
    setFormSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    const fullNameClean = formData.full_name.trim().replace(/\s+/g, " ");
    if (!fullNameClean) { setFormError("Full name is required."); return; }
    if (fullNameClean.length < 3 || fullNameClean.length > 60) {
      setFormError("Full name must be between 3 and 60 characters.");
      return;
    }
    if (!/^[a-zA-ZñÑ\s.\-']+$/.test(fullNameClean)) {
      setFormError("Full name must contain letters only.");
      return;
    }
    if (/(.)\1{2,}/i.test(fullNameClean)) {
      setFormError("Full name cannot contain repeating characters (e.g. 'ddd').");
      return;
    }
    const nameParts = fullNameClean.split(" ").filter(Boolean);
    if (nameParts.length < 2) {
      setFormError("Please enter both First Name and Last Name (e.g. Juan Dela Cruz).");
      return;
    }
    const invalidPart = nameParts.find((part) => {
      const cleanWord = part.replace(/[^a-zA-ZñÑ]/g, "").toLowerCase();
      if (cleanWord.length === 1) return false;
      if (["jr", "sr", "ii", "iii", "iv", "v"].includes(cleanWord)) return false;
      return cleanWord.length < 2 || !/[aeiouyñ]/.test(cleanWord);
    });
    if (invalidPart) {
      setFormError(`"${invalidPart}" does not appear to be a valid name. Please enter a real name.`);
      return;
    }
    const formattedName = nameParts.map(w => {
      if (["ii", "iii", "iv"].includes(w.toLowerCase())) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(" ");

    if (!formData.move_in_date) { setFormError("Move-in date is required."); return; }

    const contactClean = formData.contact_number.trim();
    if (contactClean && !/^09\d{9}$/.test(contactClean)) {
      setFormError("Contact number must be an 11-digit mobile number starting with 09 (e.g. 09171234567).");
      return;
    }
    setIsSubmitting(true);
    try {
      const isEditing = Boolean(editingTenant);
      const url = isEditing ? `/api/tenants/${editingTenant.id}` : "/api/tenants";
      const method = isEditing ? "PUT" : "POST";
      const body = {
        full_name: formattedName,
        contact_number: contactClean || null,
        room_id: formData.room_id || null,
        move_in_date: formData.move_in_date,
        status: formData.status,
      };
      const response = await authFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok || !data.success) { setFormError(data.message || `Failed to ${isEditing ? "update" : "create"} tenant.`); return; }
      loadTenants(); loadRooms();
      closeForm();
    } catch (err) {
      console.error("Failed to save tenant:", err);
      setFormError("Unable to connect to the backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTenant = async (tenant) => {
    if (confirmDeleteId !== tenant.id) {
      setConfirmDeleteId(tenant.id);
      setDeleteError("");
      return;
    }
    setConfirmDeleteId(null);
    setDeleteError("");
    try {
      const response = await authFetch(`/api/tenants/${tenant.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setDeleteError(data.message || "Failed to delete tenant.");
        return;
      }
      loadTenants();
      loadRooms();
    } catch (err) {
      console.error("Failed to delete tenant:", err);
      setDeleteError("Unable to connect to the backend.");
    }
  };

  // Filter rows
  const filteredTenants = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digitsInQuery = q.replace(/\D/g, "");

    return tenants.filter((t) => {
      // 1. Room filter dropdown
      const roomNumStr = t.room_number != null ? String(t.room_number).trim() : "";
      const matchesRoom =
        roomFilter === "All rooms" ||
        (roomNumStr && `Room ${roomNumStr}`.toLowerCase() === roomFilter.toLowerCase()) ||
        (roomNumStr && roomNumStr.toLowerCase() === roomFilter.toLowerCase());

      if (!matchesRoom) return false;
      if (!q) return true;

      // 2. Full name or username match (e.g. "James", "Lorrely", "james.sevilla")
      const nameMatch = Boolean(
        (t.full_name && t.full_name.toLowerCase().includes(q)) ||
        (t.username && t.username.toLowerCase().includes(q))
      );

      // 3. Room number match (e.g. "101", "Room 101", "rm 101")
      const roomMatch =
        Boolean(roomNumStr && roomNumStr.toLowerCase().includes(q)) ||
        Boolean(roomNumStr && `room ${roomNumStr}`.toLowerCase().includes(q));

      // 4. Contact number match (only when query contains digits or literal match)
      const cleanContact = t.contact_number ? t.contact_number.replace(/\D/g, "") : "";
      const contactMatch =
        (digitsInQuery.length >= 2 && cleanContact.includes(digitsInQuery)) ||
        Boolean(t.contact_number && t.contact_number.toLowerCase().includes(q));

      // 5. Status match ("active", "moved out")
      const statusMatch = Boolean(t.status && t.status.toLowerCase().includes(q));

      return nameMatch || roomMatch || contactMatch || statusMatch;
    });
  }, [tenants, query, roomFilter]);

  const activeCount = tenants.filter((t) => t.status === "Active").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── HEADER ── */}
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#090D16", letterSpacing: "-0.02em", margin: 0 }}>
          Tenants
        </h1>
        <p style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0", fontWeight: 500 }}>
          Every dormer and lessee, their room assignment, and contact records.
        </p>
      </div>

      {deleteError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "10px 16px", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13.5px", fontWeight: 600 }}>
          <span>{deleteError}</span>
          <button type="button" onClick={() => setDeleteError("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>×</button>
        </div>
      )}

      {/* ── MAIN GLASS CARD (Exact Screenshot 3) ── */}
      <div className="glass" style={{ borderRadius: "24px", overflow: "hidden" }}>
        {/* Card Header & Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", padding: "20px 24px 16px", borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#090D16", margin: 0 }}>Tenant Directory</h2>
            <p style={{ fontSize: "13px", color: "#64748B", margin: "2px 0 0" }}>
              {activeCount} active · {tenants.length - activeCount} moved out
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            {/* Search Input */}
            <div style={{ position: "relative", minWidth: "220px" }}>
              <span style={{ position: "absolute", top: "50%", left: "14px", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none", display: "grid", placeItems: "center" }}>
                <Icons.Search />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or number"
                className="v0-input"
                style={{ paddingLeft: "38px", height: "38px" }}
              />
            </div>

            {/* Room Filter Select */}
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="v0-input"
              style={{ width: "auto", minWidth: "130px", height: "38px", cursor: "pointer" }}
            >
              <option>All rooms</option>
              {rooms.map((r) => (
                <option key={r.id}>Room {r.room_number}</option>
              ))}
            </select>

            {/* Register Tenant Button */}
            <button
              type="button"
              className="btn-cobalt"
              onClick={openAddForm}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                height: "38px",
                padding: "0 18px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                color: "#FFFFFF",
              }}
            >
              <Icons.Plus /> Register Tenant
            </button>
          </div>
        </div>

        {/* Directory Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px 12px 24px" }}>TENANT</th>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>CONTACT NUMBER</th>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>ROOM</th>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>MOVE-IN DATE</th>
                <th className="eyebrow" style={{ textAlign: "center", padding: "12px 16px" }}>STATUS</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 24px 12px 16px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "48px 24px", textAlign: "center" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#090D16", fontSize: "14px" }}>No Tenants Found</p>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>
                      {query || roomFilter !== "All rooms" ? "Try adjusting your search query or room filter." : "Click \"+ Register Tenant\" above to add a tenant."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const initial = (t.full_name || "T")
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const isActive = t.status === "Active";
                  const moveInFormatted = t.move_in_date
                    ? new Date(t.move_in_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—";

                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.05)" }}>
                      <td style={{ padding: "14px 16px 14px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ width: "28px", height: "28px", borderRadius: "9999px", background: "linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%)", border: "1px solid #FFFFFF", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: 700, color: "#475569" }}>
                            {initial}
                          </span>
                          <div>
                            <strong style={{ fontWeight: 600, color: "#090D16", fontSize: "13.5px", display: "block" }}>
                              {t.full_name}
                            </strong>
                            {t.username && (
                              <span style={{ fontSize: "11.5px", color: "#64748B", display: "block", fontFamily: "monospace", marginTop: "1px" }}>
                                @{t.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "monospace", fontSize: "13px", color: "#64748B" }}>
                        {t.contact_number || "—"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span className="glass-inset" style={{ display: "inline-block", padding: "3px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, color: "#090D16" }}>
                          {t.room_number ? `Room ${t.room_number}` : "Unassigned"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748B" }}>
                        {moveInFormatted}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "2px 10px",
                          borderRadius: "9999px",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          background: isActive ? "#ECFDF5" : "#F1F5F9",
                          color: isActive ? "#059669" : "#64748B",
                          border: isActive ? "1px solid #A7F3D0" : "1px solid #E2E8F0",
                        }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
                          {isActive ? "Active" : "Moved Out"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px 14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn-pill-action"
                            onClick={() => openEditForm(t)}
                          >
                            <Icons.Edit /> Edit
                          </button>
                          {confirmDeleteId === t.id ? (
                            <>
                              <button
                                type="button"
                                className="btn-pill-action btn-pill-action-danger"
                                style={{ background: "#DC2626", color: "#FFFFFF", borderColor: "#DC2626" }}
                                onClick={() => handleDeleteTenant(t)}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="btn-pill-action"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn-pill-action btn-pill-action-danger"
                              onClick={() => handleDeleteTenant(t)}
                            >
                              <Icons.Delete /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── REGISTER / EDIT TENANT MODAL (Exact Screenshot 4) ── */}
      {showForm && (
        <div className="v0-backdrop" onClick={closeForm}>
          <div className="v0-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 24px 16px", borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.01em" }}>
                  {editingTenant ? "Edit Tenant Profile" : "Register Tenant"}
                </h3>
                <p style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0" }}>
                  Tenant details appear on invoices and official receipts.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                style={{ width: "32px", height: "32px", borderRadius: "9999px", border: "none", background: "rgba(15,23,42,0.06)", display: "grid", placeItems: "center", cursor: "pointer", color: "#64748B" }}
                aria-label="Close"
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "18px", overflowY: "auto" }}>
              <div>
                <label className="v0-label">FULL NAME</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^a-zA-ZñÑ\s.\-']/g, "");
                    val = val.replace(/(.)\1{2,}/g, "$1$1");
                    val = val.slice(0, 60);
                    setFormData((c) => ({ ...c, full_name: val }));
                    setFormError("");
                  }}
                  placeholder="e.g. Juan Dela Cruz"
                  maxLength={60}
                  className="v0-input"
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <label className="v0-label">CONTACT NUMBER</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setFormData((c) => ({ ...c, contact_number: val }));
                      setFormError("");
                    }}
                    placeholder="09171234567"
                    maxLength={11}
                    className="v0-input"
                  />
                </div>

                <div>
                  <label className="v0-label">ROOM ASSIGNMENT</label>
                  <select
                    name="room_id"
                    value={formData.room_id}
                    onChange={handleChange}
                    className="v0-input"
                  >
                    <option value="">No room assigned</option>
                    {rooms.map((room) => {
                      const isCurrentRoom = editingTenant && Number(formData.room_id) === Number(room.id);
                      const isFull = Number(room.occupied_count) >= Number(room.capacity) && !isCurrentRoom;
                      const left = Math.max(0, Number(room.capacity) - Number(room.occupied_count));
                      return (
                        <option key={room.id} value={room.id} disabled={isFull}>
                          Room {room.room_number} ({left} {left === 1 ? "left" : "left"}){isFull ? " — Full" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <label className="v0-label">MOVE-IN DATE</label>
                  <input
                    type="date"
                    name="move_in_date"
                    value={formData.move_in_date}
                    onChange={handleChange}
                    className="v0-input"
                    required
                  />
                </div>

                {editingTenant && (
                  <div>
                    <label className="v0-label">STATUS</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="v0-input"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Moved Out</option>
                    </select>
                  </div>
                )}
              </div>

              {formError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "10px 14px", borderRadius: "14px", fontSize: "13px", fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              <div style={{ marginTop: "12px", display: "flex", gap: "12px", paddingTop: "16px", borderTop: "1px solid rgba(15,23,42,0.06)" }}>
                <button
                  type="button"
                  className="btn-pill-action"
                  style={{ flex: 1, height: "42px", fontSize: "13.5px" }}
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cobalt"
                  style={{ flex: 1, height: "42px", borderRadius: "9999px", fontSize: "13.5px", fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving…" : editingTenant ? "Save Changes" : "Register Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOMS PAGE
───────────────────────────────────────────── */
function RoomsPage() {
  const { showToast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({ room_number: "", capacity: "" });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  const loadRooms = () => {
    authFetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => { if (data.success) setRooms(data.data); })
      .catch((e) => console.error("Failed to load rooms:", e));
  };

  useEffect(() => { loadRooms(); }, []);

  const openAddForm = () => {
    setEditingRoom(null);
    setFormData({ room_number: "", capacity: "4" });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (room) => {
    setEditingRoom(room);
    setFormData({ room_number: room.room_number, capacity: String(room.capacity) });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingRoom(null);
    setFormData({ room_number: "", capacity: "" });
    setFormError("");
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, closeForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((c) => ({ ...c, [name]: value }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const roomNumber = formData.room_number.trim();
    const capacity = Number(formData.capacity);

    if (!roomNumber) {
      setFormError("Room number is required.");
      return;
    }
    if (!/^\d+$/.test(roomNumber)) {
      setFormError("Room number must contain numbers only (e.g. 101, 102).");
      return;
    }
    if (roomNumber.length > 4) {
      setFormError("Room number must be between 1 and 4 digits (e.g. 101, 102).");
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 30) {
      setFormError("Capacity must be a positive whole number between 1 and 30.");
      return;
    }

    if (editingRoom && capacity < Number(editingRoom.occupied_count || 0)) {
      setFormError(`Capacity cannot be lower than current active occupants (${editingRoom.occupied_count}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : "/api/rooms";
      const method = editingRoom ? "PUT" : "POST";
      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_number: roomNumber, capacity }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setFormError(data.message || (editingRoom ? "Failed to update room." : "Failed to create room."));
        return;
      }

      showToast(editingRoom ? "Room updated successfully." : "Room added successfully.", "success");
      loadRooms();
      closeForm();
    } catch (err) {
      console.error("Failed to save room:", err);
      setFormError("Unable to connect to the backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (room) => {
    if (Number(room.occupied_count) > 0) {
      showToast(`Cannot delete Room ${room.room_number} because it has ${room.occupied_count} assigned tenant(s).`, "error");
      return;
    }
    setRoomToDelete(room);
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;
    try {
      const response = await authFetch(`/api/rooms/${roomToDelete.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        showToast(data.message || "Failed to delete room.", "error");
        return;
      }
      showToast(`Room ${roomToDelete.room_number} deleted successfully.`, "success");
      setRoomToDelete(null);
      loadRooms();
    } catch (err) {
      console.error("Failed to delete room:", err);
      showToast("Unable to connect to the backend.", "error");
    }
  };

  const visibleRooms = rooms.filter((r) => {
    const isFull = Number(r.occupied_count) >= Number(r.capacity);
    if (filter === "Available") return !isFull;
    if (filter === "Full") return isFull;
    return true;
  });

  const totalCapacity = rooms.reduce((sum, r) => sum + Number(r.capacity || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── HEADER ── */}
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#090D16", letterSpacing: "-0.02em", margin: 0 }}>
          Rooms
        </h1>
        <p style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0", fontWeight: 500 }}>
          {rooms.length} {rooms.length === 1 ? "room" : "rooms"} · {totalCapacity} bedspaces across dormitory floors. Track capacity and availability.
        </p>
      </div>

      {/* ── CONTROLS ROW: TABS & ADD BUTTON ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div className="glass" style={{ display: "inline-flex", borderRadius: "9999px", padding: "4px", gap: "4px" }}>
          {["All", "Available", "Full"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={filter === f ? "glass-pill-active" : ""}
              style={{
                height: "32px",
                padding: "0 16px",
                borderRadius: "9999px",
                border: "none",
                background: filter === f ? undefined : "transparent",
                color: filter === f ? "#090D16" : "#64748B",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn-cobalt"
          onClick={openAddForm}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            height: "40px",
            padding: "0 20px",
            borderRadius: "9999px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            color: "#FFFFFF",
          }}
        >
          <Icons.Plus /> Add Room
        </button>
      </div>

      {/* ── ROOMS GRID (3 COLUMNS) ── */}
      <div className="rooms-grid-3col">
        {visibleRooms.length === 0 ? (
          <div className="glass" style={{ gridColumn: "1 / -1", padding: "48px 24px", textAlign: "center", borderRadius: "24px" }}>
            <span className="glass-inset" style={{ width: "48px", height: "48px", borderRadius: "14px", display: "inline-grid", placeItems: "center", color: "#2563EB", marginBottom: "12px" }}>
              <Icons.DoorOpen />
            </span>
            <p style={{ margin: 0, fontWeight: 700, color: "#090D16", fontSize: "15px" }}>No Rooms Found</p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>
              {filter !== "All" ? `No rooms matching "${filter}" status.` : "Click \"+ Add Room\" above to create a room."}
            </p>
          </div>
        ) : (
          visibleRooms.map((room) => {
            const occupied = Number(room.occupied_count || 0);
            const capacity = Number(room.capacity || 1);
            const left = Math.max(0, capacity - occupied);
            const isFull = occupied >= capacity;
            const fillPct = Math.min(100, Math.round((occupied / capacity) * 100));

            return (
              <div key={room.id} className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Card Top */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ width: "44px", height: "44px", borderRadius: "14px", background: "#EFF6FF", border: "1px solid #DBEAFE", display: "grid", placeItems: "center", color: "#2563EB", flexShrink: 0 }}>
                    <Icons.DoorOpen />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#090D16", margin: 0, letterSpacing: "-0.01em" }}>
                      Room {room.room_number}
                    </h3>
                    <p style={{ fontSize: "12.5px", color: "#64748B", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Residential unit · {capacity} bedspaces
                    </p>
                  </div>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "2px 10px",
                    borderRadius: "9999px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    background: isFull ? "#FEF2F2" : "#ECFDF5",
                    color: isFull ? "#DC2626" : "#059669",
                    border: isFull ? "1px solid #FECACA" : "1px solid #A7F3D0",
                  }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
                    {isFull ? "Full" : "Available"}
                  </span>
                </div>

                {/* Occupancy Liquid Progress */}
                <div>
                  <div className="glass-inset" style={{ height: "8px", borderRadius: "9999px", overflow: "hidden" }}>
                    <div className="liquid-bar" style={{ width: `${fillPct}%`, height: "100%", borderRadius: "9999px" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "12.5px" }}>
                    <span style={{ color: "#090D16" }}>
                      <strong style={{ fontWeight: 700 }}>{occupied}/{capacity}</strong> occupied
                    </span>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>
                      {left} {left === 1 ? "slot" : "slots"} left
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", paddingTop: "14px", borderTop: "1px solid rgba(15, 23, 42, 0.06)" }}>
                  <button
                    type="button"
                    className="btn-pill-action"
                    style={{ flex: 1 }}
                    onClick={() => openEditForm(room)}
                  >
                    <Icons.Edit /> Edit
                  </button>
                  <button
                    type="button"
                    className="btn-pill-action btn-pill-action-danger"
                    style={{ flex: 1 }}
                    onClick={() => handleDeleteClick(room)}
                    disabled={occupied > 0}
                    title={occupied > 0 ? "Cannot delete room with active tenants" : undefined}
                  >
                    <Icons.Delete /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── ADD / EDIT ROOM SLIDE-OVER DRAWER (Exact Screenshot 2) ── */}
      {showForm && (
        <div className="v0-backdrop" onClick={closeForm}>
          <div className="v0-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 24px 16px", borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.01em" }}>
                  {editingRoom ? `Edit Room ${editingRoom.room_number}` : "Add Room"}
                </h3>
                <p style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0" }}>
                  Rooms define bedspace capacity used for occupancy and billing.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                style={{ width: "32px", height: "32px", borderRadius: "9999px", border: "none", background: "rgba(15,23,42,0.06)", display: "grid", placeItems: "center", cursor: "pointer", color: "#64748B" }}
                aria-label="Close"
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>
              <div>
                <label className="v0-label">ROOM NUMBER</label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="room_number"
                  value={formData.room_number}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setFormData((c) => ({ ...c, room_number: val }));
                    setFormError("");
                  }}
                  placeholder="e.g. 103"
                  maxLength={4}
                  className="v0-input"
                  autoFocus
                  required
                />
                <p style={{ margin: "4px 0 0", textAlign: "right", fontSize: "11.5px", color: "#64748B" }}>
                  {formData.room_number.length}/4
                </p>
              </div>

              <div>
                <label className="v0-label">CAPACITY (SLOTS)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="capacity"
                  min="1"
                  max="30"
                  value={formData.capacity}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setFormData((c) => ({ ...c, capacity: val }));
                    setFormError("");
                  }}
                  onKeyDown={(e) => {
                    if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                  }}
                  placeholder="4"
                  className="v0-input"
                  required
                />
                <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: "#64748B" }}>
                  Between 1 and 30 bedspaces.
                </p>
              </div>

              <div>
                <label className="v0-label">NOTES</label>
                <textarea
                  name="notes"
                  maxLength={200}
                  placeholder="Aircon, shared CR, window side…"
                  className="v0-textarea"
                  rows={3}
                />
              </div>

              {formError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "10px 14px", borderRadius: "14px", fontSize: "13px", fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              <div style={{ marginTop: "auto", display: "flex", gap: "12px", paddingTop: "16px", borderTop: "1px solid rgba(15,23,42,0.06)" }}>
                <button
                  type="button"
                  className="btn-pill-action"
                  style={{ flex: 1, height: "42px", fontSize: "13.5px" }}
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cobalt"
                  style={{ flex: 1, height: "42px", borderRadius: "9999px", fontSize: "13.5px", fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving…" : "Save Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(roomToDelete)}
        title="Delete Room?"
        message={
          roomToDelete
            ? `Are you sure you want to delete Room ${roomToDelete.room_number}? This action cannot be undone.`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setRoomToDelete(null)}
        confirmLabel="Delete Room"
        isDangerous
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   METER READINGS PAGE
───────────────────────────────────────────── */
function MeterReadingsPage() {
  const { showToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [readings, setReadings] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rates, setRates] = useState([]);
  const [activeTab, setActiveTab] = useState("electric");
  const [showForm, setShowForm] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [formData, setFormData] = useState({
    tenant_id: "",
    billing_month: "",
    electricity_previous: "",
    electricity_current: "",
    water_previous: "",
    water_current: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReadings = () => {
    authFetch("/api/meter-readings")
      .then((r) => r.json())
      .then((data) => { if (data.success) setReadings(data.data); })
      .catch((e) => console.error("Failed to load meter readings:", e));
  };

  const loadTenants = () => {
    authFetch("/api/tenants")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTenants(data.data.filter((t) => t.status === "Active"));
      })
      .catch((e) => console.error("Failed to load tenants:", e));
  };

  const loadRates = () => {
    authFetch("/api/utility-rates")
      .then((r) => r.json())
      .then((data) => { if (data.success) setRates(data.data); })
      .catch((e) => console.error("Failed to load utility rates:", e));
  };

  useEffect(() => { loadReadings(); loadTenants(); loadRates(); }, []);

  const resetForm = useCallback(() => {
    setFormData({ tenant_id: "", billing_month: "", electricity_previous: "", electricity_current: "", water_previous: "", water_current: "" });
    setFormError("");
    setFormSuccess("");
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingReading(null);
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    if (!showForm) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, closeForm]);

  const openAddForm = () => { setEditingReading(null); resetForm(); setShowForm(true); };

  const openEditForm = (reading) => {
    setEditingReading(reading);
    setFormData({
      tenant_id: String(reading.tenant_id),
      billing_month: reading.billing_month ? reading.billing_month.substring(0, 10) : "",
      electricity_previous: reading.electricity_previous ?? "",
      electricity_current: reading.electricity_current ?? "",
      water_previous: reading.water_previous ?? "",
      water_current: reading.water_current ?? "",
    });
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((c) => ({ ...c, [name]: value }));
    setFormError("");
    setFormSuccess("");
  };

  const electricityConsumption =
    formData.electricity_previous !== "" && formData.electricity_current !== ""
      ? Number(formData.electricity_current) - Number(formData.electricity_previous)
      : null;

  const waterConsumption =
    formData.water_previous !== "" && formData.water_current !== ""
      ? Number(formData.water_current) - Number(formData.water_previous)
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!formData.tenant_id) { setFormError("Tenant is required."); return; }
    if (!formData.billing_month) { setFormError("Billing month is required."); return; }
    const electricityPrevious = Number(formData.electricity_previous);
    const electricityCurrent = Number(formData.electricity_current);
    const waterPrevious = Number(formData.water_previous);
    const waterCurrent = Number(formData.water_current);
    const values = [electricityPrevious, electricityCurrent, waterPrevious, waterCurrent];
    if (values.some((v) => Number.isNaN(v) || v < 0 || v > 99999)) { setFormError("All meter readings must be numbers between 0 and 99,999."); return; }
    if (electricityCurrent < electricityPrevious) { setFormError("Current electricity reading cannot be lower than the previous reading."); return; }
    if (waterCurrent < waterPrevious) { setFormError("Current water reading cannot be lower than the previous reading."); return; }
    setIsSubmitting(true);
    try {
      const isEditing = Boolean(editingReading);
      const url = isEditing ? `/api/meter-readings/${editingReading.id}` : "/api/meter-readings";
      const method = isEditing ? "PUT" : "POST";
      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: Number(formData.tenant_id),
          billing_month: formData.billing_month,
          electricity_previous: electricityPrevious,
          electricity_current: electricityCurrent,
          water_previous: waterPrevious,
          water_current: waterCurrent,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) { setFormError(data.message || `Failed to ${isEditing ? "update" : "record"} meter reading.`); return; }
      setFormSuccess(isEditing ? "Meter reading updated successfully." : "Meter reading recorded successfully.");
      loadReadings();
      setTimeout(() => { closeForm(); }, 800);
    } catch (err) {
      console.error("Failed to save meter reading:", err);
      setFormError("Unable to connect to the backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (reading) => {
    setDeleteTarget(reading);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await authFetch(`/api/meter-readings/${deleteTarget.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        showToast(data.message || "Failed to delete meter reading.", "error");
        return;
      }
      setDeleteTarget(null);
      loadReadings();
    } catch (err) {
      console.error("Failed to delete meter reading:", err);
      showToast("Unable to connect to the backend.", "error");
    }
  };

  const electricRateObj = rates.find((r) => r.utility_type === "Electricity");
  const waterRateObj = rates.find((r) => r.utility_type === "Water");
  const electricRate = electricRateObj ? Number(electricRateObj.rate_per_unit) : 14.25;
  const waterRate = waterRateObj ? Number(waterRateObj.rate_per_unit) : 45.0;

  const isElectric = activeTab === "electric";
  const activeRate = isElectric ? electricRate : waterRate;
  const activeUnit = isElectric ? "kWh" : "Cu.M";

  const totalConsumption = readings.reduce((acc, r) => {
    const val = isElectric ? Number(r.electricity_consumption || 0) : Number(r.water_consumption || 0);
    return acc + val;
  }, 0);
  const totalCharges = totalConsumption * activeRate;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── HEADER ── */}
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#090D16", letterSpacing: "-0.02em", margin: 0 }}>
          Meter Readings
        </h1>
        <p style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0", fontWeight: 500 }}>
          Per-room electricity and water submeter logs used to compute utility charges.
        </p>
      </div>

      {/* ── CONTROLS ROW: TABS SWITCHER & LOG READING ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div className="glass" style={{ display: "inline-flex", borderRadius: "9999px", padding: "4px", gap: "4px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("electric")}
            className={isElectric ? "glass-pill-active" : ""}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              height: "36px",
              padding: "0 18px",
              borderRadius: "9999px",
              border: "none",
              background: isElectric ? undefined : "transparent",
              color: isElectric ? "#090D16" : "#64748B",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ color: isElectric ? "#2563EB" : "inherit" }}><Icons.Electricity /></span>
            Electricity Submeters <span style={{ color: "#64748B", fontSize: "12px" }}>(kWh)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("water")}
            className={!isElectric ? "glass-pill-active" : ""}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              height: "36px",
              padding: "0 18px",
              borderRadius: "9999px",
              border: "none",
              background: !isElectric ? undefined : "transparent",
              color: !isElectric ? "#090D16" : "#64748B",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ color: !isElectric ? "#2563EB" : "inherit" }}><Icons.Droplets /></span>
            Water Submeters <span style={{ color: "#64748B", fontSize: "12px" }}>(Cu.M)</span>
          </button>
        </div>

        <button
          type="button"
          className="btn-cobalt"
          onClick={openAddForm}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            height: "40px",
            padding: "0 20px",
            borderRadius: "9999px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            color: "#FFFFFF",
          }}
        >
          <Icons.Plus /> Log Reading
        </button>
      </div>

      {/* ── 3-COLUMN METRICS ROW (Exact Screenshot 5) ── */}
      <div className="meter-kpi-3col">
        <div className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p className="eyebrow" style={{ margin: 0 }}>TOTAL CONSUMPTION</p>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
            {totalConsumption.toLocaleString("en-PH", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {activeUnit}
          </p>
        </div>
        <div className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p className="eyebrow" style={{ margin: 0 }}>RATE MULTIPLIER</p>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
            {formatCurrency(activeRate)} / {activeUnit}
          </p>
        </div>
        <div className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p className="eyebrow" style={{ margin: 0 }}>COMPUTED CHARGES</p>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
            {formatCurrency(totalCharges)}
          </p>
        </div>
      </div>

      {/* ── COMPUTATION TABLE (Exact Screenshot 5) ── */}
      <div className="glass" style={{ borderRadius: "24px", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#090D16", margin: 0 }}>Computation Table</h2>
          <p style={{ fontSize: "13px", color: "#64748B", margin: "2px 0 0" }}>
            Recorded submeter values · Consumption = Present − Previous, multiplied by active rate.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px 12px 24px" }}>ROOM</th>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>TENANT</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>PREVIOUS</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>PRESENT</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>CONSUMPTION</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>RATE</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>COMPUTED AMOUNT</th>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>DATE</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 24px 12px 16px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {readings.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "48px 24px", textAlign: "center" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#090D16", fontSize: "14px" }}>No Meter Readings Recorded</p>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>
                      Click "+ Log Reading" above to enter submeter values from physical meters.
                    </p>
                  </td>
                </tr>
              ) : (
                readings.map((r) => {
                  const prev = isElectric ? Number(r.electricity_previous ?? 0) : Number(r.water_previous ?? 0);
                  const curr = isElectric ? Number(r.electricity_current ?? 0) : Number(r.water_current ?? 0);
                  const consumption = isElectric ? Number(r.electricity_consumption ?? 0) : Number(r.water_consumption ?? 0);
                  const computedAmt = consumption * activeRate;
                  const dateFormatted = r.billing_month
                    ? new Date(r.billing_month).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—";

                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.05)" }}>
                      <td style={{ padding: "14px 16px 14px 24px", fontWeight: 700, color: "#090D16", fontSize: "13.5px" }}>
                        {r.room_number ? `Room ${r.room_number}` : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 500, color: "#64748B", fontSize: "13.5px" }}>
                        {r.full_name}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontFamily: "monospace", color: "#64748B", fontSize: "13px" }}>
                        {prev.toLocaleString("en-PH", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#090D16", fontSize: "13px" }}>
                        {curr.toLocaleString("en-PH", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: "9999px",
                          border: "1px solid #BFDBFE",
                          background: "#EFF6FF",
                          color: "#1D4ED8",
                          fontSize: "12px",
                          fontWeight: 700,
                          fontFamily: "monospace",
                        }}>
                          {consumption.toLocaleString("en-PH", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {activeUnit}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", color: "#64748B", fontSize: "13px" }}>
                        × {formatCurrency(activeRate)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: "#090D16", fontSize: "13.5px" }}>
                        {formatCurrency(computedAmt)}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#64748B", fontSize: "13px" }}>
                        {dateFormatted}
                      </td>
                      <td style={{ padding: "14px 24px 14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn-pill-action"
                            onClick={() => openEditForm(r)}
                          >
                            <Icons.Edit /> Edit
                          </button>
                          <button
                            type="button"
                            className="btn-pill-action btn-pill-action-danger"
                            onClick={() => handleDelete(r)}
                          >
                            <Icons.Delete /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── LOG / EDIT METER READING MODAL ── */}
      {showForm && (
        <div className="v0-backdrop" onClick={closeForm}>
          <div className="v0-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 24px 16px", borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.01em" }}>
                  {editingReading ? "Edit Meter Reading" : "Log Meter Reading"}
                </h3>
                <p style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0" }}>
                  Enter previous and current submeter readings to calculate consumption.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                style={{ width: "32px", height: "32px", borderRadius: "9999px", border: "none", background: "rgba(15,23,42,0.06)", display: "grid", placeItems: "center", cursor: "pointer", color: "#64748B" }}
                aria-label="Close"
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "18px", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <label className="v0-label">TENANT</label>
                  <select
                    name="tenant_id"
                    value={formData.tenant_id}
                    onChange={handleChange}
                    className="v0-input"
                    required
                  >
                    <option value="">Select active tenant</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}{t.room_number ? ` — Room ${t.room_number}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="v0-label">BILLING MONTH</label>
                  <input
                    type="month"
                    name="billing_month"
                    value={formData.billing_month ? formData.billing_month.substring(0, 7) : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((c) => ({ ...c, billing_month: value ? `${value}-01` : "" }));
                    }}
                    className="v0-input"
                    required
                  />
                </div>
              </div>

              {/* Electricity Fields */}
              <div className="glass-inset" style={{ borderRadius: "20px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#2563EB", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Icons.Electricity /> Electricity Submeter (kWh)
                  </span>
                  {electricityConsumption !== null && !Number.isNaN(electricityConsumption) && (
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#059669" }}>
                      {electricityConsumption.toFixed(1)} kWh consumed
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="v0-label">PREVIOUS</label>
                    <input
                      type="number"
                      name="electricity_previous"
                      min="0"
                      max="99999"
                      step="0.1"
                      value={formData.electricity_previous}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                      }}
                      placeholder="e.g. 100"
                      className="v0-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="v0-label">PRESENT</label>
                    <input
                      type="number"
                      name="electricity_current"
                      min="0"
                      max="99999"
                      step="0.1"
                      value={formData.electricity_current}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                      }}
                      placeholder="e.g. 130"
                      className="v0-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Water Fields */}
              <div className="glass-inset" style={{ borderRadius: "20px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#2563EB", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Icons.Droplets /> Water Submeter (Cu.M)
                  </span>
                  {waterConsumption !== null && !Number.isNaN(waterConsumption) && (
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#059669" }}>
                      {waterConsumption.toFixed(1)} Cu.M consumed
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="v0-label">PREVIOUS</label>
                    <input
                      type="number"
                      name="water_previous"
                      min="0"
                      max="99999"
                      step="0.1"
                      value={formData.water_previous}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                      }}
                      placeholder="e.g. 50"
                      className="v0-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="v0-label">PRESENT</label>
                    <input
                      type="number"
                      name="water_current"
                      min="0"
                      max="99999"
                      step="0.1"
                      value={formData.water_current}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                      }}
                      placeholder="e.g. 60"
                      className="v0-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "10px 14px", borderRadius: "14px", fontSize: "13px", fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              <div style={{ marginTop: "12px", display: "flex", gap: "12px", paddingTop: "16px", borderTop: "1px solid rgba(15,23,42,0.06)" }}>
                <button
                  type="button"
                  className="btn-pill-action"
                  style={{ flex: 1, height: "42px", fontSize: "13.5px" }}
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cobalt"
                  style={{ flex: 1, height: "42px", borderRadius: "9999px", fontSize: "13.5px", fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving…" : editingReading ? "Save Changes" : "Save Reading"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete meter reading?"
        message={
          deleteTarget
            ? `Delete the meter reading for ${deleteTarget.full_name} for ${deleteTarget.billing_month.substring(0, 7)}?`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        isDangerous
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   UTILITY RATES PAGE
───────────────────────────────────────────── */
function UtilityRatesPage() {
  const { showToast } = useToast();
  const [rates, setRates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [formData, setFormData] = useState({ utility_type: "", rate_per_unit: "", effective_from: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRates = async () => {
    try {
      const response = await authFetch("/api/utility-rates");
      const data = await response.json();
      if (!response.ok || !data.success) { setFormError(data.message || "Failed to load utility rates."); return; }
      setRates(data.data);
    } catch (err) {
      console.error("Failed to load utility rates:", err);
      setFormError("Unable to connect to the backend.");
    }
  };

  useEffect(() => { loadRates(); }, []);

  const resetForm = () => {
    setFormData({ utility_type: "", rate_per_unit: "", effective_from: "" });
    setFormError("");
    setFormSuccess("");
    setEditingRate(null);
  };

  const openAddForm = () => { resetForm(); setShowForm(true); };

  const openEditForm = (rate) => {
    setFormData({ utility_type: rate.utility_type, rate_per_unit: rate.rate_per_unit, effective_from: rate.effective_from.substring(0, 10) });
    setFormError("");
    setFormSuccess("");
    setEditingRate(rate);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); resetForm(); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((c) => ({ ...c, [name]: value }));
    setFormError("");
    setFormSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!formData.utility_type) { setFormError("Utility type is required."); return; }
    if (formData.rate_per_unit === "") { setFormError("Rate per unit is required."); return; }
    const rate = Number(formData.rate_per_unit);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 999.99) {
      setFormError("Rate per unit must be a valid number between 0.01 and 999.99.");
      return;
    }
    if (!formData.effective_from) { setFormError("Effective date is required."); return; }
    setIsSubmitting(true);
    try {
      const url = editingRate ? `/api/utility-rates/${editingRate.id}` : "/api/utility-rates";
      const method = editingRate ? "PUT" : "POST";
      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utility_type: formData.utility_type, rate_per_unit: rate, effective_from: formData.effective_from }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) { setFormError(data.message || "Failed to save utility rate."); return; }
      setFormSuccess(editingRate ? "Utility rate updated successfully." : "Utility rate added successfully.");
      await loadRates();
      setTimeout(() => { closeForm(); }, 800);
    } catch (err) {
      console.error("Failed to save utility rate:", err);
      setFormError("Unable to connect to the backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rate) => {
    const confirmed = window.confirm(`Delete the ${rate.utility_type} rate effective ${rate.effective_from.substring(0, 10)}?`);
    if (!confirmed) return;
    try {
      const response = await authFetch(`/api/utility-rates/${rate.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        showToast(data.message || "Failed to delete utility rate.", "error");
        return;
      }
      loadRates();
    } catch (err) {
      console.error("Failed to delete utility rate:", err);
      window.alert("Unable to connect to the backend.");
    }
  };

  // Find latest electricity & water rate
  const electricRates = rates.filter((r) => r.utility_type === "Electricity").sort((a, b) => new Date(b.effective_from) - new Date(a.effective_from));
  const waterRates = rates.filter((r) => r.utility_type === "Water").sort((a, b) => new Date(b.effective_from) - new Date(a.effective_from));

  const currentElectric = electricRates[0] || { rate_per_unit: 14.25, effective_from: "2026-10-01" };
  const currentWater = waterRates[0] || { rate_per_unit: 45.0, effective_from: "2026-10-01" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── PAGE HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p className="eyebrow" style={{ color: "#2563EB", margin: 0 }}>UTILITY RATE MANAGEMENT</p>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#090D16", margin: "4px 0 0", letterSpacing: "-0.02em" }}>
            Utility Rates
          </h1>
          <p style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0", fontWeight: 500 }}>
            Per-unit multipliers applied to submeter consumption on every invoice.
          </p>
        </div>
      </div>

      {/* ── DUAL RATE CARDS (Exact Screenshot 1) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
        {/* Electricity Card */}
        <div className="glass" style={{ borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "44px", height: "44px", borderRadius: "14px", background: "#FEF3C7", border: "1px solid #FDE68A", display: "grid", placeItems: "center", color: "#D97706" }}>
                  <Icons.Electricity />
                </span>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#090D16", margin: 0 }}>Electricity</h2>
                  <p style={{ fontSize: "12.5px", color: "#64748B", margin: "2px 0 0", fontWeight: 500 }}>
                    MERALCO pass-through · submetered
                  </p>
                </div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} /> Active
              </span>
            </div>

            <div style={{ marginTop: "24px" }}>
              <p className="eyebrow" style={{ margin: 0 }}>CURRENT RATE</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "4px" }}>
                <span style={{ fontSize: "36px", fontWeight: 800, color: "#090D16", letterSpacing: "-0.02em" }}>
                  {formatCurrency(currentElectric.rate_per_unit)}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748B" }}>/ kWh</span>
              </div>
            </div>

            <div className="glass-inset" style={{ borderRadius: "14px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginTop: "20px" }}>
              <span style={{ color: "#64748B" }}>
                Effective since <strong style={{ color: "#090D16" }}>{currentElectric.effective_from ? currentElectric.effective_from.substring(0, 10) : "—"}</strong>
              </span>
              <span style={{ color: "#2563EB", fontWeight: 600 }}>Standard pass-through</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-pill-action"
            style={{ width: "100%", height: "40px", justifyContent: "center", fontSize: "13px" }}
            onClick={() => {
              if (currentElectric.id) openEditForm(currentElectric);
              else {
                setFormData({ utility_type: "Electricity", rate_per_unit: String(currentElectric.rate_per_unit), effective_from: "2026-10-01" });
                setShowForm(true);
              }
            }}
          >
            <Icons.Edit /> Schedule Rate Change
          </button>
        </div>

        {/* Water Card */}
        <div className="glass" style={{ borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "44px", height: "44px", borderRadius: "14px", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "grid", placeItems: "center", color: "#2563EB" }}>
                  <Icons.Water />
                </span>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#090D16", margin: 0 }}>Water</h2>
                  <p style={{ fontSize: "12.5px", color: "#64748B", margin: "2px 0 0", fontWeight: 500 }}>
                    Maynilad pass-through · submetered
                  </p>
                </div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} /> Active
              </span>
            </div>

            <div style={{ marginTop: "24px" }}>
              <p className="eyebrow" style={{ margin: 0 }}>CURRENT RATE</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "4px" }}>
                <span style={{ fontSize: "36px", fontWeight: 800, color: "#090D16", letterSpacing: "-0.02em" }}>
                  {formatCurrency(currentWater.rate_per_unit)}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748B" }}>/ Cu.M</span>
              </div>
            </div>

            <div className="glass-inset" style={{ borderRadius: "14px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginTop: "20px" }}>
              <span style={{ color: "#64748B" }}>
                Effective since <strong style={{ color: "#090D16" }}>{currentWater.effective_from ? currentWater.effective_from.substring(0, 10) : "—"}</strong>
              </span>
              <span style={{ color: "#2563EB", fontWeight: 600 }}>Standard pass-through</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-pill-action"
            style={{ width: "100%", height: "40px", justifyContent: "center", fontSize: "13px" }}
            onClick={() => {
              if (currentWater.id) openEditForm(currentWater);
              else {
                setFormData({ utility_type: "Water", rate_per_unit: String(currentWater.rate_per_unit), effective_from: "2026-10-01" });
                setShowForm(true);
              }
            }}
          >
            <Icons.Edit /> Schedule Rate Change
          </button>
        </div>
      </div>

      {/* ── RATE CHANGE AUDIT HISTORY TABLE (Exact Screenshot 1) ── */}
      <div className="glass" style={{ borderRadius: "24px", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#090D16", margin: 0 }}>Rate Change History</h2>
          <p style={{ fontSize: "13px", color: "#64748B", margin: "2px 0 0" }}>
            Audit trail of all recorded electricity and water multiplier adjustments.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px 12px 24px" }}>EFFECTIVE DATE</th>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>UTILITY</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>RATE PER UNIT</th>
                <th className="eyebrow" style={{ textAlign: "center", padding: "12px 16px" }}>STATUS</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 24px 12px 16px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rates.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px 20px" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#090D16", fontSize: "14px" }}>No Rate Adjustments Found</p>
                    <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748B" }}>Utility rate adjustments will appear here once recorded.</p>
                  </td>
                </tr>
              ) : (
                rates.map((rate) => {
                  const isElec = rate.utility_type === "Electricity";
                  return (
                    <tr key={rate.id} style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.05)" }}>
                      <td style={{ padding: "14px 16px 14px 24px", fontFamily: "monospace", fontSize: "12.5px", fontWeight: 600, color: "#090D16" }}>
                        {rate.effective_from ? rate.effective_from.substring(0, 10) : "—"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#090D16", fontSize: "13.5px" }}>
                          {isElec ? (
                            <span style={{ color: "#D97706", display: "grid", placeItems: "center" }}><Icons.Electricity /></span>
                          ) : (
                            <span style={{ color: "#2563EB", display: "grid", placeItems: "center" }}><Icons.Water /></span>
                          )}
                          {rate.utility_type}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: "#090D16", fontSize: "13.5px" }}>
                        {formatCurrency(rate.rate_per_unit)} / {isElec ? "kWh" : "Cu.M"}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 10px", borderRadius: "9999px", fontSize: "11.5px", fontWeight: 600, background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} /> Active
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px 14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn-pill-action"
                            onClick={() => openEditForm(rate)}
                          >
                            <Icons.Edit /> Edit
                          </button>
                          <button
                            type="button"
                            className="btn-pill-action btn-pill-action-danger"
                            onClick={() => handleDelete(rate)}
                          >
                            <Icons.Delete /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SCHEDULE RATE ADJUSTMENT MODAL ── */}
      {showForm && (
        <div className="v0-backdrop" onClick={closeForm} style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="v0-modal" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(15, 23, 42, 0.08)" }}>
              <div>
                <p className="eyebrow" style={{ color: "#2563EB", margin: 0 }}>
                  {editingRate ? "UPDATE UTILITY MULTIPLIER" : "SCHEDULE RATE ADJUSTMENT"}
                </p>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#090D16", margin: "2px 0 0" }}>
                  {editingRate ? "Edit Utility Rate" : "Schedule Rate Adjustment"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeForm}
                style={{ width: "32px", height: "32px", borderRadius: "9999px", border: "1px solid rgba(15,23,42,0.1)", background: "rgba(255,255,255,0.8)", cursor: "pointer", display: "grid", placeItems: "center", color: "#64748B" }}
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="v0-label">UTILITY TYPE *</label>
                <select
                  name="utility_type"
                  value={formData.utility_type}
                  onChange={handleChange}
                  className="v0-select"
                  style={{
                    width: "100%",
                    height: "42px",
                    borderRadius: "9999px",
                    padding: "0 36px 0 16px",
                    background: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid rgba(15, 23, 42, 0.15)",
                    fontSize: "13.5px",
                    fontWeight: 500,
                    color: "#090D16",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                    WebkitAppearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                    backgroundSize: "16px",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <option value="Electricity">Electricity (kWh)</option>
                  <option value="Water">Water (Cu.M)</option>
                </select>
              </div>

              <div>
                <label className="v0-label">RATE PER UNIT (₱) *</label>
                <input
                  type="number"
                  name="rate_per_unit"
                  value={formData.rate_per_unit}
                  onChange={handleChange}
                  min="0.01"
                  max="999.99"
                  step="0.01"
                  placeholder="e.g. 14.50"
                  className="v0-input"
                  onKeyDown={(e) => {
                    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                  }}
                  required
                />
              </div>

              <div>
                <label className="v0-label">EFFECTIVE FROM *</label>
                <input
                  type="date"
                  name="effective_from"
                  value={formData.effective_from}
                  onChange={handleChange}
                  className="v0-input"
                  required
                />
              </div>

              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "14px", padding: "12px 14px", fontSize: "12px", color: "#1E40AF", display: "flex", gap: "8px", alignItems: "center" }}>
                <Icons.Alert />
                <span>This multiplier applies to submeter consumption on all succeeding monthly bills.</span>
              </div>

              {formError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "14px", padding: "10px 14px", fontSize: "12.5px", color: "#DC2626" }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "14px", padding: "10px 14px", fontSize: "12.5px", color: "#059669" }}>
                  {formSuccess}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn-pill-action"
                  onClick={closeForm}
                  style={{ height: "38px", padding: "0 18px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cobalt"
                  disabled={isSubmitting}
                  style={{ height: "38px", padding: "0 22px", borderRadius: "9999px", color: "#FFFFFF", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
                >
                  {isSubmitting ? "Saving…" : editingRate ? "Save Changes" : "Apply Rate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   BILLING PAGE
───────────────────────────────────────────── */
function BillingPage() {
  const [billingRecords, setBillingRecords] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [receiptRecord, setReceiptRecord] = useState(null);
  const [formData, setFormData] = useState({ tenant_id: "", billing_month: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBillingRecords = () => {
    authFetch("/api/billing")
      .then((r) => r.json())
      .then((data) => { if (data.success) setBillingRecords(data.data); })
      .catch((e) => console.error("Failed to load billing records:", e));
  };

  const loadTenants = () => {
    authFetch("/api/tenants")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTenants(data.data.filter((t) => t.status === "Active"));
      })
      .catch((e) => console.error("Failed to load tenants:", e));
  };

  useEffect(() => { loadBillingRecords(); loadTenants(); }, []);

  const resetForm = useCallback(() => {
    setFormData({ tenant_id: "", billing_month: "" });
    setFormError("");
    setFormSuccess("");
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    if (!showForm) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, closeForm]);

  const openAddForm = () => { resetForm(); setShowForm(true); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((c) => ({ ...c, [name]: value }));
    setFormError("");
    setFormSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!formData.tenant_id) { setFormError("Tenant is required."); return; }
    if (!formData.billing_month) { setFormError("Billing month is required."); return; }
    setIsSubmitting(true);
    try {
      const response = await authFetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: Number(formData.tenant_id), billing_month: `${formData.billing_month}-01` }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) { setFormError(data.message || "Failed to generate bill."); return; }
      setFormSuccess("Billing record generated successfully.");
      loadBillingRecords();
      setTimeout(() => { closeForm(); }, 800);
    } catch (err) {
      console.error("Failed to generate billing record:", err);
      setFormError("Unable to connect to the backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (billing, status) => {
    try {
      const response = await authFetch(`/api/billing/${billing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) { window.alert(data.message || "Failed to update billing status."); return; }
      loadBillingRecords();
    } catch (err) {
      console.error("Failed to update billing status:", err);
      window.alert("Unable to connect to the backend.");
    }
  };

  const handleDelete = async (billing) => {
    const confirmed = window.confirm(`Delete the billing record for ${billing.full_name} for ${billing.billing_month.substring(0, 7)}?`);
    if (!confirmed) return;
    try {
      const response = await authFetch(`/api/billing/${billing.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) { window.alert(data.message || "Failed to delete billing record."); return; }
      loadBillingRecords();
    } catch (err) {
      console.error("Failed to delete billing record:", err);
      window.alert("Unable to connect to the backend.");
    }
  };

  const printStatement = (billing) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const month = billing.billing_month ? billing.billing_month.substring(0, 7) : "—";
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Statement of Account - ${billing.full_name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0F172A; max-width: 600px; margin: 0 auto; line-height: 1.5; }
            .header { border-bottom: 2px solid #2563EB; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0; }
            .brand { font-size: 14px; font-weight: 700; color: #2563EB; }
            .meta { margin-bottom: 24px; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 8px; }
            .meta table { width: 100%; }
            .meta td { padding: 4px 0; font-size: 14px; }
            .meta td.label { color: #64748B; font-weight: 600; width: 140px; }
            .meta td.value { font-weight: 700; color: #0F172A; }
            .charges-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .charges-table th, .charges-table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #E2E8F0; }
            .charges-table th { background: #F1F5F9; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; }
            .charges-table td.amount { text-align: right; font-weight: 700; }
            .total-row td { font-size: 16px; font-weight: 800; border-top: 2px solid #0F172A; border-bottom: none; color: #0F172A; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #EFF6FF; color: #2563EB; }
            .footer { margin-top: 40px; font-size: 12px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">TARIPA UTILITY MANAGEMENT</div>
              <h1 class="title">Billing Statement</h1>
            </div>
            <div>
              <span class="badge">${billing.status}</span>
            </div>
          </div>

          <div class="meta">
            <table>
              <tr>
                <td class="label">Tenant Name:</td>
                <td class="value">${billing.full_name}</td>
              </tr>
              <tr>
                <td class="label">Room Assignment:</td>
                <td class="value">${billing.room_number ? `Room ${billing.room_number}` : "Unassigned"}</td>
              </tr>
              <tr>
                <td class="label">Billing Period:</td>
                <td class="value">${month}</td>
              </tr>
            </table>
          </div>

          <table class="charges-table">
            <thead>
              <tr>
                <th>Utility Description</th>
                <th style="text-align: right;">Amount (PHP)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Electricity Charge</td>
                <td class="amount">${formatCurrency(billing.electricity_charge)}</td>
              </tr>
              <tr>
                <td>Water Charge</td>
                <td class="amount">${formatCurrency(billing.water_charge)}</td>
              </tr>
              <tr class="total-row">
                <td>Total Amount Due</td>
                <td class="amount">${formatCurrency(billing.total_amount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            Generated on ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} · TARIPA Residential Management
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter rows
  const filteredRecords = billingRecords.filter((b) => {
    if (statusFilter === "All") return true;
    return b.status === statusFilter;
  });

  // Calculate totals
  const totalBilled = billingRecords.reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const paidRecords = billingRecords.filter((r) => r.status === "Paid");
  const pendingRecords = billingRecords.filter((r) => r.status === "Pending");
  const overdueRecords = billingRecords.filter((r) => r.status === "Overdue");
  const totalCollected = paidRecords.reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const totalOutstanding = totalBilled - totalCollected;
  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : "0.0";

  // Current month label
  const currentMonthLabel = new Date().toLocaleDateString("en-PH", { month: "long", year: "numeric" }).toUpperCase();

  const [paymentModalRecord, setPaymentModalRecord] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [paymentRef, setPaymentRef] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalRecord) return;
    setIsProcessingPayment(true);
    try {
      await handleStatusChange(paymentModalRecord, "Paid");
      setPaymentModalRecord(null);
      setPaymentRef("");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── PAGE HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p className="eyebrow" style={{ color: "#2563EB", margin: 0 }}>BILLING MANAGEMENT</p>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#090D16", margin: "4px 0 0", letterSpacing: "-0.02em" }}>
            Billing & Invoices
          </h1>
          <p style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0", fontWeight: 500 }}>
            Generate monthly bills, record GCash, Maya, cash, and bank payments, and issue official receipts.
          </p>
        </div>
        <button
          type="button"
          className="btn-cobalt"
          onClick={openAddForm}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            height: "38px",
            padding: "0 18px",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            color: "#FFFFFF",
          }}
        >
          <Icons.Plus /> Generate Monthly Bills
        </button>
      </div>

      {/* ── 3 KPI METRICS CARDS (Exact Screenshot 2) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        <div className="glass" style={{ borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p className="eyebrow" style={{ margin: 0 }}>
            TOTAL BILLED · {currentMonthLabel}
          </p>
          <p style={{ fontSize: "32px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
            {formatCurrency(totalBilled)}
          </p>
          <p style={{ fontSize: "12.5px", color: "#64748B", margin: 0, fontWeight: 500 }}>
            {billingRecords.length} invoices issued
          </p>
        </div>

        <div className="glass" style={{ borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p className="eyebrow" style={{ margin: 0 }}>COLLECTED</p>
          <p style={{ fontSize: "32px", fontWeight: 800, color: "#059669", margin: 0, letterSpacing: "-0.02em" }}>
            {formatCurrency(totalCollected)}
          </p>
          <p style={{ fontSize: "12.5px", color: "#64748B", margin: 0, fontWeight: 500 }}>
            {collectionRate}% collection rate
          </p>
        </div>

        <div className="glass" style={{ borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p className="eyebrow" style={{ margin: 0 }}>OUTSTANDING</p>
          <p style={{ fontSize: "32px", fontWeight: 800, color: "#D97706", margin: 0, letterSpacing: "-0.02em" }}>
            {formatCurrency(totalOutstanding)}
          </p>
          <p style={{ fontSize: "12.5px", color: "#64748B", margin: 0, fontWeight: 500 }}>
            {overdueRecords.length} overdue · {pendingRecords.length} pending
          </p>
        </div>
      </div>

      {/* ── MASTER INVOICES TABLE CARD (Exact Screenshot 2) ── */}
      <div className="glass" style={{ borderRadius: "24px", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", padding: "20px 24px 16px", borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#090D16", margin: 0 }}>Master Invoices</h2>
            <p style={{ fontSize: "13px", color: "#64748B", margin: "2px 0 0" }}>
              Submetered electricity, water, and computed totals per tenant.
            </p>
          </div>

          {/* FILTER SEGMENTED CAPSULE */}
          <div className="glass-inset" style={{ display: "inline-flex", gap: "4px", padding: "4px", borderRadius: "9999px" }}>
            {[
              { id: "All", label: `All (${billingRecords.length})` },
              { id: "Paid", label: `Paid (${paidRecords.length})` },
              { id: "Pending", label: `Pending (${pendingRecords.length})` },
              { id: "Overdue", label: `Overdue (${overdueRecords.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={statusFilter === tab.id ? "glass-pill-active" : ""}
                style={{
                  height: "32px",
                  padding: "0 14px",
                  borderRadius: "9999px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: statusFilter === tab.id ? 700 : 500,
                  color: statusFilter === tab.id ? "#090D16" : "#64748B",
                  background: statusFilter === tab.id ? "rgba(255, 255, 255, 0.95)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px 12px 24px" }}>INVOICE #</th>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>TENANT</th>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>ROOM</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>RENT</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>ELECTRIC</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>WATER</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>TOTAL DUE</th>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>DUE DATE</th>
                <th className="eyebrow" style={{ textAlign: "center", padding: "12px 16px" }}>STATUS</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 24px 12px 16px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "40px 20px" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#090D16", fontSize: "14px" }}>No Billing Records Found</p>
                    <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748B" }}>
                      {statusFilter !== "All" ? `No ${statusFilter.toLowerCase()} invoices found.` : "Billing records will appear here once generated."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((billing) => {
                  const initial = (billing.full_name || "T").charAt(0).toUpperCase();
                  const isPaid = billing.status === "Paid";
                  const isOverdue = billing.status === "Overdue";
                  const rentAmount = Math.max(0, Number(billing.total_amount || 0) - Number(billing.electricity_charge || 0) - Number(billing.water_charge || 0));

                  return (
                    <tr key={billing.id} style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.05)" }}>
                      <td style={{ padding: "14px 16px 14px 24px", fontFamily: "monospace", fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                        INV-{String(billing.id).padStart(4, "0")}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ width: "28px", height: "28px", borderRadius: "9999px", background: "linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%)", border: "1px solid #FFFFFF", display: "grid", placeItems: "center", fontSize: "10.5px", fontWeight: 700, color: "#475569" }}>
                            {initial}
                          </span>
                          <span style={{ fontWeight: 600, color: "#090D16", fontSize: "13.5px" }}>{billing.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "8px", background: "#F1F5F9", color: "#334155", fontSize: "12px", fontWeight: 600 }}>
                          {billing.room_number ? `Room ${billing.room_number}` : "Unassigned"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", color: "#475569", fontSize: "13px", fontWeight: 500 }}>
                        {formatCurrency(rentAmount)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", color: "#475569", fontSize: "13px", fontWeight: 500 }}>
                        {formatCurrency(billing.electricity_charge)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", color: "#475569", fontSize: "13px", fontWeight: 500 }}>
                        {formatCurrency(billing.water_charge)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: "#090D16", fontSize: "14px" }}>
                        {formatCurrency(billing.total_amount)}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "12.5px", color: "#64748B", fontWeight: 500 }}>
                        {billing.billing_month ? billing.billing_month.substring(0, 7) : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "2px 10px",
                          borderRadius: "9999px",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          background: isPaid ? "#ECFDF5" : isOverdue ? "#FEF2F2" : "#FFFBEB",
                          color: isPaid ? "#059669" : isOverdue ? "#DC2626" : "#D97706",
                          border: isPaid ? "1px solid #A7F3D0" : isOverdue ? "1px solid #FECACA" : "1px solid #FDE68A",
                        }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
                          {billing.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px 14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn-pill-action"
                            onClick={() => setReceiptRecord(billing)}
                          >
                            View Receipt
                          </button>
                          {!isPaid ? (
                            <button
                              type="button"
                              className="btn-cobalt"
                              style={{
                                height: "32px",
                                padding: "0 14px",
                                borderRadius: "9999px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                color: "#FFFFFF",
                              }}
                              onClick={() => setPaymentModalRecord(billing)}
                            >
                              Record Payment
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="btn-pill-action btn-pill-action-danger"
                            onClick={() => handleDelete(billing)}
                          >
                            <Icons.Delete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── GENERATE BILL MODAL ── */}
      {showForm && (
        <div className="v0-backdrop" onClick={closeForm} style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="v0-modal" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(15, 23, 42, 0.08)" }}>
              <div>
                <p className="eyebrow" style={{ color: "#2563EB", margin: 0 }}>NEW BILLING RECORD</p>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#090D16", margin: "2px 0 0" }}>Generate Monthly Bill</h3>
              </div>
              <button
                type="button"
                onClick={closeForm}
                style={{ width: "32px", height: "32px", borderRadius: "9999px", border: "1px solid rgba(15,23,42,0.1)", background: "rgba(255,255,255,0.8)", cursor: "pointer", display: "grid", placeItems: "center", color: "#64748B" }}
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="v0-label">TENANT *</label>
                <select
                  name="tenant_id"
                  value={formData.tenant_id}
                  onChange={handleChange}
                  className="v0-select"
                  required
                >
                  <option value="">Select active tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}{t.room_number ? ` — Room ${t.room_number}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="v0-label">BILLING MONTH *</label>
                <input
                  type="month"
                  name="billing_month"
                  value={formData.billing_month}
                  onChange={handleChange}
                  className="v0-input"
                  required
                />
              </div>

              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "14px", padding: "12px 14px", fontSize: "12px", color: "#1E40AF", display: "flex", gap: "8px", alignItems: "center" }}>
                <Icons.Alert />
                <span>The system automatically calculates submetered electricity, water, and room rent into one official invoice.</span>
              </div>

              {formError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "14px", padding: "10px 14px", fontSize: "12.5px", color: "#DC2626" }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "14px", padding: "10px 14px", fontSize: "12.5px", color: "#059669" }}>
                  {formSuccess}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn-pill-action"
                  onClick={closeForm}
                  style={{ height: "38px", padding: "0 18px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cobalt"
                  disabled={isSubmitting}
                  style={{ height: "38px", padding: "0 22px", borderRadius: "9999px", color: "#FFFFFF", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
                >
                  {isSubmitting ? "Generating…" : "Generate Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RECORD PAYMENT MODAL ── */}
      {paymentModalRecord && (
        <div className="v0-backdrop" onClick={() => setPaymentModalRecord(null)} style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="v0-modal" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(15, 23, 42, 0.08)" }}>
              <div>
                <p className="eyebrow" style={{ color: "#059669", margin: 0 }}>COLLECTION ENTRY</p>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#090D16", margin: "2px 0 0" }}>Record Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalRecord(null)}
                style={{ width: "32px", height: "32px", borderRadius: "9999px", border: "1px solid rgba(15,23,42,0.1)", background: "rgba(255,255,255,0.8)", cursor: "pointer", display: "grid", placeItems: "center", color: "#64748B" }}
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="glass-inset" style={{ borderRadius: "16px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "11px", color: "#64748B", margin: 0, fontWeight: 600 }}>Invoice #INV-{String(paymentModalRecord.id).padStart(4, "0")}</p>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#090D16", margin: "2px 0 0" }}>{paymentModalRecord.full_name}</p>
                  <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0" }}>{paymentModalRecord.room_number ? `Room ${paymentModalRecord.room_number}` : "Unassigned"}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="eyebrow" style={{ margin: 0 }}>AMOUNT DUE</p>
                  <p style={{ fontSize: "20px", fontWeight: 800, color: "#2563EB", margin: "2px 0 0" }}>{formatCurrency(paymentModalRecord.total_amount)}</p>
                </div>
              </div>

              <div>
                <label className="v0-label">PAYMENT METHOD *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "6px" }}>
                  {["GCash", "Maya", "Cash", "Bank Transfer"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      style={{
                        padding: "10px",
                        borderRadius: "12px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: paymentMethod === method ? "2px solid #2563EB" : "1px solid rgba(15,23,42,0.12)",
                        background: paymentMethod === method ? "#EFF6FF" : "#FFFFFF",
                        color: paymentMethod === method ? "#1E40AF" : "#334155",
                      }}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="v0-label">REFERENCE / TRANSACTION NUMBER (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="e.g. GCash Ref 8291048291"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="v0-input"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn-pill-action"
                  onClick={() => setPaymentModalRecord(null)}
                  style={{ height: "38px", padding: "0 18px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  style={{
                    height: "38px",
                    padding: "0 22px",
                    borderRadius: "9999px",
                    border: "none",
                    background: "#059669",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(5,150,105,0.2)",
                  }}
                >
                  {isProcessingPayment ? "Recording…" : "Mark as Paid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── OFFICIAL RECEIPT POPUP MODAL ── */}
      {receiptRecord && (
        <div className="v0-backdrop" onClick={() => setReceiptRecord(null)} style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="v0-modal" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "520px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(15, 23, 42, 0.08)" }}>
              <div>
                <p className="eyebrow" style={{ color: "#2563EB", margin: 0 }}>OFFICIAL STATEMENT OF ACCOUNT</p>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#090D16", margin: "2px 0 0" }}>TARIPA Boarding House</h3>
                <p style={{ fontSize: "11px", color: "#64748B", fontFamily: "monospace", margin: "2px 0 0" }}>Invoice #INV-{String(receiptRecord.id).padStart(4, "0")}</p>
              </div>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: 600,
                background: receiptRecord.status === "Paid" ? "#ECFDF5" : receiptRecord.status === "Overdue" ? "#FEF2F2" : "#FFFBEB",
                color: receiptRecord.status === "Paid" ? "#059669" : receiptRecord.status === "Overdue" ? "#DC2626" : "#D97706",
                border: receiptRecord.status === "Paid" ? "1px solid #A7F3D0" : receiptRecord.status === "Overdue" ? "1px solid #FECACA" : "1px solid #FDE68A",
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
                {receiptRecord.status}
              </span>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="glass-inset" style={{ borderRadius: "16px", padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12.5px" }}>
                <div>
                  <span style={{ color: "#64748B", display: "block", fontSize: "11px", fontWeight: 600 }}>TENANT NAME</span>
                  <strong style={{ color: "#090D16" }}>{receiptRecord.full_name}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B", display: "block", fontSize: "11px", fontWeight: 600 }}>ROOM ALLOCATION</span>
                  <strong style={{ color: "#090D16" }}>{receiptRecord.room_number ? `Room ${receiptRecord.room_number}` : "Unassigned"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B", display: "block", fontSize: "11px", fontWeight: 600 }}>BILLING PERIOD</span>
                  <strong style={{ color: "#090D16" }}>{receiptRecord.billing_month ? receiptRecord.billing_month.substring(0, 7) : "—"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B", display: "block", fontSize: "11px", fontWeight: 600 }}>ISSUE DATE</span>
                  <strong style={{ color: "#090D16" }}>{new Date().toLocaleDateString("en-PH")}</strong>
                </div>
              </div>

              <div style={{ border: "1px solid rgba(15,23,42,0.08)", borderRadius: "14px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
                      <th className="eyebrow" style={{ textAlign: "left", padding: "10px 14px" }}>DESCRIPTION</th>
                      <th className="eyebrow" style={{ textAlign: "right", padding: "10px 14px" }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid rgba(15,23,42,0.05)" }}>
                      <td style={{ padding: "10px 14px", color: "#334155" }}>Electricity Submeter Charge</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#090D16" }}>{formatCurrency(receiptRecord.electricity_charge)}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(15,23,42,0.05)" }}>
                      <td style={{ padding: "10px 14px", color: "#334155" }}>Water Submeter Charge</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#090D16" }}>{formatCurrency(receiptRecord.water_charge)}</td>
                    </tr>
                    <tr style={{ background: "#EFF6FF" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#090D16" }}>Total Due</td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "#2563EB", fontSize: "15px" }}>{formatCurrency(receiptRecord.total_amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn-pill-action"
                  onClick={() => setReceiptRecord(null)}
                  style={{ height: "38px", padding: "0 18px" }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-cobalt"
                  onClick={() => printStatement(receiptRecord)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    height: "38px",
                    padding: "0 20px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#FFFFFF",
                  }}
                >
                  <Icons.Print /> Print Official Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   REPORTS PAGE
───────────────────────────────────────────── */
function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ billing_month: "", tenant_id: "", room_id: "", status: "" });
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getBillingMonth = (value) => {
    if (!value) return "";
    const text = String(value);
    const match = text.match(/^(\d{4}-\d{2})/);
    if (match) return match[1];
    return "";
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await authFetch("/api/billing");
      if (!response.ok) throw new Error(`Billing API returned ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to load billing reports.");
      setReports(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setReports([]);
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const response = await authFetch("/api/tenants");
      const data = await response.json();
      if (response.ok && data.success) setTenants(Array.isArray(data.data) ? data.data : []);
    } catch (err) { console.error("Failed to load tenants:", err); }
  };

  const loadRooms = async () => {
    try {
      const response = await authFetch("/api/rooms");
      const data = await response.json();
      if (response.ok && data.success) setRooms(Array.isArray(data.data) ? data.data : []);
    } catch (err) { console.error("Failed to load rooms:", err); }
  };

  useEffect(() => { loadReports(); loadTenants(); loadRooms(); }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((c) => ({ ...c, [name]: value }));
  };

  const clearFilters = () => setFilters({ billing_month: "", tenant_id: "", room_id: "", status: "" });

  const filteredReports = reports.filter((report) => {
    const reportMonth = getBillingMonth(report.billing_month);
    const matchesMonth = !filters.billing_month || reportMonth === filters.billing_month;
    const matchesTenant = !filters.tenant_id || String(report.tenant_id) === String(filters.tenant_id);
    const matchesRoom = !filters.room_id || String(report.room_id) === String(filters.room_id);
    const matchesStatus = !filters.status || String(report.status) === String(filters.status);
    return matchesMonth && matchesTenant && matchesRoom && matchesStatus;
  });

  const totalBills = filteredReports.length;
  const totalAmount = filteredReports.reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const totalElectricity = filteredReports.reduce((s, r) => s + Number(r.electricity_charge || 0), 0);
  const totalWater = filteredReports.reduce((s, r) => s + Number(r.water_charge || 0), 0);
  const totalRent = Math.max(0, totalAmount - totalElectricity - totalWater);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const exportToCSV = () => {
    if (!filteredReports.length) return;
    const headers = ["ID", "Tenant", "Room", "Billing Month", "Electricity Charge", "Water Charge", "Total Amount", "Status"];
    const rows = filteredReports.map((r) => [
      r.id,
      `"${(r.full_name || "").replace(/"/g, '""')}"`,
      r.room_number || "Unassigned",
      getBillingMonth(r.billing_month),
      Number(r.electricity_charge || 0).toFixed(2),
      Number(r.water_charge || 0).toFixed(2),
      Number(r.total_amount || 0).toFixed(2),
      r.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `taripa_reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Real occupancy metrics
  const totalSlots = rooms.reduce((s, r) => s + Number(r.capacity || 0), 0);
  const occupiedSlots = rooms.reduce((s, r) => s + Number(r.occupied_count || 0), 0);
  const occupancyPct = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

  // Available years from reports data
  const availableYears = useMemo(() => {
    const years = new Set([2026, new Date().getFullYear()]);
    reports.forEach((r) => {
      const ym = getBillingMonth(r.billing_month);
      if (ym) {
        const y = Number(ym.split("-")[0]);
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [reports]);

  const [chartYear, setChartYear] = useState(2026);

  // Full 12-Month Collections Trend aggregation (Jan - Dec)
  const { monthlyData, ceiling, yAxisLabels } = useMemo(() => {
    const targetYear = chartYear || 2026;

    // Generate all 12 calendar months for the target year
    const months = [];
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const d = new Date(targetYear, monthIndex, 1);
      const year = targetYear;
      const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      const month = d.toLocaleDateString("en-US", { month: "short" });
      months.push({ key, month, year, monthIndex, rent: 0, electric: 0, water: 0, total: 0 });
    }

    filteredReports.forEach((r) => {
      const ym = getBillingMonth(r.billing_month);
      const bucket = months.find((m) => m.key === ym);
      if (bucket) {
        const electric = Number(r.electricity_charge || 0);
        const water = Number(r.water_charge || 0);
        const total = Number(r.total_amount || 0);
        const rent = Math.max(0, total - electric - water);
        bucket.electric += electric;
        bucket.water += water;
        bucket.rent += rent;
        bucket.total += total;
      }
    });

    const maxTotal = Math.max(...months.map((d) => d.total), 0);
    let ceil = 1000;
    if (maxTotal <= 500) ceil = 500;
    else if (maxTotal <= 1000) ceil = 1000;
    else if (maxTotal <= 2000) ceil = 2000;
    else if (maxTotal <= 3000) ceil = 3000;
    else if (maxTotal <= 5000) ceil = 5000;
    else if (maxTotal <= 10000) ceil = 10000;
    else if (maxTotal <= 25000) ceil = 25000;
    else if (maxTotal <= 50000) ceil = 50000;
    else ceil = Math.ceil(maxTotal / 25000) * 25000;

    const formatK = (val) => {
      if (val === 0) return "₱0";
      if (val >= 1000) {
        const k = val / 1000;
        return Number.isInteger(k) ? `₱${k}k` : `₱${k.toFixed(1)}k`;
      }
      return `₱${val}`;
    };

    const labels = [
      formatK(ceil),
      formatK(Math.round(ceil * 0.75)),
      formatK(Math.round(ceil * 0.5)),
      formatK(Math.round(ceil * 0.25)),
      "₱0",
    ];

    return { monthlyData: months, ceiling: ceil, yAxisLabels: labels };
  }, [chartYear, filteredReports]);

  // Real 12-Month Occupancy Trend curve calculation (Jan - Dec)
  const occupancyPoints = useMemo(() => {
    if (!monthlyData.length) return [];
    const count = monthlyData.length; // 12
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();

    return monthlyData.map((m, i) => {
      const endOfMonth = new Date(m.year, m.monthIndex + 1, 0, 23, 59, 59);
      const activeCount = tenants.filter((t) => {
        if (!t.move_in_date) return false;
        const moveIn = new Date(t.move_in_date);
        return moveIn <= endOfMonth;
      }).length;
      const rate = totalSlots > 0 ? Math.min(100, Math.round((activeCount / totalSlots) * 100)) : 0;
      // 12 points evenly spaced on SVG width: paddingLeft=20, paddingRight=20, width=380
      const x = 20 + i * ((380 - 40) / Math.max(1, count - 1));
      const y = 96 - (rate / 100) * 78;
      const isCurrentMonth = m.year === currentYear && m.monthIndex === currentMonthIndex;
      return { ...m, activeCount, rate, x, y, isCurrentMonth };
    });
  }, [monthlyData, tenants, totalSlots]);

  const occPathD = useMemo(() => {
    if (occupancyPoints.length === 0) return "";
    return occupancyPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
  }, [occupancyPoints]);

  const occAreaD = useMemo(() => {
    if (occupancyPoints.length === 0) return "";
    const first = occupancyPoints[0];
    const last = occupancyPoints[occupancyPoints.length - 1];
    return `${occPathD} L ${last.x.toFixed(1)} 106 L ${first.x.toFixed(1)} 106 Z`;
  }, [occupancyPoints, occPathD]);

  // Percentage breakdown
  const rentShare = totalAmount > 0 ? ((totalRent / totalAmount) * 100).toFixed(1) : "0.0";
  const electricShare = totalAmount > 0 ? ((totalElectricity / totalAmount) * 100).toFixed(1) : "0.0";
  const waterShare = totalAmount > 0 ? ((totalWater / totalAmount) * 100).toFixed(1) : "0.0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── PAGE HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p className="eyebrow" style={{ color: "#2563EB", margin: 0 }}>REPORTS & ANALYTICS</p>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#090D16", margin: "4px 0 0", letterSpacing: "-0.02em" }}>
            Reports & Analytics
          </h1>
          <p style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0", fontWeight: 500 }}>
            Collections, occupancy, and an audit trail of every administrative action.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="btn-pill-action"
            onClick={exportToCSV}
            disabled={filteredReports.length === 0}
            style={{ height: "38px", padding: "0 18px", fontSize: "13px" }}
          >
            <Icons.Download /> Export CSV
          </button>
        </div>
      </div>

      {/* ── 4-COLUMN REVENUE KPI GRID (Exact Screenshot 3) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <p className="eyebrow" style={{ margin: 0 }}>TOTAL COLLECTIONS</p>
          <p style={{ fontSize: "28px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
            {formatCurrency(totalAmount)}
          </p>
          <p style={{ fontSize: "12px", color: "#64748B", margin: 0, fontWeight: 500 }}>Recorded revenue</p>
        </div>

        <div className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1D4ED8" }} />
            <p className="eyebrow" style={{ margin: 0 }}>RENT REVENUE</p>
          </div>
          <p style={{ fontSize: "28px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
            {formatCurrency(totalRent)}
          </p>
          <p style={{ fontSize: "12px", color: "#64748B", margin: 0, fontWeight: 500 }}>{rentShare}% share</p>
        </div>

        <div className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#60A5FA" }} />
            <p className="eyebrow" style={{ margin: 0 }}>ELECTRIC REVENUE</p>
          </div>
          <p style={{ fontSize: "28px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
            {formatCurrency(totalElectricity)}
          </p>
          <p style={{ fontSize: "12px", color: "#64748B", margin: 0, fontWeight: 500 }}>{electricShare}% share</p>
        </div>

        <div className="glass" style={{ borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#CBD5E1" }} />
            <p className="eyebrow" style={{ margin: 0 }}>WATER REVENUE</p>
          </div>
          <p style={{ fontSize: "28px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
            {formatCurrency(totalWater)}
          </p>
          <p style={{ fontSize: "12px", color: "#64748B", margin: 0, fontWeight: 500 }}>{waterShare}% share</p>
        </div>
      </div>

      {/* ── 2-COLUMN VISUAL CHARTS (Exact Screenshot 3) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
        {/* Monthly Revenue Stacked Bar Chart */}
        <div className="glass" style={{ borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#090D16", margin: 0 }}>Monthly Collections Trend</h3>
                {availableYears.length > 1 ? (
                  <select
                    value={chartYear}
                    onChange={(e) => setChartYear(Number(e.target.value))}
                    className="v0-input"
                    style={{ height: "26px", padding: "0 8px", fontSize: "11px", minWidth: "65px", cursor: "pointer", fontWeight: 700 }}
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 8px", borderRadius: "9999px" }}>
                    {chartYear}
                  </span>
                )}
              </div>
              <p style={{ fontSize: "12.5px", color: "#64748B", margin: "2px 0 0" }}>
                Rent, electricity, and water breakdown (Full Year {chartYear})
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1D4ED8" }} /> Rent
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#60A5FA" }} /> Electric
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#CBD5E1" }} /> Water
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", height: "200px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", paddingBottom: "24px", fontSize: "10px", color: "#94A3B8", textAlign: "right", minWidth: "36px" }}>
              {yAxisLabels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>

            <div style={{ display: "flex", flex: 1, height: "100%", alignItems: "flex-end", justifyContent: "space-between", borderBottom: "1px solid rgba(15,23,42,0.08)", paddingBottom: "8px", gap: "3px" }}>
              {monthlyData.map((d) => {
                const sum = d.rent + d.electric + d.water;
                const totalPct = ceiling > 0 ? Math.min(100, (sum / ceiling) * 100) : 0;
                const isCurrent = d.year === new Date().getFullYear() && d.monthIndex === new Date().getMonth();
                return (
                  <div key={d.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: "16px", maxWidth: "28px", height: "100%", justifyContent: "flex-end" }}>
                    <div
                      style={{
                        width: "100%",
                        height: sum > 0 ? `${Math.max(6, totalPct)}%` : "4px",
                        borderRadius: "5px 5px 0 0",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        background: sum === 0 ? "rgba(148,163,184,0.15)" : undefined,
                        boxShadow: sum > 0 ? "0 2px 4px rgba(15,23,42,0.08)" : undefined,
                        transition: "height 0.3s ease",
                      }}
                      title={`${d.month} ${d.year}: ${formatCurrency(sum)} (Electric: ${formatCurrency(d.electric)}, Water: ${formatCurrency(d.water)}${d.rent > 0 ? `, Rent: ${formatCurrency(d.rent)}` : ""})`}
                    >
                      {sum > 0 ? (
                        <>
                          {d.rent > 0 && <div style={{ height: `${(d.rent / sum) * 100}%`, background: "#1D4ED8" }} />}
                          {d.electric > 0 && <div style={{ height: `${(d.electric / sum) * 100}%`, background: "#60A5FA" }} />}
                          {d.water > 0 && <div style={{ height: `${(d.water / sum) * 100}%`, background: "#CBD5E1" }} />}
                        </>
                      ) : null}
                    </div>
                    <span style={{ fontSize: "9.5px", fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "#1D4ED8" : (sum > 0 ? "#090D16" : "#94A3B8"), marginTop: "8px" }}>
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Occupancy Trend SVG Area Chart */}
        <div className="glass" style={{ borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#090D16", margin: 0 }}>Occupancy Trend</h3>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 8px", borderRadius: "9999px" }}>
                {chartYear}
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "#64748B", margin: "2px 0 0" }}>
              Bedspace utilization, Full Year {chartYear} (12 months)
            </p>

            <div style={{ marginTop: "16px" }}>
              <p style={{ fontSize: "36px", fontWeight: 800, color: "#090D16", margin: 0, letterSpacing: "-0.02em" }}>
                {occupancyPct.toFixed(1)}%
              </p>
              <p style={{ fontSize: "12.5px", color: "#64748B", margin: "2px 0 0", fontWeight: 500 }}>
                {occupiedSlots} of {totalSlots} slots occupied
              </p>
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <svg viewBox="0 0 380 130" style={{ width: "100%", height: "auto" }}>
              <defs>
                <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Reference Grid lines */}
              <line x1="20" y1="18" x2="360" y2="18" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="20" y1="57" x2="360" y2="57" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="20" y1="96" x2="360" y2="96" stroke="#F1F5F9" strokeDasharray="3 3" />

              {/* Area fill */}
              {occAreaD && <path d={occAreaD} fill="url(#occGrad)" />}

              {/* Line graph */}
              {occPathD && (
                <path
                  d={occPathD}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points and month labels */}
              {occupancyPoints.map((p) => {
                const isCurrent = p.isCurrentMonth;
                return (
                  <g key={p.key}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isCurrent ? 4.5 : 3}
                      fill={isCurrent ? "#2563EB" : (p.rate > 0 ? "#FFFFFF" : "#F8FAFC")}
                      stroke="#2563EB"
                      strokeWidth={isCurrent ? 2 : 1.5}
                    >
                      <title>{`${p.month} ${p.year}: ${p.rate}% (${p.activeCount}/${totalSlots} slots occupied)`}</title>
                    </circle>
                    <text
                      x={p.x}
                      y="118"
                      textAnchor="middle"
                      fill={isCurrent ? "#090D16" : "#94A3B8"}
                      fontSize="9"
                      fontWeight={isCurrent ? "700" : "500"}
                    >
                      {p.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* ── DETAILED AUDIT TRAIL TABLE CARD (Exact Screenshot 3) ── */}
      <div className="glass" style={{ borderRadius: "24px", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", padding: "20px 24px 16px", borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#090D16", margin: 0 }}>Detailed Invoices Audit Trail</h2>
            <p style={{ fontSize: "13px", color: "#64748B", margin: "2px 0 0" }}>
              {filteredReports.length} recorded bills matching current filter criteria.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="v0-input"
              style={{ width: "auto", minWidth: "120px", height: "36px", cursor: "pointer", fontSize: "12.5px" }}
            >
              <option value="">All statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>

            <select
              name="room_id"
              value={filters.room_id}
              onChange={handleFilterChange}
              className="v0-input"
              style={{ width: "auto", minWidth: "120px", height: "36px", cursor: "pointer", fontSize: "12.5px" }}
            >
              <option value="">All rooms</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>Room {r.room_number}</option>
              ))}
            </select>

            <select
              name="tenant_id"
              value={filters.tenant_id}
              onChange={handleFilterChange}
              className="v0-input"
              style={{ width: "auto", minWidth: "130px", height: "36px", cursor: "pointer", fontSize: "12.5px" }}
            >
              <option value="">All tenants</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn-pill-action"
                onClick={clearFilters}
                style={{ height: "36px", fontSize: "12px" }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.06)" }}>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px 12px 24px" }}>INVOICE #</th>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>TENANT</th>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>ROOM</th>
                <th className="eyebrow" style={{ textAlign: "left", padding: "12px 16px" }}>BILLING MONTH</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>ELECTRICITY</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>WATER</th>
                <th className="eyebrow" style={{ textAlign: "right", padding: "12px 16px" }}>TOTAL AMOUNT</th>
                <th className="eyebrow" style={{ textAlign: "center", padding: "12px 24px 12px 16px" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px 20px" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#090D16", fontSize: "14px" }}>No Records Found</p>
                    <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748B" }}>No records matched your selected criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const initial = (r.full_name || "T").charAt(0).toUpperCase();
                  const isPaid = r.status === "Paid";
                  const isOverdue = r.status === "Overdue";
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.05)" }}>
                      <td style={{ padding: "14px 16px 14px 24px", fontFamily: "monospace", fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
                        INV-{String(r.id).padStart(4, "0")}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ width: "28px", height: "28px", borderRadius: "9999px", background: "linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%)", border: "1px solid #FFFFFF", display: "grid", placeItems: "center", fontSize: "10.5px", fontWeight: 700, color: "#475569" }}>
                            {initial}
                          </span>
                          <span style={{ fontWeight: 600, color: "#090D16", fontSize: "13.5px" }}>{r.full_name || "Unknown"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "8px", background: "#F1F5F9", color: "#334155", fontSize: "12px", fontWeight: 600 }}>
                          {r.room_number ? `Room ${r.room_number}` : "Unassigned"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "12.5px", color: "#64748B", fontWeight: 500 }}>
                        {getBillingMonth(r.billing_month)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", color: "#475569", fontSize: "13px", fontWeight: 500 }}>
                        {formatCurrency(r.electricity_charge)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", color: "#475569", fontSize: "13px", fontWeight: 500 }}>
                        {formatCurrency(r.water_charge)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: "#090D16", fontSize: "14px" }}>
                        {formatCurrency(r.total_amount)}
                      </td>
                      <td style={{ padding: "14px 24px 14px 16px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "2px 10px",
                          borderRadius: "9999px",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          background: isPaid ? "#ECFDF5" : isOverdue ? "#FEF2F2" : "#FFFBEB",
                          color: isPaid ? "#059669" : isOverdue ? "#DC2626" : "#D97706",
                          border: isPaid ? "1px solid #A7F3D0" : isOverdue ? "1px solid #FECACA" : "1px solid #FDE68A",
                        }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
