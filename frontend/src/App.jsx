import { useEffect, useState, useCallback } from "react";
import "./App.css";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HELPERS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ADMIN AUTH HELPERS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SVG ICONS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
};

const navigationItems = [
  { id: "dashboard", label: "Dashboard", Icon: Icons.Dashboard },
  { id: "tenants", label: "Tenants", Icon: Icons.Tenants },
  { id: "rooms", label: "Rooms", Icon: Icons.Rooms },
  { id: "meters", label: "Meter Readings", Icon: Icons.Meters },
  { id: "rates", label: "Utility Rates", Icon: Icons.Rates },
  { id: "billing", label: "Billing", Icon: Icons.Billing },
  { id: "reports", label: "Reports", Icon: Icons.Reports },
];

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ADMIN LOGIN COMPONENT
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }
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
    <div className="admin-login-screen">
      <div className="admin-login-card">
        {/* Brand mark */}
        <div className="admin-login-brand">
          <div className="admin-login-brand-mark">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="admin-login-brand-text">
            <strong>TARIPA</strong>
            <span>Admin Portal</span>
          </div>
        </div>

        <div className="admin-login-header">
          <h1 className="admin-login-title">Welcome back</h1>
          <p className="admin-login-subtitle">Sign in to your admin account to continue.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="admin-login-fields">
            <label className="field">
              <span className="field-label">USERNAME</span>
              <input
                type="text"
                className="field-input"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
            </label>
            <label className="field">
              <span className="field-label">PASSWORD</span>
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
            </label>
          </div>

          {error && (
            <div className="form-msg form-msg-error" role="alert">
              <Icons.Alert />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary admin-login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="admin-login-spinner" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="admin-login-note">
          TARIPA · Residential Utility Tracking & Billing System
        </p>
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   APP SHELL
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function App() {
  // â”€â”€ Admin auth state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [adminToken, setAdminToken] = useState(() => getAdminToken());
  const [adminUser,  setAdminUser]  = useState(() => getAdminUser());

  const [activePage, setActivePage] = useState("dashboard");
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLoginSuccess = useCallback((token, admin) => {
    setAdminToken(token);
    setAdminUser(admin);
  }, []);

  const handleLogout = useCallback(() => {
    clearAdminAuth();
    setAdminToken(null);
    setAdminUser(null);
  }, []);

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
  }, [adminToken]);

  // â”€â”€ Auth gate: show login if no token â”€â”€â”€â”€â”€
  if (!adminToken) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const isOnline = backendStatus === "Connected";

  return (
    <div className="app-shell">
      {/* â”€â”€ SIDEBAR â”€â”€ */}
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed((c) => !c)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
        </button>

        {/* Brand */}
        <div className="brand">
          <div className="brand-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="brand-text">
            <strong>TARIPA</strong>
            <span>Utility Management</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="navigation">
          <p className="nav-label">MAIN MENU</p>
          {navigationItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${activePage === id ? "active" : ""}`}
              onClick={() => setActivePage(id)}
            >
              <span className="nav-icon">
                <Icon />
              </span>
              <span className="nav-label-text">{label}</span>
            </button>
          ))}
        </nav>

        {/* Admin user + logout */}
        <div className="sidebar-admin-user">
          <div className="sidebar-admin-avatar">
            {String(adminUser?.username ?? "A").charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-admin-info">
            <strong>{adminUser?.username ?? "Admin"}</strong>
            <span>Administrator</span>
          </div>
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {/* Footer status */}
        <div className="sidebar-footer">
          <div className={`status-dot ${isOnline ? "online" : "offline"}`} />
          <div className="sidebar-footer-text">
            <strong>System Status</strong>
            <span>{backendStatus}</span>
          </div>
        </div>
      </aside>

      {/* â”€â”€ MAIN CONTENT â”€â”€ */}
      <main className="main-content">
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
      </main>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PAGE HEADER (reusable)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   EMPTY STATE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   STATUS BADGE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   DASHBOARD
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Dashboard({ onNavigate }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentMeters, setRecentMeters] = useState(null);   // null = loading, [] = empty
  const [recentBills, setRecentBills] = useState(null);

  useEffect(() => {
    authFetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => { if (data.success) setDashboardData(data.data); })
      .catch((e) => console.error("Failed to load dashboard data:", e));

    authFetch("/api/meter-readings")
      .then((r) => r.json())
      .then((data) => { setRecentMeters(data.success ? data.data.slice(0, 5) : []); })
      .catch(() => setRecentMeters([]));

    authFetch("/api/billing")
      .then((r) => r.json())
      .then((data) => { setRecentBills(data.success ? data.data.slice(0, 5) : []); })
      .catch(() => setRecentBills([]));
  }, []);

  const formatMonth = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "short" });
  };

  /* â”€â”€ KPI definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const kpis = [
    {
      label: "Active Tenants",
      value: dashboardData?.total_tenants ?? "—",
      sub: "Registered residents",
      Icon: Icons.Tenants,
      accent: "kpi-indigo",
    },
    {
      label: "Total Rooms",
      value: dashboardData?.total_rooms ?? "—",
      sub: `${dashboardData?.available_rooms ?? 0} available`,
      Icon: Icons.Rooms,
      accent: "kpi-blue",
    },
    {
      label: "Available Rooms",
      value: dashboardData?.available_rooms ?? "—",
      sub: "Ready for occupancy",
      Icon: Icons.Rooms,
      accent: "kpi-success",
    },
    {
      label: "Pending Bills",
      value: dashboardData?.pending_bills ?? "—",
      sub: "Awaiting payment",
      Icon: Icons.Billing,
      accent: "kpi-warning",
    },
    {
      label: "Outstanding",
      value: dashboardData !== null ? formatCurrency(dashboardData.outstanding_amount) : "—",
      sub: "Pending & overdue",
      Icon: Icons.Rates,
      accent: "kpi-danger",
      large: true,
    },
  ];

  /* â”€â”€ Quick actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const quickActions = [
    { label: "Add Meter Reading", Icon: Icons.Meters,  page: "meters",  accent: "qa-electric" },
    { label: "Add Tenant",        Icon: Icons.Tenants, page: "tenants", accent: "qa-indigo"   },
    { label: "Create Bill",       Icon: Icons.Billing, page: "billing", accent: "qa-blue"     },
    { label: "View Reports",      Icon: Icons.Reports, page: "reports", accent: "qa-success"  },
  ];

  return (
    <div className="page-wrap dashboard-page">

      {/* â”€â”€ 1. WORKSPACE HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="dash-header">
        <div className="dash-header-body">
          <p className="eyebrow">ADMIN WORKSPACE</p>
          <h1 className="dash-heading">Welcome to TARIPA</h1>
          <p className="dash-subheading">
            Residential utility tracking and billing — manage tenants, meter readings, and billing records from one place.
          </p>
        </div>
        <div className="dash-header-emblem" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
      </div>

      {/* â”€â”€ 2. KPI CARDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="dash-kpi-grid">
        {kpis.map((k) => (
          <div className={`dash-kpi-card ${k.accent}`} key={k.label}>
            <div className="dash-kpi-icon">
              <k.Icon />
            </div>
            <div className="dash-kpi-body">
              <span className="dash-kpi-label">{k.label}</span>
              <strong className={`dash-kpi-value${k.large ? " dash-kpi-value-lg" : ""}`}>
                {dashboardData === null ? (
                  <span className="dash-kpi-skeleton" />
                ) : k.value}
              </strong>
              <small className="dash-kpi-sub">{k.sub}</small>
            </div>
          </div>
        ))}
      </div>

      {/* â”€â”€ 3. BILLING OVERVIEW + QUICK ACTIONS row â”€â”€ */}
      <div className="dash-mid-row">

        {/* Billing Overview */}
        <section className="dash-panel dash-billing-panel">
          <div className="dash-panel-header">
            <div>
              <p className="eyebrow">BILLING & PAYMENTS</p>
              <h3 className="dash-panel-title">Overview</h3>
            </div>
          </div>

          {dashboardData === null ? (
            <div className="dash-panel-loading">
              <div className="loading-spinner" />
              <span>Loading…</span>
            </div>
          ) : (
            <div className="dash-billing-stats">
              <div className="dash-billing-stat dash-bs-outstanding">
                <span className="dash-bs-label">Outstanding Balance</span>
                <strong className="dash-bs-value">
                  {formatCurrency(dashboardData.outstanding_amount)}
                </strong>
                <span className="dash-bs-detail">
                  {dashboardData.pending_bills} bill{dashboardData.pending_bills !== 1 ? "s" : ""} pending
                </span>
              </div>
              <div className="dash-billing-stat dash-bs-rooms">
                <span className="dash-bs-label">Room Occupancy</span>
                <strong className="dash-bs-value">
                  {dashboardData.total_rooms > 0
                    ? `${Math.round(((dashboardData.total_rooms - dashboardData.available_rooms) / dashboardData.total_rooms) * 100)}%`
                    : "—"}
                </strong>
                <span className="dash-bs-detail">
                  {dashboardData.total_rooms - dashboardData.available_rooms} of {dashboardData.total_rooms} rooms occupied
                </span>
              </div>
            </div>
          )}

          <div className="dash-billing-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Collection-rate trends and historical charts will appear here when additional reporting data becomes available.
          </div>
        </section>

        {/* Quick Actions */}
        <section className="dash-panel dash-actions-panel">
          <div className="dash-panel-header">
            <div>
              <p className="eyebrow">SHORTCUTS</p>
              <h3 className="dash-panel-title">Quick Actions</h3>
            </div>
          </div>
          <div className="dash-qa-grid">
            {quickActions.map(({ label, Icon, page, accent }) => (
              <button
                key={page}
                type="button"
                className={`dash-qa-btn ${accent}`}
                onClick={() => onNavigate?.(page)}
              >
                <span className="dash-qa-icon"><Icon /></span>
                <span className="dash-qa-label">{label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* â”€â”€ 4. RECENT METER READINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="dash-panel">
        <div className="dash-panel-header">
          <div>
            <p className="eyebrow">UTILITY USAGE</p>
            <h3 className="dash-panel-title">Recent Meter Readings</h3>
          </div>
          <button type="button" className="btn-secondary btn-sm" onClick={() => onNavigate?.("meters")}>
            View All
          </button>
        </div>

        {recentMeters === null ? (
          <div className="dash-panel-loading">
            <div className="loading-spinner" />
            <span>Loading readings…</span>
          </div>
        ) : recentMeters.length === 0 ? (
          <div className="empty-state" style={{ padding: "36px 24px" }}>
            <div className="empty-icon"><Icons.Meters /></div>
            <h3>No meter readings yet</h3>
            <p>Meter readings will appear here once they are recorded.</p>
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Room</th>
                  <th>Billing Month</th>
                  <th>
                    <span className="dash-th-icon dash-electric-color">
                      <Icons.Electricity />
                    </span>
                    Electricity
                  </th>
                  <th>
                    <span className="dash-th-icon dash-water-color">
                      <Icons.Water />
                    </span>
                    Water
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentMeters.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="dash-cell-name">
                        <div className="dash-cell-avatar">{r.full_name?.charAt(0).toUpperCase()}</div>
                        <span>{r.full_name}</span>
                      </div>
                    </td>
                    <td className="dash-cell-muted">{r.room_number ?? "—"}</td>
                    <td className="dash-cell-muted">{formatMonth(r.billing_month)}</td>
                    <td>
                      <span className="dash-reading-chip dash-electric-chip">
                        {Number(r.electricity_consumption).toFixed(1)} kWh
                      </span>
                    </td>
                    <td>
                      <span className="dash-reading-chip dash-water-chip">
                        {Number(r.water_consumption).toFixed(1)} m³
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* â”€â”€ 5. RECENT BILLING ACTIVITY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="dash-panel">
        <div className="dash-panel-header">
          <div>
            <p className="eyebrow">RECENT ACTIVITY</p>
            <h3 className="dash-panel-title">Billing Records</h3>
          </div>
          <button type="button" className="btn-secondary btn-sm" onClick={() => onNavigate?.("billing")}>
            View All
          </button>
        </div>

        {recentBills === null ? (
          <div className="dash-panel-loading">
            <div className="loading-spinner" />
            <span>Loading records…</span>
          </div>
        ) : recentBills.length === 0 ? (
          <div className="empty-state" style={{ padding: "36px 24px" }}>
            <div className="empty-icon"><Icons.Billing /></div>
            <h3>No billing records yet</h3>
            <p>Billing records will appear here once bills are created.</p>
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Room</th>
                  <th>Billing Month</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="dash-cell-name">
                        <div className="dash-cell-avatar">{b.full_name?.charAt(0).toUpperCase()}</div>
                        <span>{b.full_name}</span>
                      </div>
                    </td>
                    <td className="dash-cell-muted">{b.room_number ?? "—"}</td>
                    <td className="dash-cell-muted">{formatMonth(b.billing_month)}</td>
                    <td><strong>{formatCurrency(b.total_amount)}</strong></td>
                    <td><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   TENANTS PAGE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // inline two-step confirm
  const [deleteError, setDeleteError] = useState("");           // inline error on the card

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

  const resetForm = () => {
    setFormData({ full_name: "", contact_number: "", room_id: "", move_in_date: "", status: "Active" });
    setFormError("");
    setFormSuccess("");
  };

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

  const closeForm = () => { setShowForm(false); setEditingTenant(null); resetForm(); };

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
    if (!formData.full_name.trim()) { setFormError("Full name is required."); return; }
    if (!formData.move_in_date) { setFormError("Move-in date is required."); return; }
    setIsSubmitting(true);
    try {
      const isEditing = Boolean(editingTenant);
      const url = isEditing ? `/api/tenants/${editingTenant.id}` : "/api/tenants";
      const method = isEditing ? "PUT" : "POST";
      const body = {
        full_name: formData.full_name.trim(),
        contact_number: formData.contact_number.trim(),
        room_id: formData.room_id || null,
        move_in_date: formData.move_in_date,
        status: formData.status,
      };
      const response = await authFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok || !data.success) { setFormError(data.message || `Failed to ${isEditing ? "update" : "create"} tenant.`); return; }
      setFormSuccess(isEditing ? "Tenant updated successfully." : "Tenant added successfully.");
      loadTenants(); loadRooms();
      setTimeout(() => { closeForm(); }, 800);
    } catch (err) {
      console.error("Failed to save tenant:", err);
      setFormError("Unable to connect to the backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTenant = async (tenant) => {
    // First click: arm the confirmation
    if (confirmDeleteId !== tenant.id) {
      setConfirmDeleteId(tenant.id);
      setDeleteError("");
      return;
    }
    // Second click: fire the DELETE
    setConfirmDeleteId(null);
    setDeleteError("");
    try {
      const response = await authFetch(`/api/tenants/${tenant.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setDeleteError(data.message || "Failed to delete tenant.");
        return;
      }
      // Remove from local list immediately for snappy UX, then reload
      loadTenants();
      loadRooms();
    } catch (err) {
      console.error("Failed to delete tenant:", err);
      setDeleteError("Unable to connect to the backend.");
    }
  };

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="TENANT MANAGEMENT"
        title="Tenants"
        description="Manage tenant profiles, room assignments, and account status."
        action={
          <button type="button" className="btn-primary" onClick={openAddForm}>
            <Icons.Plus /> Add Tenant
          </button>
        }
      />

      {showForm && (
        <div className="form-panel">
          <div className="form-panel-header">
            <div>
              <p className="eyebrow">{editingTenant ? "EDIT TENANT" : "NEW TENANT"}</p>
              <h3>{editingTenant ? "Edit Tenant" : "Add Tenant"}</h3>
            </div>
            <button type="button" className="btn-icon" onClick={closeForm} aria-label="Close">
              <Icons.Close />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">FULL NAME <span className="required">*</span></span>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Enter full name" className="field-input" />
              </label>
              <label className="field">
                <span className="field-label">CONTACT NUMBER</span>
                <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} placeholder="Enter contact number" className="field-input" />
              </label>
              <label className="field">
                <span className="field-label">ROOM</span>
                <select name="room_id" value={formData.room_id} onChange={handleChange} className="field-input">
                  <option value="">No room assigned</option>
                  {rooms.map((room) => {
                    const isCurrentRoom = editingTenant && Number(formData.room_id) === Number(room.id);
                    const isFull = Number(room.occupied_count) >= Number(room.capacity) && !isCurrentRoom;
                    return (
                      <option key={room.id} value={room.id} disabled={isFull}>
                        Room {room.room_number} — {room.occupied_count}/{room.capacity}{isFull ? " (Full)" : ""}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="field">
                <span className="field-label">MOVE-IN DATE <span className="required">*</span></span>
                <input type="date" name="move_in_date" value={formData.move_in_date} onChange={handleChange} className="field-input" />
              </label>
              {editingTenant && (
                <label className="field">
                  <span className="field-label">STATUS</span>
                  <select name="status" value={formData.status} onChange={handleChange} className="field-input">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              )}
            </div>

            {formError && (
              <div className="form-msg form-msg-error">
                <Icons.Alert /> {formError}
              </div>
            )}
            {formSuccess && (
              <div className="form-msg form-msg-success">
                <Icons.Check /> {formSuccess}
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : editingTenant ? "Update Tenant" : "Save Tenant"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="record-list">
        {tenants.length === 0 ? (
          <EmptyState
            icon={<Icons.Tenants />}
            title="No tenant records found"
            description="Tenant records will appear here once they are added."
          />
        ) : (
          tenants.map((tenant) => (
            <article className="record-card" key={tenant.id}>
              <div className="record-main">
                <div className="avatar">
                  {tenant.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong className="record-name">{tenant.full_name}</strong>
                  <p className="record-sub">{tenant.contact_number || "No contact number"}</p>
                </div>
              </div>

              <div className="record-meta">
                <div className="meta-item">
                  <span className="meta-label">ROOM</span>
                  <strong className="meta-value">{tenant.room_number || "Unassigned"}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label">MOVE-IN DATE</span>
                  <strong className="meta-value">{tenant.move_in_date.substring(0, 10)}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label">STATUS</span>
                  <StatusBadge status={tenant.status} />
                </div>
                <div className="meta-actions">
                  <button type="button" className="btn-edit" onClick={() => openEditForm(tenant)}>
                    <Icons.Edit /> Edit
                  </button>
                  {confirmDeleteId === tenant.id ? (
                    <>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleDeleteTenant(tenant)}
                      >
                        <Icons.Check /> Confirm
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                        onClick={() => { setConfirmDeleteId(null); setDeleteError(""); }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleDeleteTenant(tenant)}
                    >
                      <Icons.Delete /> Delete
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {deleteError && (
        <div className="form-msg form-msg-error" style={{ marginTop: "12px" }}>
          <Icons.Alert /> {deleteError}
          <button
            type="button"
            style={{ marginLeft: "12px", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", color: "inherit" }}
            onClick={() => setDeleteError("")}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ROOMS PAGE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ room_number: "", capacity: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRooms = () => {
    authFetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => { if (data.success) setRooms(data.data); })
      .catch((e) => console.error("Failed to load rooms:", e));
  };

  useEffect(() => { loadRooms(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((c) => ({ ...c, [name]: value }));
    setFormError("");
    setFormSuccess("");
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData({ room_number: "", capacity: "" });
    setFormError("");
    setFormSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    const roomNumber = formData.room_number.trim();
    const capacity = Number(formData.capacity);
    if (!roomNumber) { setFormError("Room number is required."); return; }
    if (!Number.isInteger(capacity) || capacity <= 0) { setFormError("Capacity must be a positive whole number."); return; }
    setIsSubmitting(true);
    try {
      const response = await authFetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_number: roomNumber, capacity }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) { setFormError(data.message || "Failed to create room."); return; }
      setFormSuccess("Room added successfully.");
      setFormData({ room_number: "", capacity: "" });
      loadRooms();
      setTimeout(() => { closeForm(); }, 800);
    } catch (err) {
      console.error("Failed to create room:", err);
      setFormError("Unable to connect to the backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="ROOM MANAGEMENT"
        title="Rooms"
        description="Manage residential rooms and monitor current occupancy."
        action={
          <button type="button" className="btn-primary" onClick={() => { setShowForm(true); setFormError(""); setFormSuccess(""); }}>
            <Icons.Plus /> Add Room
          </button>
        }
      />

      {showForm && (
        <div className="form-panel">
          <div className="form-panel-header">
            <div>
              <p className="eyebrow">NEW ROOM</p>
              <h3>Add Room</h3>
            </div>
            <button type="button" className="btn-icon" onClick={closeForm} aria-label="Close">
              <Icons.Close />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid form-grid-2">
              <label className="field">
                <span className="field-label">ROOM NUMBER <span className="required">*</span></span>
                <input type="text" name="room_number" value={formData.room_number} onChange={handleChange} placeholder="e.g. 102" className="field-input" />
              </label>
              <label className="field">
                <span className="field-label">CAPACITY <span className="required">*</span></span>
                <input type="number" name="capacity" min="1" step="1" value={formData.capacity} onChange={handleChange} placeholder="e.g. 2" className="field-input" />
              </label>
            </div>

            {formError && <div className="form-msg form-msg-error"><Icons.Alert /> {formError}</div>}
            {formSuccess && <div className="form-msg form-msg-success"><Icons.Check /> {formSuccess}</div>}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save Room"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rooms-grid">
        {rooms.length === 0 ? (
          <EmptyState icon={<Icons.Rooms />} title="No room records found" description="Room records will appear here once they are added." />
        ) : (
          rooms.map((room) => {
            const occupied = Number(room.occupied_count);
            const capacity = Number(room.capacity);
            const available = Math.max(capacity - occupied, 0);
            const isFull = occupied >= capacity;
            const fillPct = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

            return (
              <article className={`room-card ${isFull ? "room-full" : "room-available"}`} key={room.id}>
                <div className="room-card-top">
                  <div className="room-avatar">
                    <Icons.Rooms />
                  </div>
                  <StatusBadge status={isFull ? "Full" : "Available"} />
                </div>
                <h3 className="room-number">Room {room.room_number}</h3>
                <p className="room-type">Residential</p>

                {/* Occupancy bar */}
                <div className="occupancy-bar-wrap">
                  <div className="occupancy-bar">
                    <div
                      className="occupancy-fill"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  <span className="occupancy-text">{occupied}/{capacity} occupied</span>
                </div>

                <div className="room-meta-row">
                  <div className="room-meta-item">
                    <span className="meta-label">CAPACITY</span>
                    <strong>{capacity} {capacity !== 1 ? "tenants" : "tenant"}</strong>
                  </div>
                  <div className="room-meta-item">
                    <span className="meta-label">AVAILABLE</span>
                    <strong className={available > 0 ? "text-success" : "text-danger"}>{available} slots</strong>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   METER READINGS PAGE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function MeterReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [tenants, setTenants] = useState([]);
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

  useEffect(() => { loadReadings(); loadTenants(); }, []);

  const resetForm = () => {
    setFormData({ tenant_id: "", billing_month: "", electricity_previous: "", electricity_current: "", water_previous: "", water_current: "" });
    setFormError("");
    setFormSuccess("");
  };

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

  const closeForm = () => { setShowForm(false); setEditingReading(null); resetForm(); };

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
    if (values.some((v) => Number.isNaN(v) || v < 0)) { setFormError("All meter readings must be non-negative numbers."); return; }
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

  const handleDelete = async (reading) => {
    const confirmed = window.confirm(
      `Delete the meter reading for ${reading.full_name} for ${reading.billing_month.substring(0, 7)}?`
    );
    if (!confirmed) return;
    try {
      const response = await authFetch(`/api/meter-readings/${reading.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) { window.alert(data.message || "Failed to delete meter reading."); return; }
      loadReadings();
    } catch (err) {
      console.error("Failed to delete meter reading:", err);
      window.alert("Unable to connect to the backend.");
    }
  };

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="UTILITY TRACKING"
        title="Meter Readings"
        description="Record electricity and water readings for each billing period."
        action={
          <button type="button" className="btn-primary" onClick={openAddForm}>
            <Icons.Plus /> Add Reading
          </button>
        }
      />

      {showForm && (
        <div className="form-panel">
          <div className="form-panel-header">
            <div>
              <p className="eyebrow">{editingReading ? "EDIT METER READING" : "NEW METER READING"}</p>
              <h3>{editingReading ? "Edit Meter Reading" : "Add Meter Reading"}</h3>
            </div>
            <button type="button" className="btn-icon" onClick={closeForm} aria-label="Close">
              <Icons.Close />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">TENANT <span className="required">*</span></span>
                <select name="tenant_id" value={formData.tenant_id} onChange={handleChange} className="field-input">
                  <option value="">Select active tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}{t.room_number ? ` — Room ${t.room_number}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field-label">BILLING MONTH <span className="required">*</span></span>
                <input
                  type="month"
                  name="billing_month"
                  value={formData.billing_month ? formData.billing_month.substring(0, 7) : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((c) => ({ ...c, billing_month: value ? `${value}-01` : "" }));
                    setFormError("");
                    setFormSuccess("");
                  }}
                  className="field-input"
                />
              </label>
            </div>

            {/* Electricity section */}
            <div className="utility-section utility-section-electric">
              <div className="utility-section-header">
                <span className="utility-badge electric-badge">
                  <Icons.Electricity /> Electricity
                </span>
                {electricityConsumption !== null && !Number.isNaN(electricityConsumption) && (
                  <span className="consumption-preview">
                    {electricityConsumption.toFixed(3)} kWh consumed
                  </span>
                )}
              </div>
              <div className="form-grid form-grid-2">
                <label className="field">
                  <span className="field-label">PREVIOUS READING</span>
                  <input type="number" name="electricity_previous" min="0" step="0.001" value={formData.electricity_previous} onChange={handleChange} placeholder="e.g. 1250" className="field-input" />
                </label>
                <label className="field">
                  <span className="field-label">CURRENT READING</span>
                  <input type="number" name="electricity_current" min="0" step="0.001" value={formData.electricity_current} onChange={handleChange} placeholder="e.g. 1375" className="field-input" />
                </label>
              </div>
            </div>

            {/* Water section */}
            <div className="utility-section utility-section-water">
              <div className="utility-section-header">
                <span className="utility-badge water-badge">
                  <Icons.Water /> Water
                </span>
                {waterConsumption !== null && !Number.isNaN(waterConsumption) && (
                  <span className="consumption-preview">
                    {waterConsumption.toFixed(3)} m³ consumed
                  </span>
                )}
              </div>
              <div className="form-grid form-grid-2">
                <label className="field">
                  <span className="field-label">PREVIOUS READING</span>
                  <input type="number" name="water_previous" min="0" step="0.001" value={formData.water_previous} onChange={handleChange} placeholder="e.g. 500" className="field-input" />
                </label>
                <label className="field">
                  <span className="field-label">CURRENT READING</span>
                  <input type="number" name="water_current" min="0" step="0.001" value={formData.water_current} onChange={handleChange} placeholder="e.g. 520" className="field-input" />
                </label>
              </div>
            </div>

            {formError && <div className="form-msg form-msg-error"><Icons.Alert /> {formError}</div>}
            {formSuccess && <div className="form-msg form-msg-success"><Icons.Check /> {formSuccess}</div>}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : editingReading ? "Update Reading" : "Save Reading"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="record-list">
        {readings.length === 0 ? (
          <EmptyState icon={<Icons.Meters />} title="No meter readings found" description="Meter readings will appear here once they are recorded." />
        ) : (
          readings.map((reading) => (
            <article className="record-card meter-record-card" key={reading.id}>
              <div className="record-main">
                <div className="avatar">
                  {reading.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong className="record-name">{reading.full_name}</strong>
                  <p className="record-sub">{reading.room_number ? `Room ${reading.room_number}` : "Unassigned"}</p>
                </div>
              </div>

              <div className="record-meta">
                <div className="meta-item">
                  <span className="meta-label">BILLING MONTH</span>
                  <strong className="meta-value">{reading.billing_month.substring(0, 7)}</strong>
                </div>
                <div className="meta-item utility-meta electric-meta">
                  <span className="meta-label">
                    <Icons.Electricity /> ELECTRICITY
                  </span>
                  <strong className="meta-value">{Number(reading.electricity_consumption).toFixed(3)} kWh</strong>
                </div>
                <div className="meta-item utility-meta water-meta">
                  <span className="meta-label">
                    <Icons.Water /> WATER
                  </span>
                  <strong className="meta-value">{Number(reading.water_consumption).toFixed(3)} m³</strong>
                </div>
                <div className="meta-actions">
                  <button type="button" className="btn-edit" onClick={() => openEditForm(reading)}>
                    <Icons.Edit /> Edit
                  </button>
                  <button type="button" className="btn-delete" onClick={() => handleDelete(reading)}>
                    <Icons.Delete /> Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   UTILITY RATES PAGE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function UtilityRatesPage() {
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
    if (!Number.isFinite(rate) || rate < 0) { setFormError("Rate per unit must be a valid non-negative number."); return; }
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
      if (!response.ok || !data.success) { window.alert(data.message || "Failed to delete utility rate."); return; }
      loadRates();
    } catch (err) {
      console.error("Failed to delete utility rate:", err);
      window.alert("Unable to connect to the backend.");
    }
  };

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="UTILITY RATE MANAGEMENT"
        title="Utility Rates"
        description="Manage electricity and water rates used for automated billing calculations."
        action={
          <button type="button" className="btn-primary" onClick={openAddForm}>
            <Icons.Plus /> Add Rate
          </button>
        }
      />

      {showForm && (
        <div className="form-panel">
          <div className="form-panel-header">
            <div>
              <p className="eyebrow">{editingRate ? "EDIT UTILITY RATE" : "NEW UTILITY RATE"}</p>
              <h3>{editingRate ? "Edit Utility Rate" : "Add Utility Rate"}</h3>
            </div>
            <button type="button" className="btn-icon" onClick={closeForm} aria-label="Close">
              <Icons.Close />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">UTILITY TYPE <span className="required">*</span></span>
                <select name="utility_type" value={formData.utility_type} onChange={handleChange} className="field-input">
                  <option value="">Select utility</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Water">Water</option>
                </select>
              </label>
              <label className="field">
                <span className="field-label">RATE PER UNIT (₱) <span className="required">*</span></span>
                <input type="number" name="rate_per_unit" value={formData.rate_per_unit} onChange={handleChange} min="0" step="0.01" placeholder="Enter rate" className="field-input" />
              </label>
              <label className="field">
                <span className="field-label">EFFECTIVE FROM <span className="required">*</span></span>
                <input type="date" name="effective_from" value={formData.effective_from} onChange={handleChange} className="field-input" />
              </label>
            </div>

            <div className="form-info-banner">
              <Icons.Alert />
              This rate will be used when generating bills for billing months covered by the effective date.
            </div>

            {formError && <div className="form-msg form-msg-error"><Icons.Alert /> {formError}</div>}
            {formSuccess && <div className="form-msg form-msg-success"><Icons.Check /> {formSuccess}</div>}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : editingRate ? "Save Changes" : "Add Rate"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="record-list">
        {rates.length === 0 ? (
          <EmptyState icon={<Icons.Rates />} title="No utility rates found" description="Add an electricity or water rate to enable automated billing calculations." />
        ) : (
          rates.map((rate) => {
            const isElectric = rate.utility_type === "Electricity";
            return (
              <article className={`record-card rate-card ${isElectric ? "rate-electric" : "rate-water"}`} key={rate.id}>
                <div className="record-main">
                  <div className={`avatar ${isElectric ? "avatar-electric" : "avatar-water"}`}>
                    {isElectric ? <Icons.Electricity /> : <Icons.Water />}
                  </div>
                  <div>
                    <strong className="record-name">{rate.utility_type}</strong>
                    <p className="record-sub">Effective from {rate.effective_from.substring(0, 10)}</p>
                  </div>
                </div>

                <div className="record-meta">
                  <div className="meta-item">
                    <span className="meta-label">UTILITY</span>
                    <span className={`utility-pill ${isElectric ? "pill-electric" : "pill-water"}`}>
                      {isElectric ? <Icons.Electricity /> : <Icons.Water />}
                      {rate.utility_type}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">RATE PER UNIT</span>
                    <strong className={`meta-value rate-value ${isElectric ? "electric-value" : "water-value"}`}>
                      {formatCurrency(rate.rate_per_unit)}
                    </strong>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">EFFECTIVE FROM</span>
                    <strong className="meta-value">{rate.effective_from.substring(0, 10)}</strong>
                  </div>
                  <div className="meta-actions">
                    <button type="button" className="btn-edit" onClick={() => openEditForm(rate)}>
                      <Icons.Edit /> Edit
                    </button>
                    <button type="button" className="btn-delete" onClick={() => handleDelete(rate)}>
                      <Icons.Delete /> Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   BILLING PAGE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function BillingPage() {
  const [billingRecords, setBillingRecords] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [showForm, setShowForm] = useState(false);
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

  const resetForm = () => {
    setFormData({ tenant_id: "", billing_month: "" });
    setFormError("");
    setFormSuccess("");
  };

  const openAddForm = () => { resetForm(); setShowForm(true); };
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

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="BILLING MANAGEMENT"
        title="Billing"
        description="Generate bills from meter readings and manage payment status."
        action={
          <button type="button" className="btn-primary" onClick={openAddForm}>
            <Icons.Plus /> Generate Bill
          </button>
        }
      />

      {showForm && (
        <div className="form-panel">
          <div className="form-panel-header">
            <div>
              <p className="eyebrow">NEW BILLING RECORD</p>
              <h3>Generate Bill</h3>
            </div>
            <button type="button" className="btn-icon" onClick={closeForm} aria-label="Close">
              <Icons.Close />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid form-grid-2">
              <label className="field">
                <span className="field-label">TENANT <span className="required">*</span></span>
                <select name="tenant_id" value={formData.tenant_id} onChange={handleChange} className="field-input">
                  <option value="">Select active tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}{t.room_number ? ` — Room ${t.room_number}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">BILLING MONTH <span className="required">*</span></span>
                <input type="month" name="billing_month" value={formData.billing_month} onChange={handleChange} className="field-input" />
              </label>
            </div>

            <div className="form-info-banner">
              <Icons.Alert />
              The system will calculate electricity and water charges using the meter reading and applicable utility rates.
            </div>

            {formError && <div className="form-msg form-msg-error"><Icons.Alert /> {formError}</div>}
            {formSuccess && <div className="form-msg form-msg-success"><Icons.Check /> {formSuccess}</div>}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Generating…" : "Generate Bill"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="record-list">
        {billingRecords.length === 0 ? (
          <EmptyState icon={<Icons.Billing />} title="No billing records found" description="Billing records will appear here once bills are generated." />
        ) : (
          billingRecords.map((billing) => (
            <article className="record-card billing-record-card" key={billing.id}>
              <div className="record-main">
                <div className="avatar">
                  {billing.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong className="record-name">{billing.full_name}</strong>
                  <p className="record-sub">{billing.room_number ? `Room ${billing.room_number}` : "Unassigned"}</p>
                </div>
              </div>

              <div className="record-meta billing-meta">
                <div className="meta-item">
                  <span className="meta-label">BILLING MONTH</span>
                  <strong className="meta-value">{billing.billing_month.substring(0, 7)}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label electric-label"><Icons.Electricity /> ELECTRICITY</span>
                  <strong className="meta-value electric-value">{formatCurrency(billing.electricity_charge)}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label water-label"><Icons.Water /> WATER</span>
                  <strong className="meta-value water-value">{formatCurrency(billing.water_charge)}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label">TOTAL</span>
                  <strong className="meta-value total-value">{formatCurrency(billing.total_amount)}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label">STATUS</span>
                  <select
                    className="status-select"
                    value={billing.status}
                    onChange={(e) => handleStatusChange(billing, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div className="meta-actions">
                  <button type="button" className="btn-delete" onClick={() => handleDelete(billing)}>
                    <Icons.Delete /> Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   REPORTS PAGE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
      console.log("TARIPA REPORTS:", data);
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
  const totalElectricity = filteredReports.reduce((s, r) => s + Number(r.electricity_consumption || 0), 0);
  const totalWater = filteredReports.reduce((s, r) => s + Number(r.water_consumption || 0), 0);
  const pendingAmount = filteredReports.filter((r) => String(r.status) === "Pending").reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const paidAmount = filteredReports.filter((r) => String(r.status) === "Paid").reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const overdueAmount = filteredReports.filter((r) => String(r.status) === "Overdue").reduce((s, r) => s + Number(r.total_amount || 0), 0);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="REPORTS & DATA RETRIEVAL"
        title="Reports"
        description="Search and filter billing records to review utility usage and payment information."
        action={
          <button type="button" className="btn-secondary" onClick={loadReports}>
            <Icons.Refresh /> Refresh
          </button>
        }
      />

      {/* Filter panel */}
      <div className="form-panel filter-panel">
        <div className="form-panel-header">
          <div className="filter-panel-title">
            <Icons.Filter />
            <div>
              <p className="eyebrow">REPORT FILTERS</p>
              <h3>Search Billing Records</h3>
            </div>
          </div>
          {hasActiveFilters && (
            <button type="button" className="btn-secondary btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        <div className="form-grid">
          <label className="field">
            <span className="field-label">BILLING MONTH</span>
            <input type="month" name="billing_month" value={filters.billing_month} onChange={handleFilterChange} className="field-input" />
          </label>
          <label className="field">
            <span className="field-label">TENANT</span>
            <select name="tenant_id" value={filters.tenant_id} onChange={handleFilterChange} className="field-input">
              <option value="">All tenants</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">ROOM</span>
            <select name="room_id" value={filters.room_id} onChange={handleFilterChange} className="field-input">
              <option value="">All rooms</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>Room {r.room_number}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">STATUS</span>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="field-input">
              <option value="">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </label>
        </div>
      </div>

      {error && <div className="form-msg form-msg-error"><Icons.Alert /> {error}</div>}

      {/* Summary rows */}
      <div className="report-summary-row">
        <div className="report-summary-card summary-neutral">
          <span className="report-summary-label">TOTAL BILLS</span>
          <strong className="report-summary-value">{totalBills}</strong>
          <small>Matching records</small>
        </div>
        <div className="report-summary-card summary-neutral">
          <span className="report-summary-label">TOTAL BILLING</span>
          <strong className="report-summary-value">{formatCurrency(totalAmount)}</strong>
          <small>Filtered bill amount</small>
        </div>
        <div className="report-summary-card summary-electric">
          <span className="report-summary-label"><Icons.Electricity /> ELECTRICITY</span>
          <strong className="report-summary-value">{totalElectricity.toFixed(3)}</strong>
          <small>kWh consumption</small>
        </div>
        <div className="report-summary-card summary-water">
          <span className="report-summary-label"><Icons.Water /> WATER</span>
          <strong className="report-summary-value">{totalWater.toFixed(3)}</strong>
          <small>m³ consumption</small>
        </div>
      </div>

      <div className="report-summary-row">
        <div className="report-summary-card summary-pending">
          <span className="report-summary-label">PENDING</span>
          <strong className="report-summary-value">{formatCurrency(pendingAmount)}</strong>
          <small>Unpaid pending bills</small>
        </div>
        <div className="report-summary-card summary-paid">
          <span className="report-summary-label">PAID</span>
          <strong className="report-summary-value">{formatCurrency(paidAmount)}</strong>
          <small>Completed payments</small>
        </div>
        <div className="report-summary-card summary-overdue">
          <span className="report-summary-label">OVERDUE</span>
          <strong className="report-summary-value">{formatCurrency(overdueAmount)}</strong>
          <small>Outstanding overdue bills</small>
        </div>
        <div className="report-summary-card summary-neutral">
          <span className="report-summary-label">RESULTS</span>
          <strong className="report-summary-value">{filteredReports.length}</strong>
          <small>Records after filtering</small>
        </div>
      </div>

      {/* Results */}
      <div className="record-list">
        {loading ? (
          <div className="empty-state loading-state">
            <div className="loading-spinner" />
            <h3>Loading reports…</h3>
            <p>Retrieving billing records from the database.</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <EmptyState
            icon={<Icons.Reports />}
            title="No matching records"
            description="There are no billing records matching the current filters."
          />
        ) : (
          filteredReports.map((report) => (
            <article className="record-card report-record-card" key={report.id}>
              <div className="record-main">
                <div className="avatar">
                  {String(report.full_name || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong className="record-name">{report.full_name || "Unknown tenant"}</strong>
                  <p className="record-sub">{report.room_number ? `Room ${report.room_number}` : "Unassigned"}</p>
                </div>
              </div>

              <div className="record-meta billing-meta">
                <div className="meta-item">
                  <span className="meta-label">BILLING MONTH</span>
                  <strong className="meta-value">{getBillingMonth(report.billing_month)}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label electric-label"><Icons.Electricity /> ELECTRICITY</span>
                  <strong className="meta-value electric-value">{formatCurrency(report.electricity_charge)}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label water-label"><Icons.Water /> WATER</span>
                  <strong className="meta-value water-value">{formatCurrency(report.water_charge)}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label">TOTAL</span>
                  <strong className="meta-value total-value">{formatCurrency(report.total_amount)}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label">STATUS</span>
                  <StatusBadge status={report.status} />
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
