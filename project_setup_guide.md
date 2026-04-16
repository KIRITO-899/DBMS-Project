# 🚦 Smart Traffic & Transport Database System
## Complete Setup Guide for Students

---

## 🧰 Prerequisites — Install These First

Before anything else, make sure the following software is installed on your system:

| Tool | Purpose | Download Link |
|------|---------|--------------|
| **Node.js** (v18+) | Runs the backend server | https://nodejs.org |
| **MySQL** (v8+) | The database engine | https://dev.mysql.com/downloads/installer/ |
| **MySQL Workbench** | GUI to manage your database | Comes with MySQL Installer |
| **VS Code** | Code editor | https://code.visualstudio.com |

> [!TIP]
> During MySQL installation, set your **root password**. Remember it — you'll need it later.

---

## 📁 Step 1 — Get the Project Files

Copy the project folder to your machine. The folder structure should look like this:

```
DBMS Project/
├── database/
│   ├── connection.js       ← MySQL connection config
│   ├── schema.sql          ← Creates all 7 tables
│   ├── seed.js             ← Populates the database with data
│   ├── procedures.sql      ← Stored procedures
│   ├── fetchLiveTraffic.js
│   └── fetchLiveIncidents.js
├── public/
│   ├── index.html          ← The entire frontend UI
│   ├── css/
│   └── js/
├── routes/
│   ├── traffic.js          ← API routes for traffic
│   ├── accidents.js        ← API routes for accidents
│   ├── analytics.js        ← API routes for analytics
│   ├── dbms.js             ← API routes for DBMS concepts
│   └── system.js           ← System health route
├── server.js               ← Main Express server
├── package.json            ← Node.js dependencies
└── .env                    ← Your secret credentials
```

---

## 🔐 Step 2 — Configure the `.env` File

Open the `.env` file in the root of the project. It should look like this:

```env
DB_PASSWORD=YourMySQLPasswordHere
TOMTOM_API_KEY=w1QK5dnY4YZr9M17Hwk1h2dmKiab1ZJM
```

> [!IMPORTANT]
> Replace `YourMySQLPasswordHere` with the **actual MySQL root password** you set during MySQL installation.
> The `TOMTOM_API_KEY` is already provided — don't change it.

---

## 🗄️ Step 3 — Set Up the Database

### 3a. Open MySQL Workbench
1. Launch **MySQL Workbench**
2. Connect to `localhost` using your **root** username and password

### 3b. Run the Schema
1. Go to **File → Open SQL Script**
2. Navigate to `database/schema.sql` and open it
3. Click the ⚡ **Execute** button (or press `Ctrl + Shift + Enter`)
4. You should see the `smart_traffic` database and **7 tables** created

### 3c. Run the Stored Procedures
1. Open `database/procedures.sql` the same way
2. Click **Execute**
3. This creates helper stored procedures used by the DBMS concepts page

> [!NOTE]
> You should now see the `smart_traffic` database in the left sidebar of MySQL Workbench with these tables:
> `states`, `cities`, `roads`, `traffic_readings`, `accidents`, `vehicles`, `public_transport`

---

## 📦 Step 4 — Install Node.js Dependencies

Open a **terminal** (PowerShell or Command Prompt) inside the project folder:

```powershell
# Navigate to the project folder
cd "e:\experiments\Project\DBMS Project"

# Install all required packages
npm install
```

This will install:
- `express` — web server framework
- `mysql2` — MySQL database driver
- `dotenv` — loads the `.env` file
- `cors` — allows frontend to talk to backend
- `axios` — used for fetching live traffic data

---

## 🌱 Step 5 — Seed the Database (Add Sample Data)

Now populate the database with realistic Indian traffic data:

```powershell
npm run seed
```

> [!IMPORTANT]
> This step takes **2–5 minutes** to complete. It inserts **11,000+ rows** of traffic readings, accident records, vehicles, and transport routes. Wait for the "Seeding complete!" message before proceeding.

---

## 🚀 Step 6 — Start the Server

```powershell
npm run dev
```

You should see output like:
```
🚦 Smart Traffic & Transport DBMS Server running on port 3000
✅ Database connection established
```

---

## 🌐 Step 7 — Open the Application

Open your browser and go to:

```
http://localhost:3000
```

You should see the **Smart Traffic & Transport Database System** dashboard with:
- 📊 Live KPI summary cards (total vehicles, accidents, etc.)
- 🗺️ Traffic monitor for major Indian cities
- 📈 Analytics charts and graphs
- 🔬 DBMS concepts page (indexes, query cost, stored procedures)

---

## 🔄 Daily Usage (After First Setup)

Every time you want to work on the project, just do this:

```powershell
# 1. Make sure MySQL is running (it usually auto-starts on Windows)

# 2. Navigate to the project folder
cd "e:\experiments\Project\DBMS Project"

# 3. Start the server
npm run dev

# 4. Open browser
# Go to: http://localhost:3000
```

---

## 📋 Quick Reference — All Commands

| Command | What it does |
|---------|-------------|
| `npm install` | Install Node packages (run once) |
| `npm run seed` | Populate database with data (run once) |
| `npm run dev` | Start the development server |
| `npm start` | Same as `npm run dev` |

---

## ❗ Common Issues & Fixes

### ❌ "Access denied for user 'root'"
**Fix:** Your `.env` file has the wrong password. Update `DB_PASSWORD` with your correct MySQL root password.

### ❌ "Cannot connect to database"
**Fix:** MySQL service is not running.
- Press `Win + R`, type `services.msc`
- Find **MySQL80** and click **Start**

### ❌ "Port 3000 already in use"
**Fix:** Another process is using that port.
```powershell
# Find and kill the process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### ❌ "npm is not recognized"
**Fix:** Node.js is not installed or not in PATH. Reinstall Node.js from https://nodejs.org and restart your terminal.

### ❌ Seed fails midway
**Fix:** Re-run the schema first (Step 3b) to reset all tables, then seed again:
```powershell
npm run seed
```

---

## 🏗️ Project Architecture & Deep Dive (For Understanding)

```text
Browser (index.html)
        ↕  HTTP requests (fetch API)
Express Server (server.js : port 3000)
        ↕  SQL queries
MySQL Database (smart_traffic)
```

### 🗃️ Database Schema & Indexes

The database (`smart_traffic`) uses 7 normalized tables (3NF) to store data efficiently:

1. **`states`**: Stores Indian States & Union Territories.
2. **`cities`**: Major Indian Cities linked to states via `state_id`.
3. **`roads`**: Roads and Highways linked to cities via `city_id`.
4. **`traffic_readings`**: Traffic Sensor Data containing vehicle counts, speed, congestion levels, and weather on different roads.
5. **`accidents`**: Road Accident Records indicating severity, date, and casualties on different roads.
6. **`vehicles`**: Registered Vehicles categorized by type across states.
7. **`public_transport`**: Public Transit Routes for various cities.

**Indexes (B+ Tree)**
To optimize data retrieval, we utilize multi-level indexing:
- **Level 1 (Single-column)**: High-selectivity queries (e.g., `idx_traffic_timestamp`, `idx_accident_date`).
- **Level 2 (Composite)**: Multi-predicate queries (e.g., `idx_traffic_road_congestion`, `idx_traffic_road_timestamp`).
- **Level 3 (Covering)**: Include all queried columns to avoid table lookups (e.g., `idx_traffic_covering`).

### 🖥️ Frontend (HTML, CSS, JS)

The entire frontend UI is contained in the `public/` folder.
- **`index.html`**: The single-page application structure. Contains dashboard grids, tables, and canvases for Chart.js.
- **CSS (`public/css/`)**: Uses custom styling paired with CSS variables for dynamic content like dark mode and data-driven coloring.
- **JS (`public/js/`)**: Controls dynamic data updating. Fetches data from the backend using standard browser `fetch()` APIs and renders it via the DOM and GSAP animations.
- **Libraries used**: GSAP for smooth animations, Chart.js for visualizations.

### ⚙️ Backend Instructions (Node.js/Express)

For the backend, here is an structural overview of what must be implemented:

1. **Server Setup (`server.js`)**: Initialize an Express application. Configure `cors` and `dotenv`, set up JSON parsing, and listen on port 3000.
2. **Database Connection (`database/connection.js`)**: Initialize a `mysql2/promise` pool connection exporting standard query methods. Connect using `.env` credentials.
3. **API Routes (`routes/` directory)**: Implement modularized Express routers to separate concerns:
   - `traffic.js`: Handle fetching current and historical traffic readings.
   - `accidents.js`: Fetch accident reports and stats.
   - `analytics.js`: Aggregate data queries (e.g., averages, counts by city/state) used primarily for charts.
   - `dbms.js`: Specialized endpoints to demonstrate B+ Tree indexes and query performance comparisons.

---

> [!TIP]
> If you're presenting this project, make sure to demonstrate the **DBMS Concepts** page — it showcases B+ Tree indexes, query cost estimation, stored procedures, and normalization, which are the core academic concepts of the project.
