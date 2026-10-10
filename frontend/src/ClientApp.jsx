import { useEffect, useState, useCallback, useRef } from "react";
import "./ClientApp.css";
import { NumberTicker } from "./components/magicui/NumberTicker.jsx";
import { BorderBeam } from "./components/magicui/BorderBeam.jsx";
import { DotPattern } from "./components/magicui/DotPattern.jsx";
import "./components/magicui/magicui.css";
import { useToast } from "./components/Toast.jsx";
import {
  IconHome,
  IconReceipt,
  IconBolt,
  IconUser,
  IconLogout,
  IconDroplet,
  IconAlertCircle,
  IconDoor,
  IconCalendar,
  IconPhone,
  IconEye,
  IconEyeOff,
  IconChevronDown,
  IconChevronUp,
  IconBell,
  IconFileInvoice,
  IconTrendingDown,
  IconTrendingUp,
  IconMenu2,
  IconClock,
  IconPrinter,
} from "@tabler/icons-react";

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
  Home: (props) => <IconHome size={18} stroke={1.8} {...props} />,
  Bills: (props) => <IconReceipt size={18} stroke={1.8} {...props} />,
  Meter: (props) => <IconBolt size={18} stroke={1.8} {...props} />,
  Profile: (props) => <IconUser size={18} stroke={1.8} {...props} />,
  Logout: (props) => <IconLogout size={16} stroke={1.8} {...props} />,
  Electricity: (props) => <IconBolt size={16} stroke={2} {...props} />,
  Water: (props) => <IconDroplet size={16} stroke={2} {...props} />,
  Alert: (props) => <IconAlertCircle size={16} stroke={2} {...props} />,
  Room: (props) => <IconDoor size={16} stroke={1.8} {...props} />,
  Calendar: (props) => <IconCalendar size={16} stroke={1.8} {...props} />,
  Phone: (props) => <IconPhone size={16} stroke={1.8} {...props} />,
  Eye: (props) => <IconEye size={16} stroke={1.8} {...props} />,
  EyeOff: (props) => <IconEyeOff size={16} stroke={1.8} {...props} />,
  ChevronDown: (props) => <IconChevronDown size={14} stroke={2.2} {...props} />,
  ChevronUp: (props) => <IconChevronUp size={14} stroke={2.2} {...props} />,
  Bell: (props) => <IconBell size={17} stroke={1.8} {...props} />,
  Receipt: (props) => <IconFileInvoice size={15} stroke={1.8} {...props} />,
  TrendingDown: (props) => <IconTrendingDown size={13} stroke={2.2} {...props} />,
  TrendingUp: (props) => <IconTrendingUp size={13} stroke={2.2} {...props} />,
  Menu: (props) => <IconMenu2 size={20} stroke={2} {...props} />,
  Clock: (props) => <IconClock size={15} stroke={1.8} {...props} />,
  Print: (props) => <IconPrinter size={16} stroke={2} {...props} />,
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

  const isFormValid = username.trim().length > 0 && password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;
    setError("");
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
    <div className="insta-login-page" style={{ position: "relative", overflow: "hidden" }}>
      <DotPattern />
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
            Transparent utility rates &amp; readings&nbsp;—<br />
            <span className="insta-highlight">delivered every month.</span>
          </h1>

          <div className="insta-mockup-wrapper">
            {/* Phone/Card Frame */}
            <div className="insta-mockup-frame">
              <BorderBeam size={280} duration={8} borderWidth={2.5} colorFrom="#1D4ED8" colorTo="#60A5FA" />
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
            <p className="insta-form-subtitle">Tenant portal for billing statements & meter tracking</p>

            {/* Portal Switcher */}
            <div className="insta-portal-switch">
              <a href="/" className="insta-portal-btn">
                Admin Portal
              </a>
              <button type="button" className="insta-portal-btn active">
                Tenant Portal
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="insta-input-wrapper">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="Unit number or username"
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
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", padding: "10px 14px", borderRadius: "10px", fontSize: "12.5px", fontWeight: 600, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icons.Alert />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="insta-btn-submit"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? "Logging in…" : "Log in"}
              </button>

              <a
                href="#forgot"
                onClick={(e) => { e.preventDefault(); alert("Please contact your property landlord/admin to reset your room password."); }}
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
   PAYMENT INSTRUCTIONS MODAL
───────────────────────────────────────────── */
function PaymentInstructionsModal({ onClose, amount }) {
  return (
    <>
      <div
        className="confirm-dialog-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="confirm-dialog" role="dialog" aria-modal="true" style={{ maxWidth: "460px" }}>
        <div className="confirm-dialog-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 className="confirm-dialog-title" style={{ margin: 0 }}>Payment Instructions</h2>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "none", border: "none", fontSize: "18px", color: "#94A3B8", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
          <p className="confirm-dialog-message">
            Please settle your outstanding balance of <strong style={{ color: "#2563EB" }}>{formatCurrency(amount)}</strong> through the following official channels:
          </p>
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              background: "#F8FAFC",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontSize: "13.5px",
            }}
          >
            <div>
              <strong style={{ color: "#0F172A", display: "block" }}>GCash / Maya</strong>
              <span style={{ color: "#2563EB", fontWeight: 800, fontSize: "15px" }}>0917-123-4567</span>
              <span style={{ color: "#64748B", display: "block", fontSize: "12px" }}>Account Name: TARIPA Administration</span>
            </div>
            <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "12px" }}>
              <strong style={{ color: "#0F172A", display: "block" }}>Bank Transfer (BDO / BPI)</strong>
              <span style={{ color: "#334155", fontWeight: 700 }}>Account #: 1234-5678-9012</span>
              <span style={{ color: "#64748B", display: "block", fontSize: "12px" }}>Account Name: TARIPA Properties Inc.</span>
            </div>
            <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "12px", fontSize: "12px", color: "#64748B" }}>
              * After sending payment, please screenshot the transfer receipt and present or message it to your building manager for verification.
            </div>
          </div>
          <div className="confirm-dialog-actions" style={{ marginTop: "20px" }}>
            <button
              type="button"
              className="confirm-dialog-btn confirm-dialog-btn-confirm"
              onClick={onClose}
              style={{ background: "#2563EB", color: "#FFFFFF", borderRadius: "12px", width: "100%", padding: "10px" }}
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   RECEIPT / STATEMENT OF ACCOUNT MODAL
───────────────────────────────────────────── */
function ReceiptModal({ bill, tenant, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="confirm-dialog-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="confirm-dialog" role="dialog" aria-modal="true" style={{ maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="confirm-dialog-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #E2E8F0", paddingBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#2563EB", color: "#fff", display: "grid", placeItems: "center", fontSize: "12px", fontWeight: 800 }}>T</span>
                <strong style={{ fontSize: "16px", color: "#0F172A" }}>TARIPA STATEMENT OF ACCOUNT</strong>
              </div>
              <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginTop: "2px" }}>
                Official Submeter Utility Billing Statement
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "none", border: "none", fontSize: "18px", color: "#94A3B8", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "16px 0", fontSize: "12.5px" }}>
            <div>
              <span style={{ color: "#64748B", display: "block" }}>Billed Resident</span>
              <strong style={{ color: "#0F172A", fontSize: "13.5px" }}>{tenant?.full_name || "—"}</strong>
              <span style={{ color: "#64748B", display: "block", fontSize: "11.5px" }}>Room {tenant?.room_number || "—"}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ color: "#64748B", display: "block" }}>Invoice #</span>
              <strong style={{ color: "#0F172A" }}>INV-{String(bill?.id || "001").padStart(4, "0")}</strong>
              <span style={{ color: "#64748B", display: "block", fontSize: "11.5px" }}>
                Period: {formatMonthYear(bill?.billing_month)}
              </span>
            </div>
          </div>

          <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden", margin: "16px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "#64748B", fontWeight: 600 }}>Utility</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "#64748B", fontWeight: 600 }}>Usage</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "#64748B", fontWeight: 600 }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0F172A" }}>Electricity Submeter</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748B" }}>
                    {bill ? Number(bill.electricity_consumption).toFixed(2) : "0.00"} kWh
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#0F172A" }}>
                    {formatCurrency(bill?.electricity_charge || 0)}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0F172A" }}>Water Submeter</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748B" }}>
                    {bill ? Number(bill.water_consumption).toFixed(2) : "0.00"} Cu.M
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#0F172A" }}>
                    {formatCurrency(bill?.water_charge || 0)}
                  </td>
                </tr>
                <tr style={{ background: "#EFF6FF" }}>
                  <td colSpan={2} style={{ padding: "10px 12px", fontWeight: 800, color: "#1D4ED8" }}>Total Billed</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#1D4ED8", fontSize: "14px" }}>
                    {formatCurrency(bill?.total_amount || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                flex: 1,
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                padding: "10px 14px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Icons.Print />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: "#F1F5F9",
                color: "#475569",
                border: "none",
                borderRadius: "12px",
                padding: "10px 14px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   DASHBOARD PAGE
───────────────────────────────────────────── */
function DashboardPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [breakdownOpen,    setBreakdownOpen]    = useState(true);

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

  const { tenant, latest_bill, outstanding, latest_meter, recent_bills = [] } = data;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = tenant.full_name ? tenant.full_name.trim().split(/\s+/)[0] : "Resident";
  
  const currentBillingMonthName = latest_bill?.billing_month
    ? new Date(latest_bill.billing_month).toLocaleDateString("en-PH", { month: "long" })
    : new Date().toLocaleDateString("en-PH", { month: "long" });

  const dueDateFormatted = latest_bill?.billing_month
    ? new Date(latest_bill.billing_month).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : "end of month";

  // Electricity consumption: latest meter reading or latest bill
  const elecConsumption = latest_meter?.electricity_consumption != null
    ? Number(latest_meter.electricity_consumption)
    : Number(latest_bill?.electricity_consumption || 0);

  // Water consumption: latest meter reading or latest bill
  const waterConsumption = latest_meter?.water_consumption != null
    ? Number(latest_meter.water_consumption)
    : Number(latest_bill?.water_consumption || 0);

  // Computed electricity & water unit rates if bill has charges
  const elecRate = latest_bill && Number(latest_bill.electricity_consumption) > 0
    ? (Number(latest_bill.electricity_charge) / Number(latest_bill.electricity_consumption)).toFixed(2)
    : null;

  const waterRate = latest_bill && Number(latest_bill.water_consumption) > 0
    ? (Number(latest_bill.water_charge) / Number(latest_bill.water_consumption)).toFixed(2)
    : null;

  // Outstanding carry-over (if outstanding amount is higher than latest bill total)
  const carryOverAmount = latest_bill && outstanding.amount > Number(latest_bill.total_amount)
    ? outstanding.amount - Number(latest_bill.total_amount)
    : 0;

  // Base rent if total bill exceeds electricity + water
  const computedBaseRent = latest_bill
    ? Math.max(0, Number(latest_bill.total_amount) - Number(latest_bill.electricity_charge || 0) - Number(latest_bill.water_charge || 0))
    : 0;

  // Comparison trends vs 6-month average
  const sixMonthBills = recent_bills.slice(0, 6);
  const avgElec = sixMonthBills.length > 1
    ? sixMonthBills.reduce((acc, b) => acc + Number(b.electricity_consumption || 0), 0) / sixMonthBills.length
    : elecConsumption;
  const avgWater = sixMonthBills.length > 1
    ? sixMonthBills.reduce((acc, b) => acc + Number(b.water_consumption || 0), 0) / sixMonthBills.length
    : waterConsumption;

  const elecDiffPct = avgElec > 0 ? Math.round(((elecConsumption - avgElec) / avgElec) * 100) : 0;
  const waterDiffPct = avgWater > 0 ? Math.round(((waterConsumption - avgWater) / avgWater) * 100) : 0;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
      {/* ── WELCOME TITLE ── */}
      <div style={{ margin: "28px 0 24px" }}>
        <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.025em" }}>
          {greeting}, {firstName}
        </h1>
        <p style={{ fontSize: "14.5px", color: "#64748B", margin: "4px 0 0" }}>
          Here's your {currentBillingMonthName} billing summary for Room {tenant.room_number || "—"}.
        </p>
      </div>

      {/* ── TWO-COLUMN GRID ── */}
      <div className="tenant-dashboard-grid">
        
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Card 1: Vibrant Cobalt Blue Balance Card */}
          <div style={{
            background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            borderRadius: "24px",
            padding: "26px",
            color: "#FFFFFF",
            boxShadow: "0 14px 34px rgba(37, 99, 235, 0.28)",
            position: "relative",
            overflow: "hidden",
          }}>
            <BorderBeam size={260} duration={8} borderWidth={1.5} colorFrom="rgba(255,255,255,0.7)" colorTo="rgba(147,197,253,0.9)" />
            <p style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.8)",
              margin: 0,
            }}>
              CURRENT OUTSTANDING BALANCE
            </p>
            <div style={{
              fontSize: "38px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: "10px 0 16px",
              lineHeight: 1,
            }}>
              <NumberTicker value={Number(outstanding.amount || latest_bill?.total_amount || 0)} prefix="₱" decimalPlaces={2} />
            </div>
            
            <div style={{
              background: "rgba(255, 255, 255, 0.16)",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              borderRadius: "9999px",
              padding: "6px 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11.5px",
              color: "#FFFFFF",
            }}>
              <Icons.Calendar />
              <span>
                Due {dueDateFormatted}
                {carryOverAmount > 0 && `  incl. ${formatCurrency(carryOverAmount)} carry-over`}
                {outstanding.amount === 0 && "  · Fully settled"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "22px" }}>
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  color: "#FFFFFF",
                  borderRadius: "14px",
                  padding: "11px 14px",
                  fontWeight: 600,
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                <Icons.Bills />
                Pay Now
              </button>

              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                style={{
                  background: "#FFFFFF",
                  border: "none",
                  color: "#1D4ED8",
                  borderRadius: "14px",
                  padding: "11px 14px",
                  fontWeight: 700,
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  transition: "transform 0.15s ease",
                }}
              >
                <Icons.Receipt />
                Receipt PDF
              </button>
            </div>
          </div>

          {/* Card 2: Monthly Bill Breakdown */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "22px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
          }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={() => setBreakdownOpen((o) => !o)}
            >
              <div>
                <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  {currentBillingMonthName} Bill Breakdown
                </h3>
                <span style={{ fontSize: "11.5px", color: "#64748B", display: "block", marginTop: "2px" }}>
                  INV-{String(latest_bill?.id || "001").padStart(4, "0")}
                </span>
              </div>
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "4px",
                  display: "grid",
                  placeItems: "center",
                }}
                aria-label={breakdownOpen ? "Collapse breakdown" : "Expand breakdown"}
              >
                {breakdownOpen ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
              </button>
            </div>

            {breakdownOpen && (
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {computedBaseRent > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div>
                      <strong style={{ fontSize: "13.5px", fontWeight: 600, color: "#0F172A", display: "block" }}>
                        Base Rent
                      </strong>
                      <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>
                        Room Rent · {currentBillingMonthName}
                      </span>
                    </div>
                    <strong style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                      {formatCurrency(computedBaseRent)}
                    </strong>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <strong style={{ fontSize: "13.5px", fontWeight: 600, color: "#0F172A", display: "block" }}>
                      Electricity
                    </strong>
                    <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>
                      {latest_bill ? Number(latest_bill.electricity_consumption).toFixed(0) : "0"} kWh
                      {elecRate ? ` × ₱${elecRate}` : ""}
                    </span>
                  </div>
                  <strong style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                    {formatCurrency(latest_bill?.electricity_charge || 0)}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <strong style={{ fontSize: "13.5px", fontWeight: 600, color: "#0F172A", display: "block" }}>
                      Water
                    </strong>
                    <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>
                      {latest_bill ? Number(latest_bill.water_consumption).toFixed(0) : "0"} Cu.M
                      {waterRate ? ` × ₱${waterRate}` : ""}
                    </span>
                  </div>
                  <strong style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                    {formatCurrency(latest_bill?.water_charge || 0)}
                  </strong>
                </div>

                <div style={{
                  borderTop: "1px solid #F1F5F9",
                  paddingTop: "12px",
                  marginTop: "2px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <strong style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>Total Due</strong>
                  <strong style={{ fontSize: "16.5px", fontWeight: 800, color: "#2563EB" }}>
                    <NumberTicker value={Number(latest_bill?.total_amount || 0)} prefix="₱" decimalPlaces={2} />
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Dual Consumption Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            
            {/* Electricity Gauge Card */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              padding: "20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
            }}>
              <span style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "#EFF6FF",
                color: "#2563EB",
                display: "grid",
                placeItems: "center",
              }}>
                <Icons.Electricity />
              </span>
              <p style={{ fontSize: "12px", color: "#64748B", margin: "14px 0 2px", fontWeight: 500 }}>
                Electricity
              </p>
              <div>
                <strong style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>
                  <NumberTicker value={Number(elecConsumption)} />
                </strong>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B", marginLeft: "4px" }}>
                  kWh
                </span>
              </div>
              <div style={{
                height: "6px",
                borderRadius: "9999px",
                background: "#E2E8F0",
                marginTop: "14px",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  borderRadius: "9999px",
                  background: "#2563EB",
                  width: `${Math.min(100, Math.max(12, (elecConsumption / 100) * 100))}%`,
                }} />
              </div>
              <p style={{
                fontSize: "11px",
                fontWeight: 600,
                color: elecDiffPct <= 0 ? "#16A34A" : "#D97706",
                margin: "12px 0 0",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}>
                {elecDiffPct <= 0 ? (
                  <>
                    <Icons.TrendingDown />
                    <span>{Math.abs(elecDiffPct)}% vs 6-mo avg</span>
                  </>
                ) : (
                  <>
                    <Icons.TrendingUp />
                    <span>{elecDiffPct}% vs 6-mo avg</span>
                  </>
                )}
              </p>
            </div>

            {/* Water Gauge Card */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              padding: "20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
            }}>
              <span style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "#EFF6FF",
                color: "#2563EB",
                display: "grid",
                placeItems: "center",
              }}>
                <Icons.Water />
              </span>
              <p style={{ fontSize: "12px", color: "#64748B", margin: "14px 0 2px", fontWeight: 500 }}>
                Water
              </p>
              <div>
                <strong style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>
                  <NumberTicker value={Number(waterConsumption)} />
                </strong>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B", marginLeft: "4px" }}>
                  Cu.M
                </span>
              </div>
              <div style={{
                height: "6px",
                borderRadius: "9999px",
                background: "#E2E8F0",
                marginTop: "14px",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  borderRadius: "9999px",
                  background: "#2563EB",
                  width: `${Math.min(100, Math.max(12, (waterConsumption / 20) * 100))}%`,
                }} />
              </div>
              <p style={{
                fontSize: "11px",
                fontWeight: 600,
                color: waterDiffPct > 0 ? "#D97706" : "#16A34A",
                margin: "12px 0 0",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}>
                {waterDiffPct > 0 ? (
                  <>
                    <Icons.TrendingUp />
                    <span>{waterDiffPct}% vs 6-mo avg</span>
                  </>
                ) : (
                  <>
                    <Icons.TrendingDown />
                    <span>{Math.abs(waterDiffPct)}% vs 6-mo avg</span>
                  </>
                )}
              </p>
            </div>

          </div>

          {/* Meter Reading History Table Card */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "24px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Meter Reading History
            </h3>
            <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 18px" }}>
              Your share of Room {tenant.room_number || "—"} submeters
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <th style={{ textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", paddingBottom: "10px" }}>
                      MONTH
                    </th>
                    <th style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", paddingBottom: "10px" }}>
                      KWH
                    </th>
                    <th style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", paddingBottom: "10px" }}>
                      CU.M
                    </th>
                    <th style={{ textAlign: "right", fontSize: "11px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", paddingBottom: "10px" }}>
                      AMOUNT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent_bills.slice(0, 6).map((bill) => {
                    const isPaid = bill.status === "Paid";
                    const isPending = bill.status === "Pending";
                    return (
                      <tr key={bill.id} style={{ borderBottom: "1px solid #F8FAFC" }}>
                        <td style={{ padding: "12px 0" }}>
                          <strong style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A", display: "block" }}>
                            {formatMonthYear(bill.billing_month)}
                          </strong>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            borderRadius: "9999px",
                            padding: "2px 8px",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            marginTop: "4px",
                            background: isPaid ? "#DCFCE7" : isPending ? "#FEF3C7" : "#FEE2E2",
                            color: isPaid ? "#16A34A" : isPending ? "#D97706" : "#DC2626",
                          }}>
                            ● {isPaid ? "Paid" : isPending ? "Unpaid" : "Overdue"}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", fontSize: "13px", fontWeight: 500, color: "#334155", padding: "12px 0" }}>
                          {Number(bill.electricity_consumption || 0).toFixed(0)}
                        </td>
                        <td style={{ textAlign: "center", fontSize: "13px", fontWeight: 500, color: "#334155", padding: "12px 0" }}>
                          {Number(bill.water_consumption || 0).toFixed(0)}
                        </td>
                        <td style={{ textAlign: "right", fontSize: "13.5px", fontWeight: 700, color: "#0F172A", padding: "12px 0" }}>
                          {formatCurrency(bill.total_amount)}
                        </td>
                      </tr>
                    );
                  })}
                  {recent_bills.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "28px 0", color: "#94A3B8", fontSize: "13px" }}>
                        No billing history recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* ── FOOTER ── */}
      <footer style={{ textAlign: "center", marginTop: "36px", paddingBottom: "36px", fontSize: "12px", color: "#94A3B8" }}>
        Previewing tenant view ·{" "}
        <a href="/" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>
          Back to Admin
        </a>
      </footer>

      {/* ── PAYMENT MODAL ── */}
      {showPaymentModal && (
        <PaymentInstructionsModal
          onClose={() => setShowPaymentModal(false)}
          amount={outstanding.amount || latest_bill?.total_amount || 0}
        />
      )}

      {/* ── STATEMENT OF ACCOUNT / RECEIPT MODAL ── */}
      {showReceiptModal && (
        <ReceiptModal
          bill={latest_bill}
          tenant={tenant}
          onClose={() => setShowReceiptModal(false)}
        />
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

  const paidCount = bills.filter((b) => b.status === "Paid").length;
  const outstandingSum = bills
    .filter((b) => b.status !== "Paid")
    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

  return (
    <div className="cb-page" style={{ width: "100%", margin: "0 auto" }}>
      <div className="tg-page-header">
        <p className="tg-page-eyebrow">BILLING HISTORY</p>
        <h2 className="tg-page-title">My Statements & Bills</h2>
        <p className="tg-page-desc">Complete record of room rent and computed utility statements.</p>
      </div>

      {/* Summary KPI Strip (Desktop 3-column grid) */}
      {bills.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
          <div className="tg-glass-card" style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", margin: "0 0 6px" }}>Total Invoices</p>
            <strong style={{ fontSize: "24px", color: "#0F172A", fontWeight: 800 }}>{bills.length}</strong>
          </div>
          <div className="tg-glass-card" style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", margin: "0 0 6px" }}>Settled Bills</p>
            <strong style={{ fontSize: "24px", color: "#16A34A", fontWeight: 800 }}>{paidCount}</strong>
          </div>
          <div className="tg-glass-card" style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", margin: "0 0 6px" }}>Unsettled Balance</p>
            <strong style={{ fontSize: "24px", color: outstandingSum > 0 ? "#DC2626" : "#2563EB", fontWeight: 800 }}>{formatCurrency(outstandingSum)}</strong>
          </div>
        </div>
      )}

      {bills.length === 0 ? (
        <div className="cb-empty-state">
          <div className="cb-empty-icon"><Icons.Bills /></div>
          <h3>No billing records</h3>
          <p>Your bill history will appear here once billing statements are generated by the administrator.</p>
        </div>
      ) : (
        <>
          {/* Mobile Accordion Cards */}
          <div className="cb-bills-list">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className={`cb-bill-card ${expanded === bill.id ? "expanded" : ""}`}
                style={{ borderRadius: "18px", overflow: "hidden" }}
              >
                <button
                  type="button"
                  className="cb-bill-card-header"
                  onClick={() => setExpanded(expanded === bill.id ? null : bill.id)}
                  aria-expanded={expanded === bill.id}
                  style={{ padding: "14px 18px" }}
                >
                  <div className="cb-bill-card-main">
                    <div className="cb-bill-month" style={{ fontWeight: 800 }}>{formatMonthYear(bill.billing_month)}</div>
                    <div className="cb-bill-amount" style={{ color: "#2563EB", fontWeight: 800 }}>{formatCurrency(bill.total_amount)}</div>
                  </div>
                  <div className="cb-bill-card-right">
                    <StatusBadge status={bill.status} />
                    <span className="cb-bill-chevron"><Icons.ChevronDown /></span>
                  </div>
                </button>

                {expanded === bill.id && (
                  <div className="cb-bill-card-detail" style={{ padding: "14px 18px", background: "#F8FAFC" }}>
                    <div className="cb-bill-detail-grid">
                      <div className="cb-bill-detail-row">
                        <span className="cb-bill-detail-label"><Icons.Electricity /> Electricity Consumption</span>
                        <span style={{ fontWeight: 700 }}>{Number(bill.electricity_consumption).toFixed(3)} kWh</span>
                      </div>
                      <div className="cb-bill-detail-row">
                        <span className="cb-bill-detail-label"><Icons.Electricity /> Electricity Subtotal</span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(bill.electricity_charge)}</span>
                      </div>
                      <div className="cb-bill-detail-row">
                        <span className="cb-bill-detail-label"><Icons.Water /> Water Consumption</span>
                        <span style={{ fontWeight: 700 }}>{Number(bill.water_consumption).toFixed(3)} Cu.M</span>
                      </div>
                      <div className="cb-bill-detail-row">
                        <span className="cb-bill-detail-label"><Icons.Water /> Water Subtotal</span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(bill.water_charge)}</span>
                      </div>
                      <div className="cb-bill-detail-row cb-bill-detail-total" style={{ borderTop: "2px solid #E2E8F0", paddingTop: "8px", marginTop: "4px" }}>
                        <span className="cb-bill-detail-label" style={{ fontWeight: 800, color: "#0F172A" }}>Total Billed Amount</span>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: "#2563EB" }}>{formatCurrency(bill.total_amount)}</span>
                      </div>
                      <div className="cb-bill-detail-row">
                        <span className="cb-bill-detail-label">Issue Date</span>
                        <span>{formatDate(bill.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="tg-glass-card cb-desktop-only" style={{ marginTop: "12px", width: "100%", overflowX: "auto" }}>
            <table className="cb-table" style={{ width: "100%", margin: 0, minWidth: "800px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "14px 20px" }}>Billing Month</th>
                  <th style={{ textAlign: "right", padding: "14px 16px" }}>Electricity (kWh)</th>
                  <th style={{ textAlign: "right", padding: "14px 16px" }}>Elec. Charge</th>
                  <th style={{ textAlign: "right", padding: "14px 16px" }}>Water (Cu.M)</th>
                  <th style={{ textAlign: "right", padding: "14px 16px" }}>Water Charge</th>
                  <th style={{ textAlign: "right", padding: "14px 16px" }}>Total Bill</th>
                  <th style={{ textAlign: "center", padding: "14px 16px" }}>Status</th>
                  <th style={{ textAlign: "right", padding: "14px 20px" }}>Date Issued</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    <td style={{ padding: "14px 20px" }}><strong>{formatMonthYear(bill.billing_month)}</strong></td>
                    <td style={{ textAlign: "right", padding: "14px 16px" }}>{Number(bill.electricity_consumption).toFixed(3)}</td>
                    <td style={{ textAlign: "right", padding: "14px 16px" }}>{formatCurrency(bill.electricity_charge)}</td>
                    <td style={{ textAlign: "right", padding: "14px 16px" }}>{Number(bill.water_consumption).toFixed(3)}</td>
                    <td style={{ textAlign: "right", padding: "14px 16px" }}>{formatCurrency(bill.water_charge)}</td>
                    <td style={{ textAlign: "right", padding: "14px 16px", fontWeight: 800, color: "#0F172A" }}>{formatCurrency(bill.total_amount)}</td>
                    <td style={{ textAlign: "center", padding: "14px 16px" }}><StatusBadge status={bill.status} /></td>
                    <td style={{ textAlign: "right", fontSize: "12px", color: "#64748B", padding: "14px 20px" }}>{formatDate(bill.created_at)}</td>
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

  const latestReading = readings.length > 0 ? readings[0] : null;

  return (
    <div className="cb-page" style={{ width: "100%", margin: "0 auto" }}>
      <div className="tg-page-header">
        <p className="tg-page-eyebrow">UTILITY METRICS</p>
        <h2 className="tg-page-title">Meter Logs & Usage</h2>
        <p className="tg-page-desc">Itemized electricity and water submeter recordings for your room.</p>
      </div>

      {latestReading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "16px" }}>
          <div className="tg-gauge-card tg-glass-card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="tg-gauge-icon-badge" style={{ width: "40px", height: "40px", borderRadius: "12px" }}>
                <Icons.Electricity />
              </span>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", margin: 0 }}>LATEST ELECTRIC USAGE</p>
                <strong style={{ fontSize: "22px", color: "#0F172A", fontWeight: 800 }}>
                  {Number(latestReading.electricity_consumption).toFixed(2)} <span style={{ fontSize: "13px", color: "#64748B" }}>kWh</span>
                </strong>
              </div>
            </div>
          </div>
          <div className="tg-gauge-card tg-glass-card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="tg-gauge-icon-badge" style={{ width: "40px", height: "40px", borderRadius: "12px" }}>
                <Icons.Water />
              </span>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", margin: 0 }}>LATEST WATER USAGE</p>
                <strong style={{ fontSize: "22px", color: "#0F172A", fontWeight: 800 }}>
                  {Number(latestReading.water_consumption).toFixed(2)} <span style={{ fontSize: "13px", color: "#64748B" }}>Cu.M</span>
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {readings.length === 0 ? (
        <div className="cb-empty-state">
          <div className="cb-empty-icon"><Icons.Meter /></div>
          <h3>No meter readings</h3>
          <p>Your meter recordings will appear here once logged by the property manager.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: "20px" }}>
          {readings.map((r) => (
            <article className="cb-reading-card tg-glass-card" key={r.id}>
              <div className="cb-reading-month" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", padding: "16px 22px" }}>
                <strong style={{ fontSize: "16px", color: "#0F172A" }}>{formatMonthYear(r.billing_month)}</strong>
                {r.recorded_at && (
                  <span style={{ fontSize: "12px", color: "#64748B" }}>{formatDate(r.recorded_at)}</span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div className="cb-reading-section cb-reading-electric" style={{ borderRight: "1px solid #E2E8F0" }}>
                  <div className="cb-reading-section-label">
                    <Icons.Electricity /> Electricity Submeter
                  </div>
                  <div className="cb-reading-row">
                    <div className="cb-reading-item">
                      <span className="cb-reading-item-label">Previous</span>
                      <span className="cb-reading-item-val">{Number(r.electricity_previous).toFixed(2)}</span>
                      <span className="cb-reading-unit">kWh</span>
                    </div>
                    <div className="cb-reading-arrow">→</div>
                    <div className="cb-reading-item">
                      <span className="cb-reading-item-label">Present</span>
                      <span className="cb-reading-item-val">{Number(r.electricity_current).toFixed(2)}</span>
                      <span className="cb-reading-unit">kWh</span>
                    </div>
                    <div className="cb-reading-usage" style={{ width: "100%", marginTop: "8px" }}>
                      <span className="cb-reading-usage-label">Net Usage</span>
                      <strong style={{ color: "#2563EB", fontSize: "15px" }}>{Number(r.electricity_consumption).toFixed(2)} kWh</strong>
                    </div>
                  </div>
                </div>

                <div className="cb-reading-section cb-reading-water">
                  <div className="cb-reading-section-label">
                    <Icons.Water /> Water Submeter
                  </div>
                  <div className="cb-reading-row">
                    <div className="cb-reading-item">
                      <span className="cb-reading-item-label">Previous</span>
                      <span className="cb-reading-item-val">{Number(r.water_previous).toFixed(2)}</span>
                      <span className="cb-reading-unit">Cu.M</span>
                    </div>
                    <div className="cb-reading-arrow">→</div>
                    <div className="cb-reading-item">
                      <span className="cb-reading-item-label">Present</span>
                      <span className="cb-reading-item-val">{Number(r.water_current).toFixed(2)}</span>
                      <span className="cb-reading-unit">Cu.M</span>
                    </div>
                    <div className="cb-reading-usage" style={{ width: "100%", marginTop: "8px" }}>
                      <span className="cb-reading-usage-label">Net Usage</span>
                      <strong style={{ color: "#0284C7", fontSize: "15px" }}>{Number(r.water_consumption).toFixed(2)} Cu.M</strong>
                    </div>
                  </div>
                </div>
              </div>
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
    <div className="cb-page" style={{ width: "100%", margin: "0 auto" }}>
      <div className="tg-page-header">
        <p className="tg-page-eyebrow">TENANT ACCOUNT</p>
        <h2 className="tg-page-title">Resident Profile</h2>
        <p className="tg-page-desc">Your verified residential information and room allocation.</p>
      </div>

      <div className="cb-profile-card tg-glass-card" style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 40px" }}>
        <div className="cb-profile-avatar" style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", boxShadow: "0 8px 24px rgba(37, 99, 235, 0.3)" }}>
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        <h3 className="cb-profile-name" style={{ fontSize: "22px", color: "#0F172A", marginTop: "4px" }}>{profile.full_name}</h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <StatusBadge status={profile.status} />
          {profile.room_number && (
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #DBEAFE" }}>
              Room {profile.room_number}
            </span>
          )}
        </div>

        <div className="cb-profile-details" style={{ marginTop: "16px" }}>
          <div className="cb-profile-detail-row">
            <span className="cb-profile-detail-label"><Icons.Profile /> Username</span>
            <span className="cb-profile-detail-value" style={{ fontFamily: "monospace", color: "#0F172A" }}>{profile.username}</span>
          </div>
          <div className="cb-profile-detail-row">
            <span className="cb-profile-detail-label"><Icons.Phone /> Contact Number</span>
            <span className="cb-profile-detail-value">{profile.contact_number || "None recorded"}</span>
          </div>
          <div className="cb-profile-detail-row">
            <span className="cb-profile-detail-label"><Icons.Room /> Assigned Room</span>
            <span className="cb-profile-detail-value">
              {profile.room_number ? `Room ${profile.room_number}` : "Not assigned"}
            </span>
          </div>
          <div className="cb-profile-detail-row">
            <span className="cb-profile-detail-label"><Icons.Calendar /> Move-in Date</span>
            <span className="cb-profile-detail-value">{formatDate(profile.move_in_date)}</span>
          </div>
          <div className="cb-profile-detail-row">
            <span className="cb-profile-detail-label"><Icons.Calendar /> Account Registered</span>
            <span className="cb-profile-detail-value">{formatDate(profile.created_at)}</span>
          </div>
        </div>

        <div className="cb-profile-note" style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#475569", borderRadius: "12px", marginTop: "16px" }}>
          <Icons.Alert />
          To update your contact details or report changes, please notify your property manager directly.
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PORTAL SHELL (authenticated layout)
───────────────────────────────────────────── */
function PortalShell({ tenant, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");

  const handleLogout = () => {
    clearAuth(); // Only clears client auth
    onLogout();
  };

  const getInitials = (name) => {
    if (!name) return "MS";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F6F8FB",
      backgroundImage: "radial-gradient(1200px 600px at 0% 0%, #FFFFFF 0%, transparent 60%), radial-gradient(900px 500px at 100% 100%, #E9EEF5 0%, transparent 60%)",
      backgroundAttachment: "fixed",
    }}>

      {/* ── TOP FLOATING LIQUID CAPSULE HEADER (Screenshot) ── */}
      <div className="tenant-top-capsule">
        <header className="tenant-top-capsule-bar">
          {/* Left: Tenant Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "#E2E8F0",
              color: "#334155",
              fontSize: "13px",
              fontWeight: 700,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}>
              {getInitials(tenant?.full_name)}
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
                {tenant?.full_name || "Maria Santos"}
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748B", lineHeight: 1.2, marginTop: "2px" }}>
                {tenant?.room_number ? `Room ${tenant.room_number}` : "Room 101 · Bed B"}
              </div>
            </div>
          </div>

          {/* Center: Segmented Navigation Capsule Tabs */}
          <nav className="tenant-nav-pill-group">
            <button
              type="button"
              className={`tenant-nav-pill-btn ${activePage === "dashboard" ? "active" : ""}`}
              onClick={() => setActivePage("dashboard")}
            >
              <Icons.Home />
              <span>Home</span>
            </button>

            <button
              type="button"
              className={`tenant-nav-pill-btn ${activePage === "bills" ? "active" : ""}`}
              onClick={() => setActivePage("bills")}
            >
              <Icons.Bills />
              <span>My Bills</span>
            </button>

            <button
              type="button"
              className={`tenant-nav-pill-btn ${activePage === "meters" ? "active" : ""}`}
              onClick={() => setActivePage("meters")}
            >
              <Icons.Meter />
              <span>Meter History</span>
            </button>

            <button
              type="button"
              className={`tenant-nav-pill-btn ${activePage === "profile" ? "active" : ""}`}
              onClick={() => setActivePage("profile")}
            >
              <Icons.Profile />
              <span>Profile</span>
            </button>
          </nav>

          {/* Right: Notification Bell & Sign Out */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="tenant-circle-btn"
              title="Notifications"
              onClick={() => alert("No new notifications.")}
            >
              <Icons.Bell />
              <span style={{
                position: "absolute",
                top: "7px",
                right: "7px",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#EF4444",
              }} />
            </button>

            <button
              type="button"
              className="tenant-circle-btn"
              title="Sign Out"
              onClick={handleLogout}
            >
              <Icons.Logout />
            </button>
          </div>
        </header>
      </div>

      {/* ── MAIN CONTENT VIEW ── */}
      <main style={{ paddingBottom: "48px" }}>
        {activePage === "dashboard" && <DashboardPage />}
        {activePage === "bills" && (
          <div style={{ maxWidth: "1400px", margin: "24px auto 0", padding: "0 24px" }}>
            <BillsPage />
          </div>
        )}
        {activePage === "meters" && (
          <div style={{ maxWidth: "1400px", margin: "24px auto 0", padding: "0 24px" }}>
            <MeterReadingsPage />
          </div>
        )}
        {activePage === "profile" && (
          <div style={{ maxWidth: "1400px", margin: "24px auto 0", padding: "0 24px" }}>
            <ProfilePage />
          </div>
        )}
      </main>

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
  const { showToast } = useToast();
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
  
  }, []);

  const handleLogin = (tenantData) => {
    setTenant(tenantData);
    setAuthState("authenticated");
    window.history.replaceState(null, "", "/client");
    showToast(`Welcome back, ${tenantData.full_name?.split(" ")[0] || "Tenant"}!`, "success");
  };

  const handleLogout = () => {
    // clearAuth() is already called inside PortalShell handleLogout
    setTenant(null);
    setAuthState("unauthenticated");
    window.history.replaceState(null, "", "/client/login");
    showToast("Signed out of Tenant Portal", "info");
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
