import { useEffect, useState, useCallback, useRef } from "react";
import "./ClientApp.css";

/* ─────────────────────────────────────────────
   CLIENT AUTH CONSTANTS
   Keys are isolated from admin auth keys:
     admin uses: taripa_admin_token / taripa_admin_user
     client uses: taripa_client_token / taripa_client_tenant
───────────────────────────────────────────── */
const TOKEN_KEY  = "taripa_client_token";
const TENANT_KEY = "taripa_client_tenant";

/* ─────────────────────────────────────────────
   CLIENT AUTH HELPERS
───────────────────────────────────────────── */
const getToken  = () => localStorage.getItem(TOKEN_KEY);
const getTenant = () => {
  try { return JSON.parse(localStorage.getItem(TENANT_KEY)); } catch { return null; }
};
const saveAuth  = (token, tenant) => {
  localStorage.setItem(TOKEN_KEY,  token);
  localStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
};
/** Clears ONLY client auth — admin keys are intentionally untouched */
const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TENANT_KEY);
};

/**
 * clientFetch — authenticated fetch for all client portal API calls.
 * • Attaches the client Bearer token.
 * • On 401, clears CLIENT auth only and redirects to /client/login.
 *   Admin auth (taripa_admin_token) is never touched here.
 */
const clientFetch = async (url, options = {}) => {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) {
    clearAuth();
    // Replace history so back button doesn't loop
    window.history.replaceState(null, "", "/client/login");
    window.location.reload();
    // Return a never-resolving promise so callers don't process partial state
    return new Promise(() => {});
  }
  return res;
};

/* ─────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────── */
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
};

const formatMonthYear = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long" });
};

/* ─────────────────────────────────────────────
   SVG ICONS
───────────────────────────────────────────── */
const Icons = {
  Home: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Bills: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Meter: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  Profile: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Room: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.38 2 2 0 0 1 3.04 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />
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
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    Active:   "cb-badge-active",
    Inactive: "cb-badge-inactive",
    Paid:     "cb-badge-paid",
    Pending:  "cb-badge-pending",
    Overdue:  "cb-badge-overdue",
  };
  return (
    <span className={`cb-status-badge ${map[status] ?? "cb-badge-default"}`}>
      {status}
    </span>
  );
}

/* ─────────────────────────────────────────────
   LOADING SPINNER
───────────────────────────────────────────── */
function Spinner({ message = "Loading…" }) {
  return (
    <div className="cb-spinner-wrap">
      <div className="cb-spinner" />
      <p className="cb-spinner-text">{message}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ERROR STATE
───────────────────────────────────────────── */
function ErrorMessage({ message, onRetry }) {
  return (
    <div className="cb-error-state">
      <span className="cb-error-icon"><Icons.Alert /></span>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="cb-btn-secondary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SESSION INIT SCREEN
   Shown briefly while validating the stored token.
───────────────────────────────────────────── */
function SessionInitScreen() {
  return (
    <div className="cb-session-init">
      <div className="cb-session-init-inner">
        <div className="cb-session-spinner" />
        <p>Verifying session…</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOGIN PAGE
───────────────────────────────────────────── */
function LoginPage({ onLogin }) {
  const [username,    setUsername]    = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState("");
  const [isLoading,   setIsLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) { setError("Please enter your username."); return; }
    if (!password)        { setError("Please enter your password."); return; }

    setIsLoading(true);
    try {
      const res  = await fetch("/api/client/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Login failed. Please check your credentials.");
        return;
      }

      saveAuth(data.data.token, data.data.tenant);
      onLogin(data.data.tenant);
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cb-login-page">
      <div className="cb-login-card">

        {/* Brand */}
        <div className="cb-login-brand">
          <div className="cb-login-brand-mark">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="cb-login-brand-text">
            <strong>TARIPA</strong>
            <span>Tenant Portal</span>
          </div>
        </div>

        {/* Header */}
        <div className="cb-login-header">
          <h1 className="cb-login-title">Welcome back</h1>
          <p className="cb-login-subtitle">Sign in to view your bills and utility usage.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="cb-login-fields">

            {/* Username */}
            <label className="cb-field">
              <span className="cb-field-label">USERNAME</span>
              <input
                type="text"
                className="cb-field-input"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                disabled={isLoading}
              />
            </label>

            {/* Password with show/hide toggle */}
            <label className="cb-field">
              <span className="cb-field-label">PASSWORD</span>
              <div className="cb-field-input-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  className="cb-field-input cb-field-input-padded"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="cb-field-eye-btn"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  tabIndex={-1}
                  disabled={isLoading}
                >
                  {showPass ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="cb-login-error" role="alert">
              <Icons.Alert /> {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="cb-btn-primary cb-btn-full cb-login-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="cb-btn-spinner" />
                Signing in…
              </>
            ) : "Sign In"}
          </button>
        </form>

        <p className="cb-login-footer">
          Having trouble? Contact your building administrator.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DASHBOARD PAGE
───────────────────────────────────────────── */
function DashboardPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await clientFetch("/api/client/dashboard");
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Failed to load dashboard data.");
        return;
      }
      setData(json.data);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner message="Loading dashboard…" />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;
  if (!data)   return null;

  const { tenant, latest_bill, outstanding, latest_meter, recent_bills } = data;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="cb-page">

      {/* Hero */}
      <div className="cb-dashboard-hero">
        <div className="cb-dashboard-hero-body">
          <p className="cb-eyebrow">TENANT DASHBOARD</p>
          <h2 className="cb-dashboard-title">
            {greeting}, {tenant.full_name.split(" ")[0]}!
          </h2>
          <p className="cb-dashboard-sub">
            Room {tenant.room_number ?? "—"}&nbsp;·&nbsp;
            <StatusBadge status={tenant.status} />
          </p>
        </div>
        <div className="cb-dashboard-hero-emblem" aria-hidden="true">
          <Icons.Meter />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="cb-kpi-grid">

        {/* Outstanding balance */}
        <div className="cb-kpi-card cb-kpi-warning">
          <div className="cb-kpi-icon"><Icons.Bills /></div>
          <div className="cb-kpi-body">
            <span className="cb-kpi-label">Outstanding Balance</span>
            <strong className="cb-kpi-value cb-kpi-value-lg">
              {formatCurrency(outstanding.amount)}
            </strong>
            <small className="cb-kpi-sub">
              {outstanding.count === 0
                ? "No pending bills"
                : `${outstanding.count} bill${outstanding.count > 1 ? "s" : ""} pending/overdue`}
            </small>
          </div>
        </div>

        {/* Latest bill */}
        <div className="cb-kpi-card cb-kpi-indigo">
          <div className="cb-kpi-icon"><Icons.Bills /></div>
          <div className="cb-kpi-body">
            <span className="cb-kpi-label">Latest Bill</span>
            {latest_bill ? (
              <>
                <strong className="cb-kpi-value cb-kpi-value-lg">
                  {formatCurrency(latest_bill.total_amount)}
                </strong>
                <small className="cb-kpi-sub">
                  {formatMonthYear(latest_bill.billing_month)}&nbsp;·&nbsp;
                  <StatusBadge status={latest_bill.status} />
                </small>
              </>
            ) : (
              <>
                <strong className="cb-kpi-value">—</strong>
                <small className="cb-kpi-sub">No billing records yet</small>
              </>
            )}
          </div>
        </div>

        {/* Last electricity */}
        <div className="cb-kpi-card cb-kpi-electric">
          <div className="cb-kpi-icon"><Icons.Electricity /></div>
          <div className="cb-kpi-body">
            <span className="cb-kpi-label">Last Electricity Usage</span>
            {latest_meter ? (
              <>
                <strong className="cb-kpi-value">
                  {Number(latest_meter.electricity_consumption).toFixed(1)}
                  <span className="cb-kpi-unit">kWh</span>
                </strong>
                <small className="cb-kpi-sub">{formatMonthYear(latest_meter.billing_month)}</small>
              </>
            ) : (
              <>
                <strong className="cb-kpi-value">—</strong>
                <small className="cb-kpi-sub">No readings yet</small>
              </>
            )}
          </div>
        </div>

        {/* Last water */}
        <div className="cb-kpi-card cb-kpi-water">
          <div className="cb-kpi-icon"><Icons.Water /></div>
          <div className="cb-kpi-body">
            <span className="cb-kpi-label">Last Water Usage</span>
            {latest_meter ? (
              <>
                <strong className="cb-kpi-value">
                  {Number(latest_meter.water_consumption).toFixed(1)}
                  <span className="cb-kpi-unit">m³</span>
                </strong>
                <small className="cb-kpi-sub">{formatMonthYear(latest_meter.billing_month)}</small>
              </>
            ) : (
              <>
                <strong className="cb-kpi-value">—</strong>
                <small className="cb-kpi-sub">No readings yet</small>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bills table */}
      {recent_bills.length > 0 && (
        <div className="cb-section">
          <div className="cb-section-header">
            <div>
              <p className="cb-eyebrow">RECENT ACTIVITY</p>
              <h3 className="cb-section-title">Recent Bills</h3>
            </div>
          </div>
          <div className="cb-table-wrap">
            <table className="cb-table">
              <thead>
                <tr>
                  <th>Billing Period</th>
                  <th>Electricity</th>
                  <th>Water</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent_bills.map((bill) => (
                  <tr key={bill.id}>
                    <td>{formatMonthYear(bill.billing_month)}</td>
                    <td>{formatCurrency(bill.electricity_charge)}</td>
                    <td>{formatCurrency(bill.water_charge)}</td>
                    <td><strong>{formatCurrency(bill.total_amount)}</strong></td>
                    <td><StatusBadge status={bill.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recent_bills.length === 0 && (
        <div className="cb-empty-state">
          <div className="cb-empty-icon"><Icons.Bills /></div>
          <h3>No billing records yet</h3>
          <p>Your billing history will appear here once records are created.</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   BILLS PAGE
───────────────────────────────────────────── */
function BillsPage() {
  const [bills,    setBills]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await clientFetch("/api/client/bills");
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Failed to load billing records.");
        return;
      }
      setBills(json.data);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner message="Loading bills…" />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div className="cb-page">
      <div className="cb-page-header">
        <p className="cb-eyebrow">BILLING HISTORY</p>
        <h2 className="cb-page-title">My Bills</h2>
        <p className="cb-page-desc">Your complete billing history with itemized charges.</p>
      </div>

      {bills.length === 0 ? (
        <div className="cb-empty-state">
          <div className="cb-empty-icon"><Icons.Bills /></div>
          <h3>No billing records</h3>
          <p>Your bill history will appear here once billing records are created.</p>
        </div>
      ) : (
        <>
          {/* Mobile accordion cards */}
          <div className="cb-bills-list">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className={`cb-bill-card ${expanded === bill.id ? "expanded" : ""}`}
              >
                <button
                  type="button"
                  className="cb-bill-card-header"
                  onClick={() => setExpanded(expanded === bill.id ? null : bill.id)}
                  aria-expanded={expanded === bill.id}
                >
                  <div className="cb-bill-card-main">
                    <div className="cb-bill-month">{formatMonthYear(bill.billing_month)}</div>
                    <div className="cb-bill-amount">{formatCurrency(bill.total_amount)}</div>
                  </div>
                  <div className="cb-bill-card-right">
                    <StatusBadge status={bill.status} />
                    <span className="cb-bill-chevron"><Icons.ChevronDown /></span>
                  </div>
                </button>

                {expanded === bill.id && (
                  <div className="cb-bill-card-detail">
                    <div className="cb-bill-detail-grid">
                      <div className="cb-bill-detail-row">
                        <span className="cb-bill-detail-label"><Icons.Electricity /> Electricity Usage</span>
                        <span>{Number(bill.electricity_consumption).toFixed(3)} kWh</span>
                      </div>
                      <div className="cb-bill-detail-row">
                        <span className="cb-bill-detail-label"><Icons.Electricity /> Electricity Charge</span>
                        <span>{formatCurrency(bill.electricity_charge)}</span>
                      </div>
                      <div className="cb-bill-detail-row">
                        <span className="cb-bill-detail-label"><Icons.Water /> Water Usage</span>
                        <span>{Number(bill.water_consumption).toFixed(3)} m³</span>
                      </div>
                      <div className="cb-bill-detail-row">
                        <span className="cb-bill-detail-label"><Icons.Water /> Water Charge</span>
                        <span>{formatCurrency(bill.water_charge)}</span>
                      </div>
                      <div className="cb-bill-detail-row cb-bill-detail-total">
                        <span className="cb-bill-detail-label">Total Amount</span>
                        <span>{formatCurrency(bill.total_amount)}</span>
                      </div>
                      <div className="cb-bill-detail-row">
                        <span className="cb-bill-detail-label">Date Issued</span>
                        <span>{formatDate(bill.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="cb-table-wrap cb-desktop-only">
            <table className="cb-table">
              <thead>
                <tr>
                  <th>Billing Period</th>
                  <th>Electricity (kWh)</th>
                  <th>Elec. Charge</th>
                  <th>Water (m³)</th>
                  <th>Water Charge</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date Issued</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    <td>{formatMonthYear(bill.billing_month)}</td>
                    <td>{Number(bill.electricity_consumption).toFixed(3)}</td>
                    <td>{formatCurrency(bill.electricity_charge)}</td>
                    <td>{Number(bill.water_consumption).toFixed(3)}</td>
                    <td>{formatCurrency(bill.water_charge)}</td>
                    <td><strong>{formatCurrency(bill.total_amount)}</strong></td>
                    <td><StatusBadge status={bill.status} /></td>
                    <td>{formatDate(bill.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   METER READINGS PAGE
───────────────────────────────────────────── */
function MeterReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await clientFetch("/api/client/meter-readings");
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Failed to load meter readings.");
        return;
      }
      setReadings(json.data);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner message="Loading meter readings…" />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div className="cb-page">
      <div className="cb-page-header">
        <p className="cb-eyebrow">UTILITY USAGE</p>
        <h2 className="cb-page-title">Meter Readings</h2>
        <p className="cb-page-desc">Your electricity and water meter readings by billing period.</p>
      </div>

      {readings.length === 0 ? (
        <div className="cb-empty-state">
          <div className="cb-empty-icon"><Icons.Meter /></div>
          <h3>No meter readings</h3>
          <p>Your meter readings will appear here once they are recorded.</p>
        </div>
      ) : (
        <div className="cb-readings-grid">
          {readings.map((r) => (
            <article className="cb-reading-card" key={r.id}>
              <div className="cb-reading-month">{formatMonthYear(r.billing_month)}</div>

              <div className="cb-reading-section cb-reading-electric">
                <div className="cb-reading-section-label">
                  <Icons.Electricity /> Electricity
                </div>
                <div className="cb-reading-row">
                  <div className="cb-reading-item">
                    <span className="cb-reading-item-label">Previous</span>
                    <span className="cb-reading-item-val">{Number(r.electricity_previous).toFixed(3)}</span>
                    <span className="cb-reading-unit">kWh</span>
                  </div>
                  <div className="cb-reading-arrow">→</div>
                  <div className="cb-reading-item">
                    <span className="cb-reading-item-label">Current</span>
                    <span className="cb-reading-item-val">{Number(r.electricity_current).toFixed(3)}</span>
                    <span className="cb-reading-unit">kWh</span>
                  </div>
                  <div className="cb-reading-usage">
                    <span className="cb-reading-usage-label">Usage</span>
                    <strong>{Number(r.electricity_consumption).toFixed(3)} kWh</strong>
                  </div>
                </div>
              </div>

              <div className="cb-reading-section cb-reading-water">
                <div className="cb-reading-section-label">
                  <Icons.Water /> Water
                </div>
                <div className="cb-reading-row">
                  <div className="cb-reading-item">
                    <span className="cb-reading-item-label">Previous</span>
                    <span className="cb-reading-item-val">{Number(r.water_previous).toFixed(3)}</span>
                    <span className="cb-reading-unit">m³</span>
                  </div>
                  <div className="cb-reading-arrow">→</div>
                  <div className="cb-reading-item">
                    <span className="cb-reading-item-label">Current</span>
                    <span className="cb-reading-item-val">{Number(r.water_current).toFixed(3)}</span>
                    <span className="cb-reading-unit">m³</span>
                  </div>
                  <div className="cb-reading-usage">
                    <span className="cb-reading-usage-label">Usage</span>
                    <strong>{Number(r.water_consumption).toFixed(3)} m³</strong>
                  </div>
                </div>
              </div>

              {r.recorded_at && (
                <div className="cb-reading-footer">
                  Recorded: {formatDate(r.recorded_at)}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROFILE PAGE
───────────────────────────────────────────── */
function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await clientFetch("/api/client/profile");
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Failed to load profile.");
        return;
      }
      setProfile(json.data);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner message="Loading profile…" />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;
  if (!profile) return null;

  return (
    <div className="cb-page">
      <div className="cb-page-header">
        <p className="cb-eyebrow">MY ACCOUNT</p>
        <h2 className="cb-page-title">Profile</h2>
        <p className="cb-page-desc">Your tenant account information.</p>
      </div>

      <div className="cb-profile-card">
        <div className="cb-profile-avatar">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        <h3 className="cb-profile-name">{profile.full_name}</h3>
        <StatusBadge status={profile.status} />

        <div className="cb-profile-details">
          <div className="cb-profile-detail-row">
            <span className="cb-profile-detail-label"><Icons.Profile /> Username</span>
            <span className="cb-profile-detail-value">{profile.username}</span>
          </div>
          <div className="cb-profile-detail-row">
            <span className="cb-profile-detail-label"><Icons.Phone /> Contact Number</span>
            <span className="cb-profile-detail-value">{profile.contact_number || "Not provided"}</span>
          </div>
          <div className="cb-profile-detail-row">
            <span className="cb-profile-detail-label"><Icons.Room /> Room</span>
            <span className="cb-profile-detail-value">
              {profile.room_number ? `Room ${profile.room_number}` : "Not assigned"}
            </span>
          </div>
          <div className="cb-profile-detail-row">
            <span className="cb-profile-detail-label"><Icons.Calendar /> Move-in Date</span>
            <span className="cb-profile-detail-value">{formatDate(profile.move_in_date)}</span>
          </div>
          <div className="cb-profile-detail-row">
            <span className="cb-profile-detail-label"><Icons.Calendar /> Member Since</span>
            <span className="cb-profile-detail-value">{formatDate(profile.created_at)}</span>
          </div>
        </div>

        <div className="cb-profile-note">
          <Icons.Alert />
          To update your information, please contact your building administrator.
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PORTAL SHELL (authenticated layout)
───────────────────────────────────────────── */
const navItems = [
  { id: "dashboard", label: "Dashboard",      Icon: Icons.Home    },
  { id: "bills",     label: "My Bills",        Icon: Icons.Bills   },
  { id: "meters",    label: "Meter Readings",  Icon: Icons.Meter   },
  { id: "profile",   label: "Profile",         Icon: Icons.Profile },
];

function PortalShell({ tenant, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [menuOpen,   setMenuOpen]   = useState(false);

  const handleLogout = () => {
    clearAuth();   // Only clears taripa_client_token / taripa_client_tenant
    onLogout();
  };

  return (
    <div className="cb-shell">

      {/* ── SIDEBAR ── */}
      <aside className={`cb-sidebar ${menuOpen ? "cb-sidebar-open" : ""}`}>

        {/* Brand */}
        <div className="cb-sidebar-brand">
          <div className="cb-sidebar-brand-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="cb-sidebar-brand-text">
            <strong>TARIPA</strong>
            <span>Tenant Portal</span>
          </div>
        </div>

        {/* Tenant identity */}
        <div className="cb-sidebar-tenant">
          <div className="cb-sidebar-avatar">
            {tenant.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="cb-sidebar-tenant-info">
            <strong>{tenant.full_name}</strong>
            <span>{tenant.room_number ? `Room ${tenant.room_number}` : "No room assigned"}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="cb-sidebar-nav">
          <p className="cb-sidebar-nav-label">MENU</p>
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`cb-nav-item ${activePage === id ? "active" : ""}`}
              onClick={() => { setActivePage(id); setMenuOpen(false); }}
            >
              <span className="cb-nav-icon"><Icon /></span>
              <span className="cb-nav-label">{label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="cb-sidebar-footer">
          <button type="button" className="cb-logout-btn" onClick={handleLogout}>
            <Icons.Logout />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="cb-sidebar-overlay" onClick={() => setMenuOpen(false)} />
      )}

      {/* ── MAIN AREA ── */}
      <div className="cb-main">

        {/* Mobile top bar */}
        <header className="cb-topbar">
          <button
            type="button"
            className="cb-topbar-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <Icons.Menu />
          </button>
          <div className="cb-topbar-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <strong>TARIPA</strong>
          </div>
          <div className="cb-topbar-right">
            <div className="cb-topbar-avatar">
              {tenant.full_name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="cb-content">
          {activePage === "dashboard" && <DashboardPage />}
          {activePage === "bills"     && <BillsPage />}
          {activePage === "meters"    && <MeterReadingsPage />}
          {activePage === "profile"   && <ProfilePage />}
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT CLIENT APP
   Auth flow:
     1. On mount, if a token exists in localStorage,
        validate it server-side via GET /api/client/me.
     2. If valid → enter the portal with the fresh profile.
     3. If invalid/expired → clear auth and show login.
     4. If no token → show login immediately.
───────────────────────────────────────────── */
export default function ClientApp() {
  // "validating" = we have a stored token and are checking it
  // "authenticated" = token validated, portal shown
  // "unauthenticated" = no valid token, login shown
  const [authState, setAuthState] = useState("init"); // "init" | "validating" | "authenticated" | "unauthenticated"
  const [tenant,    setTenant]    = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const token       = getToken();
    const storedTenant = getTenant();

    if (!token) {
      // No token at all — show login immediately
      setAuthState("unauthenticated");
      if (window.location.pathname !== "/client/login") {
        window.history.replaceState(null, "", "/client/login");
      }
      return;
    }

    // We have a stored token — validate it server-side
    setAuthState("validating");

    (async () => {
      try {
        const res = await fetch("/api/client/me", {
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!isMounted.current) return;

        if (res.status === 401) {
          // Token expired or invalid
          clearAuth();
          setAuthState("unauthenticated");
          window.history.replaceState(null, "", "/client/login");
          return;
        }

        if (!res.ok) {
          // Server error — use cached tenant so portal still works
          // (individual pages will handle their own retry)
          if (storedTenant) {
            setTenant(storedTenant);
            setAuthState("authenticated");
            if (window.location.pathname === "/client/login") {
              window.history.replaceState(null, "", "/client");
            }
          } else {
            clearAuth();
            setAuthState("unauthenticated");
            window.history.replaceState(null, "", "/client/login");
          }
          return;
        }

        const json = await res.json();
        if (!json.success) {
          clearAuth();
          setAuthState("unauthenticated");
          window.history.replaceState(null, "", "/client/login");
          return;
        }

        // Merge fresh profile data with stored tenant
        const freshTenant = { ...(storedTenant || {}), ...json.data };
        saveAuth(token, freshTenant);
        setTenant(freshTenant);
        setAuthState("authenticated");
        if (window.location.pathname === "/client/login") {
          window.history.replaceState(null, "", "/client");
        }
      } catch {
        // Network error — fall back to stored tenant if available
        if (!isMounted.current) return;
        if (storedTenant) {
          setTenant(storedTenant);
          setAuthState("authenticated");
          if (window.location.pathname === "/client/login") {
            window.history.replaceState(null, "", "/client");
          }
        } else {
          setAuthState("unauthenticated");
          window.history.replaceState(null, "", "/client/login");
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (tenantData) => {
    setTenant(tenantData);
    setAuthState("authenticated");
    window.history.replaceState(null, "", "/client");
  };

  const handleLogout = () => {
    // clearAuth() is already called inside PortalShell handleLogout
    setTenant(null);
    setAuthState("unauthenticated");
    window.history.replaceState(null, "", "/client/login");
  };

  // Brief init — waiting for JS to parse localStorage before deciding
  if (authState === "init") return null;

  // Validating stored token against the server
  if (authState === "validating") return <SessionInitScreen />;

  // Show portal if authenticated
  if (authState === "authenticated" && tenant) {
    return <PortalShell tenant={tenant} onLogout={handleLogout} />;
  }

  // Default: show login
  return <LoginPage onLogin={handleLogin} />;
}
