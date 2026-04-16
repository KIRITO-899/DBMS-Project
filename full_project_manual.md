# 🚦 Smart Traffic & Transport Database System
## Complete Project Setup, Architecture & ER Manual

> [!NOTE]
> This document is the definitive master guide for deploying, understanding, and presenting the Database Management System project. It includes all architecture details, the ER Model, a 100% complete setup walkthrough, all API routes, data generation strategies, raw SQL schemas, and the Frontend codebase hierarchy.

---

## 🧠 1. Core DBMS Concepts Demonstrated

This project acts as an academically rigorous demonstration of low-level Database Management System engines, intentionally circumventing ORMs to expose pure computational theory:

1. **3rd Normal Form (3NF) Normalization**: The database mathematically eradicates data redundancy by distributing elements across 7 unified tables via strict surrogate primary keys, eliminating transitive dependencies.
2. **B+ Tree Indexing Algorithms**: Proves I/O search speeds by physically sorting table blocks on disc using:
   - *Single-Column Indexing* (Time optimization)
   - *Composite Indexing* (Multi-predicate filtration)
   - *Covering Indexing* (Placing target strings directly into node schemas to bypass root table lookups entirely).
3. **Query Cost Estimation & IO Engine Tuning**: Extracts native `EXPLAIN` algorithm readouts from MySQL's optimizer, actively tracking differences in Page I/O vs Tuple CPU cost between Unindexed and Indexed data.
4. **View Materialization & Stored Procedures**: We significantly offload computational overhead (like aggregations, `SUM()`, and decimals) away from Node.js, storing Precompiled SQL Views natively so the DB engine does the heavy lifting.
5. **Referential ACID Constraints**: Rigid `ON DELETE CASCADE` and `ON DELETE SET NULL` boundaries guarantee zero orphaned data if a core geographic unit (like a City or State) is dropped from memory.

---

## 📂 2. Full Website Directory Structure

Here is the entire hierarchy of how the Website and Database link together:

```text
DBMS Project/
├── database/                     ← The entire Database Logic Layer
│   ├── connection.js             ← MySQL mysql2/promise connection engine
│   ├── schema.sql                ← 3NF Tables & B+ Indexes
│   ├── procedures.sql            ← Precompiled views
│   ├── fetchLiveTraffic.js       ← TomTom API Data Integration
│   ├── fetchLiveIncidents.js     
│   └── seed.js                   ← Generates 17,500+ records via scripts
├── public/                       ← The Frontend User Interface (Vanilla UI)
│   ├── index.html                ← Single Page App Structure
│   ├── css/                      ← Glassmorphism & Themes
│   └── js/                       ← Logic for hitting APIs and Chart.js
├── routes/                       ← The Backend API Routes
│   ├── traffic.js                ← Vehicles & Flow APIs
│   ├── accidents.js              ← Crash metrics APIs
│   ├── analytics.js              ← Macro dashboard APIs
│   ├── dbms.js                   ← APIs serving B+ Index tests
│   └── system.js                 
├── server.js                     ← The Express.js Master Server
├── package.json                  ← Node dependencies
└── .env                          ← Secure keys (MySQL Password + TomTom)
```

---

## 🏗️ 3. Architecture & ER Model

### Entity-Relationship (ER) Model
The schema uses 1-to-N relationships globally:
1. **Geography Core**: **`states`** (1) ──has──> (N) **`cities`** (1) ──has──> (N) **`roads`**
2. **Traffic & Incidents**: **`roads`** (1) ──has──> (N) **`traffic_readings`** & **`accidents`**
3. **Transport**: **`states`** (1) ──registers──> (N) **`vehicles`** AND **`cities`** (1) ──operates──> (N) **`public_transport`**

---

## 🗃️ 4. Dataset Generation & External APIs

To simulate an authentic environment, we connect to real-world infrastructure APIs.

### Where to get the external API Key:
We use the **TomTom Traffic Flow API** to extract live speeds matching India's physical coordinate grids. 
1. Go to [developer.tomtom.com](https://developer.tomtom.com/).
2. Create a free developer account.
3. Generate a new API Key for **Traffic API Services**.
4. Paste it into your project's `.env` file!

**Endpoint Used**: 
`GET https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?key={API_KEY}&point={lat},{lon}`

---

## 🚀 5. Complete Step-by-Step Setup

1. Open `.env`, set your `DB_PASSWORD` and `TOMTOM_API_KEY`.
2. In VS Code, use your **MySQL Extension** to connect to `localhost`.
3. Open `database/schema.sql` and click **Run / Execute (⚡)**.
4. Open `database/procedures.sql` and run it.
5. In VS Code Terminal, run:
   ```bash
   npm install
   npm run seed     # Takes 2-5 minutes to fetch TomTom API data and build the DB 
   npm run dev      # Starts the backend server
   ```
6. Open **http://localhost:3000** in your browser.

---

## ⚙️ 6. Backend API & Router Hierarchy Guide

If you are expanding the Node.js server, here is specifically how our API structure works:

### A. The Core Connection (`database/connection.js`)
Configures a strict Promise-Based `mysql2` pool linking locally. Exposes a `query()` module to sanitize SQL variables natively against SQL injection.

### B. The Master Pipeline (`server.js`)
Initializes standard parameters `cors()` and sets `express.static('public')` so `.html` files automatically render over `localhost`. Routes are officially clamped here (e.g., `app.use('/api/traffic', require('./routes/traffic'))`).

### C. The Explicit Router Network (`routes/` folder)

- **`routes/accidents.js`** *(Crash Tracking)*
  - `GET /api/accidents/summary` 
  - `GET /api/accidents/hotspots` 
  - `GET /api/accidents/trend` 
  - `GET /api/accidents/live` 

- **`routes/traffic.js`** *(Vehicle Monitoring)*
  - `GET /api/traffic/live` 
  - `GET /api/traffic/congestion/:cityId`
  - `GET /api/traffic/roads/:cityId` 

- **`routes/analytics.js`** *(Macro Data)*
  - `GET /api/analytics/overview`
  - `GET /api/analytics/city-comparison` 
  - `GET /api/analytics/weather-impact` 

- **`routes/dbms.js`** *(Theoretical Academics)*
  - `GET /api/dbms/indexes` 
  - `GET /api/dbms/explain/:queryId`
  - `GET /api/dbms/cost-estimation` 

---

## 🖥️ 7. Full Frontend Layout Architecture (`public/`)

The application avoids heavy frameworks like React by utilizing a high-performance **Vanilla Javascript Single Page Application Engine**, manually manipulating CSS nodes and Chart.js canvases to map our SQL endpoint structures dynamically. 

### 📥 Download the Frontend CodeBase
You can access and immediately download the exact Frontend UI codebase (HTML, CSS, JS) from this Google Drive Repository:
[**Download Smart Traffic Frontend Modules**](https://drive.google.com/drive/folders/19bt2-sclGI7tUVH46eaUZJjSfd-u_6L9?usp=sharing)

### A. The Single Page Structure (`index.html`)
The HTML document establishes the core architecture utilizing a robust scalable grid system. It consists of:
- **A Left-Aligned Navigation Sidebar** driven by dynamic SVG icons.
- **A Global Tooling Header** featuring a programmatic dark/light mode CSS theme toggle logic.
- **Hidden `<section class="page">` Divs**. These containers stack on top of each other invisibly. When a user navigates to "DBMS Concepts" or "Accidents", the Javascript simply toggles the `active` class to unhide that specific container.

### B. Modular Javascript Logic (`public/js/`)
Instead of dumping 3,000 lines of Javascript into a single master file, the logic is highly modularized:
- **`app.js`**: Controls pure DOM mutations (e.g., hiding/showing `<section class="page">`), handles the Dark Mode toggle, and conditionally generates the `loadingOverlay` spinner.
- **`charts.js`**: Contains precisely 14 unified Chart.js configuration engines. It explicitly handles JSON data extraction, converting raw Backend SQL columns directly into Canvas visuals.
- **`dbms.js`**: Operates entirely independently as the strictly academic computation module processing MySQL's `EXPLAIN` algorithms and rendering SVG B-Trees.

---

## 💾 8. Complete Database Schema (`schema.sql`)
```sql
CREATE DATABASE IF NOT EXISTS smart_traffic;
USE smart_traffic;

-- Table 1: Why? 'states' separates state-level logic (registrations) from local city grids
CREATE TABLE states (
    state_id    INT AUTO_INCREMENT PRIMARY KEY,
    state_name  VARCHAR(100) NOT NULL UNIQUE,
    region      ENUM('North','South','East','West','Central','Northeast') NOT NULL
) ENGINE=InnoDB;

-- Table 2: Why? 'cities' prevents duplicating population data every time a road is queried
CREATE TABLE cities (
    city_id     INT AUTO_INCREMENT PRIMARY KEY,
    city_name   VARCHAR(100) NOT NULL,
    state_id    INT NOT NULL,          
    population  INT,
    area_sq_km  DECIMAL(10,2),
    is_metro    BOOLEAN DEFAULT FALSE, 
    FOREIGN KEY (state_id) REFERENCES states(state_id) ON DELETE CASCADE,
    INDEX idx_city_state (state_id)    
) ENGINE=InnoDB;

-- Table 3: Why? 'roads' are the physical anchor for all transient data
CREATE TABLE roads (
    road_id         INT AUTO_INCREMENT PRIMARY KEY,
    road_name       VARCHAR(200) NOT NULL,
    city_id         INT NOT NULL,
    road_type       ENUM('NH','SH','Urban','Arterial','Expressway') NOT NULL,
    length_km       DECIMAL(10,2),
    lanes           INT,
    speed_limit_kmph INT,
    FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE CASCADE,
    INDEX idx_road_city (city_id)
) ENGINE=InnoDB;

-- Table 4: Why? 'traffic_readings' records the millions of sensor pings constantly generated
CREATE TABLE traffic_readings (
    reading_id          INT AUTO_INCREMENT PRIMARY KEY,
    road_id             INT NOT NULL,
    reading_timestamp   DATETIME NOT NULL,
    vehicle_count       INT,
    avg_speed_kmph      DECIMAL(5,2),
    congestion_level    ENUM('Low','Moderate','High','Severe') NOT NULL,
    weather             ENUM('Clear','Rain','Fog','Storm') DEFAULT 'Clear',
    FOREIGN KEY (road_id) REFERENCES roads(road_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table 5: Why? 'accidents' tracks sparse events distinct from daily traffic readings
CREATE TABLE accidents (
    accident_id         INT AUTO_INCREMENT PRIMARY KEY,
    road_id             INT NOT NULL,
    accident_date       DATE NOT NULL,
    time_of_day         ENUM('Morning','Afternoon','Evening','Night') NOT NULL,
    severity            ENUM('Minor','Major','Fatal') NOT NULL,
    vehicles_involved   INT DEFAULT 1,
    casualties          INT DEFAULT 0,
    cause               VARCHAR(200),
    description         TEXT,
    FOREIGN KEY (road_id) REFERENCES roads(road_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table 6: Why? 'vehicles' act as a global ledger attached to States
CREATE TABLE vehicles (
    vehicle_id          INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_type        ENUM('Car','Bus','Truck','Two-Wheeler','Auto','Taxi','Emergency') NOT NULL,
    registration_state  INT,
    registration_year   INT,
    FOREIGN KEY (registration_state) REFERENCES states(state_id) ON DELETE SET NULL 
) ENGINE=InnoDB;

-- Table 7: Why? 'public_transport' serves specialized macro-city statistics
CREATE TABLE public_transport (
    route_id            INT AUTO_INCREMENT PRIMARY KEY,
    route_name          VARCHAR(200) NOT NULL,
    city_id             INT NOT NULL,
    transport_type      ENUM('Bus','Metro','Tram','Ferry') NOT NULL,
    stops               INT,
    daily_ridership     INT,
    frequency_mins      INT,
    FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Multi-Level Indexes (B+ Tree — InnoDB default)
-- ============================================================

-- Level 1: Why? Searching massive scale records by date requires sorting
CREATE INDEX idx_traffic_timestamp ON traffic_readings (reading_timestamp);

-- Level 2: Why? Combining predicates allows MySQL to skip dual-filtering
CREATE INDEX idx_traffic_road_congestion ON traffic_readings (road_id, congestion_level);

-- Level 3: Why? Puts raw data into index-nodes directly so Table scans are bypassed entirely
CREATE INDEX idx_traffic_covering ON traffic_readings (road_id, reading_timestamp, avg_speed_kmph, vehicle_count);
```

---

## 📊 9. Stored Procedures & Views (`procedures.sql`)

To offload massive calculations from the backend server to the MySQL DB Engine instead, we use these permanent precompiled MySQL `VIEWS`. 

```sql
USE smart_traffic;

-- ============================================================
-- VIEW 1: City Traffic Summary
-- WHY? When the frontend Dashboard boots, it needs to grab hundreds of thousands of rows of speed and congestion.
-- If the Express API processed this natively using JS loops, the memory would crash. 
-- So we use a View to perform the heavy algorithm instantly at the hardware Disk-level!
-- ============================================================
DROP VIEW IF EXISTS v_city_traffic_summary;

CREATE VIEW v_city_traffic_summary AS
SELECT
    c.city_id,
    c.city_name,
    s.state_name,
    c.population,
    c.is_metro,
    COUNT(tr.reading_id)                            AS total_readings,
    ROUND(AVG(tr.vehicle_count), 0)                 AS avg_vehicle_count,
    ROUND(AVG(tr.avg_speed_kmph), 2)                AS avg_speed,
    
    -- WHY? We use CASE WHEN statements here to instantaneously pivot rows into columns (e.g. converting the 'Severe' string row into a readable integer column)
    SUM(CASE WHEN tr.congestion_level = 'Severe' THEN 1 ELSE 0 END) AS severe_count,
    SUM(CASE WHEN tr.congestion_level = 'High'   THEN 1 ELSE 0 END) AS high_count,
    
    -- WHY? 'NULLIF' is explicitly used here to prevent fatal 'Divide by Zero' Database crashes if a city currently possesses zero live sensors.
    ROUND(
        SUM(CASE WHEN tr.congestion_level IN ('High','Severe') THEN 1 ELSE 0 END)
        / NULLIF(COUNT(tr.reading_id), 0) * 100, 2
    ) AS congestion_pct
FROM cities c
JOIN states s ON c.state_id = s.state_id
LEFT JOIN roads r ON r.city_id = c.city_id
LEFT JOIN traffic_readings tr ON tr.road_id = r.road_id
GROUP BY c.city_id, c.city_name, s.state_name, c.population, c.is_metro;


-- ============================================================
-- VIEW 2: Accident Statistics by State & Severity
-- WHY? By mapping out accident casualties vs geometries beforehand, the frontend Chart.js library doesn't have to experience latency sorting arrays.
-- ============================================================
DROP VIEW IF EXISTS v_accident_statistics;

CREATE VIEW v_accident_statistics AS
SELECT
    s.state_id,
    s.state_name,
    s.region,
    COUNT(a.accident_id)                                AS total_accidents,
    SUM(CASE WHEN a.severity = 'Fatal' THEN 1 ELSE 0 END)  AS fatal_count,
    SUM(CASE WHEN a.severity = 'Major' THEN 1 ELSE 0 END)  AS major_count,
    SUM(CASE WHEN a.severity = 'Minor' THEN 1 ELSE 0 END)  AS minor_count,
    SUM(a.casualties)                                   AS total_casualties,
    SUM(a.vehicles_involved)                            AS total_vehicles_involved
FROM states s
LEFT JOIN cities c   ON c.state_id = s.state_id
LEFT JOIN roads r    ON r.city_id  = c.city_id
LEFT JOIN accidents a ON a.road_id = r.road_id
GROUP BY s.state_id, s.state_name, s.region;


-- ============================================================
-- VIEW 3: Road Congestion Ranking
-- WHY? This view inherently maps Congestion Strings to numerical percentage averages without duplicating data streams across the API.
-- ============================================================
DROP VIEW IF EXISTS v_road_congestion_ranking;

CREATE VIEW v_road_congestion_ranking AS
SELECT
    r.road_id,
    r.road_name,
    r.road_type,
    c.city_name,
    s.state_name,
    COUNT(tr.reading_id) AS total_readings,
    ROUND(AVG(tr.avg_speed_kmph), 2) AS avg_speed,
    ROUND(
        SUM(CASE WHEN tr.congestion_level IN ('High','Severe') THEN 1 ELSE 0 END)
        / NULLIF(COUNT(tr.reading_id), 0) * 100, 2
    ) AS congestion_pct,
    ROUND(AVG(tr.vehicle_count), 0) AS avg_vehicle_count
FROM roads r
JOIN cities c ON r.city_id = c.city_id
JOIN states s ON c.state_id = s.state_id
LEFT JOIN traffic_readings tr ON tr.road_id = r.road_id
GROUP BY r.road_id, r.road_name, r.road_type, c.city_name, s.state_name;
```

---

## 📡 10. How It Works (Step-by-Step Data Flow)

Here is the simple data lifecycle, illustrating exactly how data travels from your browser to the DB and back:

**1. 🖥️ The Browser (Frontend)**
- The user opens `http://localhost:3000`.
- The Javascript (`charts.js`) asks the server for data using the native `fetch()` command.

**2. ⚙️ The Server (Backend)**
- `server.js` receives the incoming request.
- It directs the request to the correct API file (like `routes/traffic.js`).
- The API securely transforms the request into a raw SQL Query payload.

**3. 🗄️ The Database (MySQL)**
- MySQL receives the query from the backend.
- It calculates the math—specifically skipping full table scans by instantly using **B+ Tree Indexes** or **Pre-made Views**.
- It hands the requested calculation back to you.

**4. 📊 The Result (UI Rendering)**
- The Node.js server sends the raw data array back to the User's browser.
- `Chart.js` reads this data and instantly draws the beautiful analytical graphs on the screen!
