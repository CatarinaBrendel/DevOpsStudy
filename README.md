
# 🚀 Server Monitor Dashboard

A sleek, responsive **React + Bootstrap** web application for monitoring server uptime, status, and response metrics — with live history, filtering, and auto-refresh.  

This dashboard gives you **real-time visibility** into all your servers at a glance and keeps you informed with toast notifications for key events.

Live demo: https://service-status-dashboard.onrender.com

---

## ✨ Features

- **📡 Live Monitoring**  
  One-click “Check now” for a single server or Check all
  Add/edit/delete monitored servers (name + URL)
  
- **🔍 Search & Filter**  
  Quickly find servers by name or filter by status (`Up`, `Down`, `Warn`).

- **📜 Server History**  
  Detailed uptime/response history with date & time formatting and a fixed table header for easy scrolling.
   Per-server summary: uptime %, average latency, sparkline

- **🖱 Interactive Sidebar**  
  Sticky sidebar with quick server selection and sparklines showing recent performance trends.
  Global History with filters (time, status, server)

- **📢 Toast Notifications**  
  Instant feedback when servers are **added** or **deleted**.

- **🖌 Clean UI**  
  Built with Bootstrap 5 and responsive layout principles for a professional look.

- **⚖️ Dual Database**
  SQLite for dev/tests, PostgreSQL for production

---

## 🖼 UI Preview

<img width="2940" height="1912" alt="image" src="https://github.com/user-attachments/assets/e01d175a-9fd3-4463-9a67-74877887ea54" />


---

## ⚡ Getting Started

### 1️⃣ Clone the repo
```bash
git clone https://github.com/your-username/server-monitor-dashboard.git
cd server-monitor-dashboard
```

### 2️⃣ Install dependencies
``` bash
npm install
```

### 3️⃣ Run the app
``` bash
npm npm start
```

---

## 🛠 Tech Stack

**Frontend**: React (SPA), Axios, Bootstrap (light classes)
**Backend**: Node.js + Express
**DB**: SQLite (dev/tests) and PostgreSQL (prod) via a tiny adapter
**Hosting**: Render (Web Service + Managed Postgres)
**Tests**: Jest + supertest (API)
**Security**: Helmet (CSP, CORP), CORS (if split frontend/backend)

--

## 🔑 Key Components
`Sidebar` – Server search, filters, and quick selection
`ServerDetails` – Status overview, metrics, history table
`EmptyServerState` – Helpful tips when no server is selected
`Tip` – Reusable component for inline guidance
`Modal` – Add server form

---

## 🏗 Architecture Overview
The app follows a component-driven architecture:
```pgsql
*Backend*
React SPA  ──(fetch /api/*)──► Express
                             ├── servers (CRUD)
                             ├── global-history & per-server history
                             ├── run checks (fetch URL, capture status/latency)
                             └── summary (uptime %, avg response, sparkline)
DB adapter
  ├─ SQLite (dev/tests) file db              ← DB_PATH
  └─ Postgres (Render prod) pooled connection← DATABASE_URL

*Frontend*
App
 ├── Sidebar
 │    ├── Search Input
 │    ├── Status Chips
 │    ├── Server List (Row + Sparkline)
 │    └── Add Server Modal
 │
 ├── Main Area
 │    ├── EmptyServerState (no selection)
 │    └── ServerDetails (selected server)
 │         ├── Summary (status, uptime)
 │         ├── TrendChart (sparkline)
 │         └── History Table (scrollable with fixed header)
 │
 └── Shared Components
      ├── Modal
      ├── Tip
      ├── StatusDot
      ├── RefreshItemButton
      ├── EditItemButton
      └── DeleteItemButton
```

---

## 🌐 Backend API
This dashboard connects to a REST API. Below are the key endpoints:
`GET /api/servers`
Returns the list of all servers
```json
[
  {
    "id": "srv-123",
    "name": "Example Server",
    "url": "https://example.com",
    "status": "up",
    "responseTime": 120,
    "history": [
      { "timestamp": 1733946000000, "status": "up", "responseTime": 118 },
      { "timestamp": 1733946060000, "status": "down", "responseTime": null }
    ]
  }
]
```
---

`POST /api/servers`
Adds a new server to monitor.
Request body:
```json
{
  "serverName": "New API Server",
  "serverUrl": "https://api.example.com"
}
Response:
{ "message": "Server added successfully" }
```
---

`PATCH /api/servers/:id`
Updates server details.
Request body:

```json
{
  "serverName": "Updated Name",
  "serverUrl": "https://updated.example.com"
}
```
---

`DELETE /api/servers/:id`
Deletes a server.

---

`POST /api/check`
Checks the status of a specific server.
Request body:

```json
{ "id": "srv-123" }
```
---

`GET /api/history/:id`
Returns the detailed history for a server.
```json
[
  { "timestamp": 1733946000000, "status": "up", "responseTime": 118 },
  { "timestamp": 1733946060000, "status": "down", "responseTime": null }
]
```

---

## ✍️ **Design notes**
 Design notes (what this project demonstrates)
Dual-dialect DB adapter with identical API (all/get/run/close) so routes don’t care which DB is behind them.
Dialect-aware SQL where needed:
Time formatting (strftime vs to_char(... AT TIME ZONE 'UTC', …))
Reserved identifiers (Postgres "timestamp")
Case-insensitive compares (LOWER(col) = LOWER(?))
Secure defaults (CSP via Helmet, CORP), with practical allowances for SPAs.
Deployment-friendly SPA/Express layout (API first; catch-all last).

---

## 💡 Inspiration
We wanted a professional-grade monitoring UI that’s still simple enough to run locally or adapt for internal use.
From sticky sidebars to smooth auto-refresh, this project shows how small UI details create a polished, reliable dashboard experience.

---

## 📜 License
MIT License — free to use, modify, and share.
