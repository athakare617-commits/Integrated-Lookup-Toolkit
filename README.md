# Integrated Lookup Toolkit
> **Multiple Lookups. One Toolkit.**
> *Unified Cybersecurity Platform — Defensive Reconnaissance & Network Diagnostics*

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Defensive%20Security-teal.svg)](#)

---

## 📌 Project Overview

**Integrated Lookup Toolkit** is a consolidated cybersecurity and networking investigation application that unites multiple lookup tools into a single, cohesive workflow. Rather than requiring analysts and students to consult disjointed web services or execute disparate terminal utilities, this toolkit provides a centralized dashboard and instant multi-target investigation engine.

Built as a unified cybersecurity platform, the application reinforces core networking fundamentals, DNS record hierarchies, email deliverability protocols, IP routing classification, and ethical defensive reconnaissance.

---

## ✨ Key Modules & Capabilities

| Module | Core Functionality | Underlying Technology |
| :--- | :--- | :--- |
| **Integrated Lookup** | Universal multi-target search with automatic input pattern detection (IP, domain, email, name, hash). | Regex & Validator parser, Unified Service Router |
| **Threat Scanner** | Real-time cyber threat & malware analysis for domains, IPs, URLs, and file hashes (MD5, SHA-1, SHA-256) across 70+ security vendors. | VirusTotal API v3 Client |
| **DNS Lookup** | Resolves `A`, `AAAA`, `MX`, `NS`, `TXT`, and `PTR` records with contextual technical explanations. | Native Node.js `dns.promises` API |
| **IP Lookup** | Analyzes IPv4/IPv6, determines network classification (RFC 1918 Private, APIPA, Loopback, Public Routable), resolves reverse PTR hostnames, and queries live public registry geolocation/ASN. | Node.js `dns`, IP validator, Public Registry API |
| **Reverse DNS** | Dedicated PTR record query to map IP addresses back to canonical domain hostnames. | Native DNS reverse PTR resolver |
| **Email Lookup** | Verifies RFC 5322 syntax, extracts domain, verifies MX routing availability, and inspects SPF security policies. | Node.js DNS resolver & RFC email parser |
| **WHOIS Lookup** | Retrieves registrar, creation date, updated date, expiration date, nameservers, and domain status. | RDAP (RFC 7482/9082) & RFC 3912 TCP Sockets |
| **Name Lookup** | Safe name sanitization and title-case normalization with educational privacy & defensive OSINT boundaries. | String sanitization & normalization |
| **Lookup History** | Chronological query logging, query-value search, module filtering, detailed forensic findings, and record deletion. | Supabase PostgreSQL table with memory fallback |
| **Dashboard** | Real-time investigation statistics, health status monitor, quick launchpad, and recent lookup stream. | Aggregated stats engine & reactive state |

---

## 🏛 Architecture & Tech Stack

```
[ Frontend: React 18 + Vite ] (Port 5173)
         │
         ▼ (Vite Proxy: /api -> http://localhost:5000)
[ Backend: Node.js + Express REST API ] (Port 5000)
    ├── Rate Limiting Middleware
    ├── Centralized Error & Request Logging
    ├── Native DNS Resolver (dns.promises)
    ├── RFC 3912 TCP WHOIS & RDAP Engine
    ├── Public Registry ASN & Geo Client
    └── Supabase Database Client (with In-Memory Fallback)
         │
         ▼
[ Database: Supabase PostgreSQL ] (`lookup_history` table)
```

- **Frontend**:
  - **React 18** with Functional Components and Custom Hooks
  - **React Router 6** for seamless client-side page navigation
  - **Vanilla CSS Design System** featuring high-contrast dark mode, cyan/emerald cybersecurity accents, glassmorphism, and responsive breakpoints
  - **Lucide React** for lightweight cybersecurity and networking iconography
- **Backend**:
  - **Node.js 18+ (ES Modules)**
  - **Express.js 4** REST API
  - **Native Node.js DNS & Net Sockets** (Zero external shell executions for strict command injection prevention)
  - **Express Rate Limiting** to prevent brute-force API saturation
  - **Dotenv** for secure environment configuration
- **Database**:
  - **Supabase PostgreSQL** cloud table (`lookup_history`) with RLS policies and descending timestamp indexing
  - **Automatic In-Memory Fallback Store**: Ensures 100% functionality even when offline or before Supabase credentials are provided.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

---

### Quick Start (Run Both Frontend & Backend at Once)

From the project root folder:
```bash
# Install root orchestration tools
npm install

# Start both Backend (Port 5000) and Frontend (Port 5173) simultaneously
npm run dev
```

---

### Manual / Separate Setup (Optional)

#### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   - Copy `.env.example` to `.env`:
     ```bash
     copy .env.example .env
     ```
   - *Optional:* To enable cloud database persistence, create a project at [Supabase](https://supabase.com), copy your project URL and Service Role Key, and update:
     ```env
     PORT=5000
     CLIENT_ORIGIN=http://localhost:5173
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
     ```
   *(If left empty, the server automatically operates in high-performance local memory fallback mode).*

4. Run database migrations (if using Supabase):
   - Open your Supabase SQL Editor and execute the contents of [`backend/schema.sql`](file:///backend/schema.sql).

5. Start the backend server:
   ```bash
   npm run dev
   ```
   *The API will start at [http://localhost:5000](http://localhost:5000).*

4. Database Setup & Autopush CLI:
   - Check connection status & diagnostics:
     ```bash
     npm run db:check
     ```
   - Push database schema (`schema.sql`) and seed data (`seed.sql`):
     ```bash
     npm run db:push
     ```
   - Force re-seeding with sample lookup records & demo analyst:
     ```bash
     npm run db:seed
     ```
   - Full setup & verification:
     ```bash
     npm run db:setup
     ```
   *(On server startup with `npm run dev`, schema and seed autopush executes automatically).*

---

#### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   *The web application will launch at [http://localhost:5173](http://localhost:5173).*

---

## 🚀 Deployment (Vercel)

This project is ready for one-click unified deployment on Vercel (Frontend SPA + Express Serverless API).
Refer to [**DEPLOYMENT_VERCEL.md**](file:///c:/Users/Technohacks%20PC%20%2007/Desktop/integrated%20lookup%20toolkit%201/DEPLOYMENT_VERCEL.md) for full instructions and environment variables.

---

## 📡 REST API Reference

| Endpoint | Method | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | — | System health, uptime, and database connection state |
| `/api/stats` | `GET` | — | Aggregated lookup statistics for dashboard metrics |
| `/api/integrated-lookup` | `POST` | `{ "query": string, "type": "auto" }` | Unified multi-target search with automatic detection |
| `/api/dns` | `GET` | `?domain=example.com` | Resolves A, AAAA, MX, NS, TXT, and PTR records |
| `/api/ip` | `GET` | `?ip=8.8.8.8` | IP classification, reverse PTR, and public registry ASN/Geo |
| `/api/reverse-dns` | `GET` | `?ip=8.8.8.8` | Dedicated PTR reverse DNS lookup |
| `/api/email` | `GET` | `?email=user@domain.com` | Email RFC syntax check, domain IP check, and MX routing |
| `/api/whois` | `GET` | `?domain=example.com` | RDAP & RFC 3912 TCP socket WHOIS registration query |
| `/api/name` | `GET` | `?name=John%20Smith` | Safe name sanitization and title-case normalization |
| `/api/history` | `GET` | `?search=&type=&limit=50` | Retrieve logged lookup records |
| `/api/history/:id` | `DELETE` | `id` in path | Delete a specific lookup history record |
| `/api/history` | `DELETE` | — | Clear all lookup history records |

---

## 🛡 Ethical Cybersecurity Standard

In strict accordance with defensive cybersecurity practices and standards:
- **Zero-Exploitation Policy**: This toolkit does not implement offensive attack utilities, exploit payloads, credential harvesting, network flooding, or unauthorized access tools.
- **Privacy Preservation**: The Name and Email modules perform technical formatting and public DNS verification; they do not harvest personal identifying information (PII) or access private mailboxes.
- **Data Integrity**: Geolocation information is sourced solely from public regional registries; no synthetic or fabricated location data is generated.
- **Defensive Networking Focus**: Designed around RFC standards (RFC 1035 for DNS, RFC 1918 for Private IPs, RFC 3912 for WHOIS, RFC 5322 for Email, and RFC 7482 for RDAP).

---

## 📄 License & Attribution

Designed as an authorized defensive network intelligence utility.
All lookups utilize public DNS standards and authorized registry protocols.
