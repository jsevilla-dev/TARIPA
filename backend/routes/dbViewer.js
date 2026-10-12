const express = require("express");
const db = require("../config/db");

const router = express.Router();

const ALLOWED_TABLES = [
  "rooms",
  "tenants",
  "tenant_accounts",
  "utility_rates",
  "meter_readings",
  "billing_records",
];

router.get("/data", async (req, res) => {
  try {
    const result = {};
    for (const table of ALLOWED_TABLES) {
      const [columns] = await db.query(`DESCRIBE \`${table}\``);
      const [rows] = await db.query(`SELECT * FROM \`${table}\` ORDER BY id ASC`);
      const [createTbl] = await db.query(`SHOW CREATE TABLE \`${table}\``);
      result[table] = {
        columns,
        rows,
        createSql: createTbl[0]?.["Create Table"] || "",
      };
    }
    res.json({
      success: true,
      database: process.env.DB_NAME || "taripa_db",
      host: `${process.env.DB_HOST || "127.0.0.1"}:${process.env.DB_PORT || "3306"}`,
      tables: result,
    });
  } catch (error) {
    console.error("DB Viewer error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>phpMyAdmin · taripa_db (MySQL Database Explorer)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      background: #F1F5F9;
      color: #0F172A;
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 260px;
      background: #0F172A;
      color: #F8FAFC;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      border-right: 1px solid #1E293B;
    }
    .brand {
      padding: 20px 18px;
      border-bottom: 1px solid #1E293B;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-badge {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #F59E0B, #2563EB);
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 14px;
      color: #fff;
    }
    .brand-title { font-size: 15px; font-weight: 800; letter-spacing: -0.01em; }
    .brand-sub { font-size: 11px; color: #94A3B8; margin-top: 2px; }
    .db-meta {
      padding: 12px 18px;
      background: #1E293B;
      font-size: 11.5px;
      color: #CBD5E1;
      border-bottom: 1px solid #334155;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .db-meta strong { color: #38BDF8; font-family: monospace; font-size: 12.5px; }
    .nav-section {
      padding: 14px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }
    .nav-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748B;
      padding: 4px 8px 6px;
    }
    .table-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 9px 12px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #CBD5E1;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      font-family: monospace;
      transition: all 0.15s;
    }
    .table-btn:hover { background: #1E293B; color: #fff; }
    .table-btn.active { background: #2563EB; color: #fff; }
    .row-count {
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 999px;
      background: rgba(255,255,255,0.12);
      color: #fff;
      font-family: sans-serif;
    }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .topbar {
      background: #FFFFFF;
      border-bottom: 1px solid #E2E8F0;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      color: #475569;
      font-weight: 600;
    }
    .breadcrumb code {
      background: #EFF6FF;
      color: #1D4ED8;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tab-pill {
      padding: 7px 14px;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
      background: #F8FAFC;
      color: #475569;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
    }
    .tab-pill.active {
      background: #2563EB;
      color: #FFFFFF;
      border-color: #2563EB;
    }
    .refresh-btn {
      padding: 7px 14px;
      border-radius: 8px;
      border: 1px solid #BFDBFE;
      background: #EFF6FF;
      color: #1D4ED8;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
    }
    .refresh-btn:hover { background: #DBEAFE; }
    .content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-x: auto;
    }
    .card {
      background: #FFFFFF;
      border-radius: 14px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }
    .card-header {
      padding: 14px 18px;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-title {
      font-size: 14px;
      font-weight: 800;
      color: #0F172A;
      font-family: monospace;
    }
    .sql-banner {
      background: #0F172A;
      color: #38BDF8;
      padding: 10px 16px;
      font-family: monospace;
      font-size: 12px;
      border-bottom: 1px solid #1E293B;
    }
    .table-wrap { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    th {
      background: #F1F5F9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 10px 14px;
      border-bottom: 1px solid #CBD5E1;
      white-space: nowrap;
      font-family: monospace;
    }
    td {
      padding: 10px 14px;
      border-bottom: 1px solid #F1F5F9;
      color: #0F172A;
      white-space: nowrap;
      font-family: monospace;
    }
    tr:hover td { background: #F8FAFC; }
    .badge-pk {
      background: #FEF3C7;
      color: #B45309;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10.5px;
      font-weight: 800;
    }
    .badge-fk {
      background: #DBEAFE;
      color: #1D4ED8;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10.5px;
      font-weight: 800;
    }
    pre.ddl {
      padding: 18px;
      background: #0F172A;
      color: #E2E8F0;
      font-size: 12.5px;
      line-height: 1.55;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-badge">SQL</div>
      <div>
        <div class="brand-title">MySQL Explorer</div>
        <div class="brand-sub">phpMyAdmin · XAMPP MariaDB</div>
      </div>
    </div>
    <div class="db-meta">
      <span>Server: <strong id="host-label">127.0.0.1:3306</strong></span>
      <span>Database: <strong id="db-label">taripa_db</strong></span>
      <span>Status: <strong style="color:#34D399">● Connected</strong></span>
    </div>
    <div class="nav-section">
      <div class="nav-label">Tables (6)</div>
      <button class="table-btn active" id="btn-all" onclick="selectTable('ALL')">
        <span>★ ALL TABLES</span>
        <span class="row-count">6</span>
      </button>
      <div id="table-list"></div>
    </div>
  </aside>

  <main class="main">
    <header class="topbar">
      <div class="breadcrumb">
        <span>Server: 127.0.0.1</span> ›
        <span>Database: <code>taripa_db</code></span> ›
        <span id="current-table-crumb">All Tables</span>
      </div>
      <div class="actions">
        <button class="tab-pill active" id="tab-browse" onclick="setMode('browse')">Browse Rows (SELECT *)</button>
        <button class="tab-pill" id="tab-structure" onclick="setMode('structure')">Structure (DESCRIBE)</button>
        <button class="tab-pill" id="tab-sql" onclick="setMode('sql')">SQL DDL (CREATE TABLE)</button>
        <button class="refresh-btn" onclick="loadDb()">↻ Refresh Live Data</button>
      </div>
    </header>

    <div class="content" id="content-area">
      <div class="card"><div class="card-header">Loading database...</div></div>
    </div>
  </main>

  <script>
    let dbData = null;
    let activeTable = "ALL";
    let activeMode = "browse";

    async function loadDb() {
      const res = await fetch("/api/db-viewer/data");
      const json = await res.json();
      if (!json.success) return;
      dbData = json;
      document.getElementById("host-label").textContent = json.host;
      document.getElementById("db-label").textContent = json.database;
      renderSidebar();
      renderContent();
    }

    function selectTable(tbl) {
      activeTable = tbl;
      renderSidebar();
      renderContent();
    }

    function setMode(mode) {
      activeMode = mode;
      document.getElementById("tab-browse").classList.toggle("active", mode === "browse");
      document.getElementById("tab-structure").classList.toggle("active", mode === "structure");
      document.getElementById("tab-sql").classList.toggle("active", mode === "sql");
      renderContent();
    }

    function renderSidebar() {
      document.getElementById("btn-all").classList.toggle("active", activeTable === "ALL");
      const list = document.getElementById("table-list");
      list.innerHTML = "";
      Object.keys(dbData.tables).forEach((tbl) => {
        const count = dbData.tables[tbl].rows.length;
        const btn = document.createElement("button");
        btn.className = "table-btn" + (activeTable === tbl ? " active" : "");
        btn.innerHTML = "<span>" + tbl + "</span><span class='row-count'>" + count + "</span>";
        btn.onclick = () => selectTable(tbl);
        list.appendChild(btn);
      });
    }

    function escapeHtml(val) {
      if (val === null || val === undefined) return "<span style='color:#94A3B8'>NULL</span>";
      const s = String(val);
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function renderTableCard(tbl) {
      const info = dbData.tables[tbl];
      if (activeMode === "structure") {
        let trs = info.columns.map((c) => {
          const keyBadge = c.Key === "PRI" ? "<span class='badge-pk'>PRI (PK)</span>"
            : c.Key === "MUL" ? "<span class='badge-fk'>MUL (FK/IDX)</span>"
            : c.Key === "UNI" ? "<span class='badge-fk'>UNI</span>" : "";
          return "<tr><td><strong>" + c.Field + "</strong></td><td>" + c.Type + "</td><td>" + c.Null + "</td><td>" + keyBadge + "</td><td>" + escapeHtml(c.Default) + "</td><td>" + c.Extra + "</td></tr>";
        }).join("");
        return "<div class='card'><div class='card-header'><span class='card-title'>Table Structure: " + tbl + "</span></div><div class='sql-banner'>DESCRIBE \`" + tbl + "\`;</div><div class='table-wrap'><table><thead><tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr></thead><tbody>" + trs + "</tbody></table></div></div>";
      }

      if (activeMode === "sql") {
        return "<div class='card'><div class='card-header'><span class='card-title'>DDL Schema: " + tbl + "</span></div><pre class='ddl'>" + escapeHtml(info.createSql) + ";</pre></div>";
      }

      const cols = info.columns.map((c) => c.Field);
      const ths = cols.map((c) => "<th>" + c + "</th>").join("");
      const trs = info.rows.length === 0
        ? "<tr><td colspan='" + cols.length + "' style='color:#94A3B8;text-align:center'>0 rows</td></tr>"
        : info.rows.map((r) => "<tr>" + cols.map((c) => "<td>" + escapeHtml(r[c]) + "</td>").join("") + "</tr>").join("");

      return "<div class='card'><div class='card-header'><span class='card-title'>Table: " + tbl + " (" + info.rows.length + " rows)</span></div><div class='sql-banner'>SELECT * FROM \`" + tbl + "\` ORDER BY id ASC;</div><div class='table-wrap'><table><thead><tr>" + ths + "</tr></thead><tbody>" + trs + "</tbody></table></div></div>";
    }

    function renderContent() {
      document.getElementById("current-table-crumb").innerHTML = activeTable === "ALL" ? "All 6 Tables" : "Table: <code>" + activeTable + "</code>";
      const area = document.getElementById("content-area");
      const tablesToRender = activeTable === "ALL" ? Object.keys(dbData.tables) : [activeTable];
      area.innerHTML = tablesToRender.map(renderTableCard).join("");
    }

    loadDb();
  </script>
</body>
</html>`);
});

module.exports = router;
