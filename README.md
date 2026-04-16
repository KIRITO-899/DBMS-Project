# 🚦 Smart Traffic & Transport Database System

![Project Status](https://img.shields.io/badge/Status-Complete-success)
![Database](https://img.shields.io/badge/Database-MySQL-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green)
![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS-yellow)

A comprehensive, full-stack Academic Database Management System designed for smart city infrastructure. It monitors real-time traffic, logs accidents, and manages public transport across India.

The primary purpose of this project is to provide a robust demonstration of **Advanced DBMS Concepts**, intentionally circumventing ORMs to expose pure computational theory, including interactive visualizers for **Multi-Level Indexing**, **Query Cost Estimation**, and **Precompiled Views**.

---

## 🧠 Core DBMS Concepts Demonstrated

This project is built to clearly output its own mathematical and theoretical proofs:

1. **3rd Normal Form (3NF) Normalization**: The database mathematically eradicates data redundancy by distributing elements across 7 unified tables via strict surrogate primary keys, eliminating transitive dependencies.
2. **B+ Tree Indexing Algorithms**: Proves I/O search speeds by physically sorting table blocks on disc using:
   - *Single-Column Indexing* (Time optimization)
   - *Composite Indexing* (Multi-predicate filtration)
   - *Covering Indexing* (Placing target strings directly into node schemas to bypass root table lookups).
3. **Query Cost Estimation & IO Engine Tuning**: Extracts native `EXPLAIN` algorithm readouts from MySQL's optimizer, actively tracking differences in Page I/O vs Tuple CPU cost between Unindexed and Indexed data.
4. **View Materialization & Stored Procedures**: Significantly offloads computational overhead (aggregations, `SUM()`) away from Node.js, storing Precompiled SQL Views natively so the DB engine does the heavy lifting.
5. **Referential ACID Constraints**: Rigid `ON DELETE CASCADE` and `ON DELETE SET NULL` boundaries guarantee zero orphaned data.

---

## 🌟 Key Features

- **Dynamic Interactive Dashboard**: Premium dark-mode UI with glassmorphism, micro-animations, and Chart.js visuals for traffic congestion, weather impacts, and transport insights.
- **Accident Analytics Engine**: Track high-risk locations, analyze severity metrics, and visualize historical accident trends.
- **DBMS Concept Visualizer**: 
  - Explores B+ tree structures directly inside the UI.
  - Interactively breaks down Selectivity and Costs natively tracking `WITH` indexing versus `WITHOUT` (`IGNORE INDEX`).
  - Highlights raw optimizer execution plans.
- **Robust Real-World Data & Seeding**: Pre-seeded with over **17,500+ records** mimicking real-world Indian traffic metrics spanning 36 states and 50 major cities using data from the TomTom Traffic API.

---

## 🏗️ Architecture & ER Model

The schema uses 1-to-N relationships globally to construct the state and local grids:
1. **Geography Core**: `states` (1) ──has──> (N) `cities` (1) ──has──> (N) `roads`
2. **Traffic & Incidents**: `roads` (1) ──has──> (N) `traffic_readings` & `accidents`
3. **Transport**: `states` (1) ──registers──> (N) `vehicles` AND `cities` (1) ──operates──> (N) `public_transport`

### Technology Stack
- **Database**: MySQL 8+ (InnoDB Engine)
- **Backend**: Node.js, Express.js, mysql2 (Promise-based)
- **Frontend**: HTML5, Vanilla JS, CSS3 Design System (Single Page App Engine)
- **APIs**: TomTom Traffic Flow API
- **Charting**: Chart.js 4.4.0

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL Server (running locally)
- A TomTom Developer API Key (Free)

### 1. External API Key Setup (TomTom)
To simulate an authentic environment, we connect to real-world infrastructure APIs.
1. Go to [developer.tomtom.com](https://developer.tomtom.com/).
2. Create a free developer account.
3. Generate a new API Key for **Traffic API Services**.

### 2. Installation
Clone the repository and install system dependencies:
```bash
git clone <your-repo-url>
cd "DBMS Project"
npm install
```

### 3. Configure Database Environment
Create a `.env` file in the root directory to securely manage credentials:
```env
DB_PASSWORD=your_mysql_password_here
TOMTOM_API_KEY=your_tomtom_api_key_here
```

### 4. Database Schema Setup
Initialize the database logically in MySQL:
1. Open your MySQL client or VS Code MySQL Extension connected to `localhost`.
2. Execute the schema file: `database/schema.sql` (builds tables and B+ indexes).
3. Execute the views file: `database/procedures.sql` (builds precompiled aggregations).

### 5. Generate Data Seed
Run the master initialization script. This interacts with the TomTom API to extract raw data and forcefully injects it heavily into the local MySQL tables (over 17,500+ realistic records). 
```bash
npm run seed
```
> *Note: Seeding avoids TomTom rate-limiting by fetching the data once and storing it permanently in your own database to prove B+ tree indexing locally.*

### 6. Start the Application
Spin up the Node.js/Express backend server:
```bash
npm run dev
```
Navigate your web browser to: **[http://localhost:3000](http://localhost:3000)**

---

## 📡 Data Lifecycle Flow

Here is exactly how data travels between the architectures:

**1. The Browser (Frontend)**
- User navigates through the SPA; JavaScript (`charts.js`) requests data via `fetch()`.

**2. The Server (Backend)**
- `server.js` catches the API route (e.g., `/api/traffic/live`) and sanitizes the SQL payload.

**3. The Database Engine (MySQL)**
- Instead of using slow table scans, the request leverages:
  - **B+ Tree Indexes**: Like a book's glossary, jumping straight to the physical row location for specific lookups.
  - **Pre-compiled Views**: Like a sticky note with the math already solved, returning massive dashboard aggregations instantly without recalculating.

**4. The Result (UI Rendering)**
- MySQL hands the optimized arrays to Node, which serves the JSON back to the browser for Chart.js rendering dynamically.

---

## 📂 Web Directory Structure

```text
DBMS Project/
├── database/                     ← Database Logic Layer (Schema, Views, Seeds)
├── public/                       ← Frontend User Interface (Vanilla UI)
│   ├── index.html                ← Single Page App Structure
│   ├── css/styles.css            ← Theme Configuration & Glassmorphism
│   └── js/                       ← Modular DOM & Chart.js logic
├── routes/                       ← Backend API Routes (Traffic, Accidents, Analytics)
├── server.js                     ← Express.js Master Server
├── package.json                  
└── .env                          ← Secure keys
```

---

*Designed and Developed for Smart City Academic Demonstration.*
