# TARIPA — Boarding House Utility Billing & Tenant Management System

<div align="center">

![TARIPA Banner](https://img.shields.io/badge/TARIPA-v1.0.0-2563EB?style=for-the-badge&logo=homeadvisor&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-MariaDB-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**An automated, visual web platform designed for boarding houses and rental properties, featuring an interactive 3D digital twin, automated utility billing calculations, and isolated tenant client portals.**

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Directory Structure](#-directory-structure)
- [Key Features](#-key-features)
- [Security & Best Practices](#-security--best-practices)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [NPM Scripts Reference](#-npm-scripts-reference)
- [Documentation & Presentations](#-documentation--presentations)

---

## 🌟 Overview

**TARIPA** replaces tedious, error-prone manual utility calculations and paper-based tracking with an intuitive, end-to-end digital solution. It enables property administrators to manage room occupancy visually, record utility meter readings, automatically generate itemized monthly invoices, and provide tenants with real-time access to their billing history and room details.

---

## 🏛 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browsers                       │
│     ┌──────────────────────┐       ┌──────────────────┐     │
│     │     Admin Portal     │       │  Tenant Portal   │     │
│     │  (Desktop Dashboard) │       │ (Mobile & Web)   │     │
│     └──────────┬───────────┘       └─────────┬────────┘     │
└────────────────┼─────────────────────────────┼──────────────┘
                 │                             │
                 ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│               Frontend Layer (React + Vite)                 │
│      App.jsx / ClientApp.jsx / IsometricBuildingView.jsx    │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (JSON / Bearer JWT)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend Layer (Node + Express)              │
│  ┌──────────────────────┐       ┌────────────────────────┐  │
│  │ adminAuth Middleware │       │  clientAuth Middleware │  │
│  │ (RBAC & Lockout Lim) │       │  (IDOR / Row-Level)    │  │
│  └──────────┬───────────┘       └────────────┬───────────┘  │
└─────────────┼────────────────────────────────┼──────────────┘
              │                                │
              └───────────────┬────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│             Database Layer (MySQL / MariaDB via XAMPP)      │
│   tables: rooms · tenants · tenant_accounts · utility_rates │
│           meter_readings · billing_records                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```text
TARIPA/
├── .vscode/                      # VS Code workspace settings & extensions
├── backend/                      # Node.js + Express REST API
│   ├── config/                   # MySQL connection pool (db.js)
│   ├── middleware/               # Security: adminAuth, clientAuth, loginLimiter
│   ├── routes/                   # Route handlers (admin, client, billing, rooms, etc.)
│   └── server.js                 # Backend entry point
├── database/                     # Database assets & schemas
│   ├── backup/                   # Local database backups & SQL dumps
│   └── schema.sql                # Complete MySQL DDL table schema
├── docs/                         # Project documentation & presentations
│   ├── presentation/             # PowerPoint decks & presentation prompts
│   └── TARIPA_Final_Project_Documentation.md
├── frontend/                     # React 19 + Vite Frontend SPA
│   ├── public/                   # Static assets & icons
│   ├── src/                      # Source code
│   │   ├── components/           # Reusable UI & Isometric 3D components
│   │   ├── App.jsx               # Main Admin Portal application
│   │   ├── ClientApp.jsx         # Dedicated Tenant Portal application
│   │   ├── main.jsx              # React DOM entry point
│   │   └── App.css / index.css   # Styling & glassmorphism system
│   └── vite.config.js            # Vite build configuration & proxies
├── scripts/                      # CLI automation utilities
│   ├── set-admin-password.js     # Securely generate & hash admin passwords
│   ├── reset-tenant-password.js  # Reset tenant login credentials
│   └── create-tenant-account.js  # Provision tenant accounts via CLI
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore specifications
├── package.json                  # Root monorepo workspace & scripts
└── README.md                     # Project documentation
```

---

## 🚀 Key Features

1. **Interactive 3D Isometric Digital Twin**
   - Live architectural representation of the boarding house floors.
   - Clickable rooms with visual status indications (Occupied vs. Vacant).
2. **Automated Utility Meter Billing**
   - Simple entry of previous and current meter readings for Electricity and Water.
   - Automatic rate calculation, consumption math, and invoice creation.
3. **Role-Based Tenant Portal**
   - Independent client dashboard for boarders to view itemized bills, consumption trends, and payment status.
4. **Reports & Analytics Suite**
   - Real-time revenue metrics with segmented toggle between **Bar Graph** and **Line Graph**.
   - Comprehensive audit trails with multi-filter sorting (by status, room, and tenant).
5. **Integrated Live MySQL Database Explorer**
   - Built-in browser database inspector at `/db` for administrative auditing and verification.

---

## 🛡 Security & Best Practices

- **Authentication & RBAC:** Cryptographic JSON Web Tokens (JWT) with separate claims for Admin and Tenants.
- **Brute Force Protection:** IP & username-based rate limiting with automatic temporary lockout after 5 failed attempts.
- **IDOR Protection:** Zero reliance on client-supplied ID parameters; tenant queries strictly resolve server-side via token payload.
- **Row-Level Isolation:** All tenant data endpoints enforce parameterized `WHERE tenant_id = ?` scoping.
- **SQL Injection Prevention:** 100% prepared statements across all database queries.
- **Password Security:** Salted hashes generated using `bcrypt` (cost factor 12).

---

## 💻 Tech Stack

- **Frontend:** React 19, Vite, Lucide Icons, Modern CSS Glassmorphism
- **Backend:** Node.js, Express.js, JWT (`jsonwebtoken`), `bcrypt`
- **Database:** MySQL / MariaDB (via XAMPP)
- **Tooling:** ESLint, VS Code, Git

---

## 🛠 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [XAMPP](https://www.apachefriends.org/) (with Apache & MySQL modules)

### 1. Database Setup
1. Launch **XAMPP Control Panel** and start **MySQL**.
2. Open phpMyAdmin (`http://localhost/phpmyadmin`) or MySQL CLI.
3. Create database:
   ```sql
   CREATE DATABASE taripa_db;
   ```
4. Import `database/schema.sql` into `taripa_db`.

### 2. Environment Configuration
Copy the template file to `.env`:
```bash
cp .env.example .env
```
Ensure your database credentials match:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=taripa_db
JWT_SECRET=your_jwt_secret_key
ADMIN_USERNAME=admin
```

### 3. Run the System

**Terminal 1 — Backend:**
```bash
npm run dev:backend
```
*(Runs on `http://127.0.0.1:5000`)*

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
```
*(Runs on `http://localhost:5173`)*

---

## 📜 NPM Scripts Reference

Run these commands from the project root:

| Command | Action |
| :--- | :--- |
| `npm run dev:backend` | Starts the Express REST API backend |
| `npm run dev:frontend` | Starts the Vite React frontend dev server |
| `npm run build:frontend` | Builds the frontend for production |
| `npm run setup:admin` | Hashes and stores admin credentials in `.env` |
| `npm run reset:tenant` | Resets a tenant's password securely |
| `npm run create:tenant` | Provisions a new tenant account via CLI |

---

## 📚 Documentation & Presentations

- Comprehensive Final Documentation: [`docs/TARIPA_Final_Project_Documentation.md`](docs/TARIPA_Final_Project_Documentation.md)
- Defense Presentation Slide Deck: [`docs/presentation/TARIPA_Defense_Presentation.pptx`](docs/presentation/TARIPA_Defense_Presentation.pptx)

---

<div align="center">
  <b>Developed for CC316 (Application Development and Emerging Technologies)</b>
</div>

