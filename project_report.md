# Smart Traffic & Transport Database System
## Project Report

---

> **Course:** Database Management Systems  
> **Project Type:** Full-Stack Academic DBMS Application  
> **Technology Stack:** Node.js · Express.js · MySQL 8+ · Vanilla JS SPA · Chart.js · GSAP  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Objectives](#2-objectives)
3. [System Architecture](#3-system-architecture)
4. [Database Design](#4-database-design)
5. [Backend Design](#5-backend-design)
6. [Frontend Design](#6-frontend-design)
7. [DBMS Concepts Demonstrated](#7-dbms-concepts-demonstrated)
8. [Features Implemented](#8-features-implemented)
9. [API Reference](#9-api-reference)
10. [Data Seeding & Live Integration](#10-data-seeding--live-integration)
11. [Conclusion](#11-conclusion)

---

## 1. Introduction

The **Smart Traffic & Transport Database System** is a full-stack web application built to monitor real-time traffic flow across **50 major Indian cities**. It visualizes congestion patterns, weather impact on traffic, and serves as a hands-on demonstration of core DBMS concepts — including **B+ Tree Indexing**, **Query Cost Estimation**, and **Precompiled SQL Views**.

The system integrates the **TomTom Traffic Flow API** to fetch live speed data for 8 major metro cities and uses it as a baseline to generate historically realistic traffic readings. The application is designed as a **Single Page Application (SPA)** with three distinct pages: Dashboard, Traffic Monitor, and DBMS Concepts.

---

## 2. Objectives

- Design a **normalized relational database** (3NF) for smart city traffic infrastructure
- Implement **multi-level B+ Tree indexing** and demonstrate its impact on query performance
- Build a **query cost estimation engine** that compares indexed vs non-indexed query execution
- Create an interactive **data visualization dashboard** with real-time charts and KPI cards
- Integrate **live traffic data** from the TomTom Traffic Flow API
- Demonstrate **stored procedures**, **SQL views**, and **referential integrity** constraints

---

## 3. System Architecture

### 3.1 Three-Tier Architecture

The application follows a classic three-tier architecture:

![System Architecture Diagram](https://drive.google.com/uc?export=view&id=1aPoMz6_nL2uzH-sjgYE_YvRY5hpuDcdv)

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Presentation** | HTML5, Vanilla JS, CSS3, Chart.js 4.4, GSAP 3.12 | SPA rendering, charting, animations |
| **Application** | Node.js, Express.js 4.18 | REST API, middleware, background polling |
| **Data** | MySQL 8+ (InnoDB) | Storage, indexing, views, stored procedures |

### 3.2 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Database Engine | MySQL (InnoDB) | 8+ |
| Backend Runtime | Node.js | v16+ |
| Web Framework | Express.js | 4.18.2 |
| DB Driver | mysql2/promise | 3.6.5 |
| HTTP Client | Axios | 1.15.0 |
| Charting Library | Chart.js | 4.4.0 |
| Animation Engine | GSAP | 3.12.5 |
| Live Data Source | TomTom Traffic Flow API | v4 |
| Fonts | Inter, JetBrains Mono | Google Fonts |

### 3.3 Project Structure

```
DBMS-Project_2/
├── database/
│   ├── schema.sql              ← 5 tables + 4 B+ tree indexes
│   ├── procedures.sql          ← 2 precompiled SQL views
│   ├── seed.js                 ← Master seeder (schema + data + views + procedures)
│   ├── connection.js           ← MySQL pool with IGNORE INDEX middleware
│   └── fetchLiveTraffic.js     ← TomTom API client (8 city coordinates)
├── routes/
│   ├── traffic.js              ← 8 traffic monitoring endpoints
│   ├── analytics.js            ← 4 dashboard analytics endpoints
│   └── dbms.js                 ← 3 DBMS concept endpoints
├── public/
│   ├── index.html              ← SPA shell (3 pages)
│   ├── css/styles.css          ← Full design system (dark/light, glassmorphism)
│   ├── js/app.js               ← SPA router, KPI rendering, theme, animations
│   ├── js/charts.js            ← All Chart.js chart renders (9 chart functions)
│   └── js/dbms.js              ← Index visualization, B+ tree SVG, cost estimation
├── server.js                   ← Express server, middleware, background polling
├── package.json
├── .env                        ← DB_PASSWORD, TOMTOM_API_KEY
└── ER_model.png                ← Exported ER diagram
```

---

## 4. Database Design

### 4.1 ER Diagram

![ER Diagram — Entity Relationship Model](https://drive.google.com/uc?export=view&id=1LFgJEnVoIiNnD-19go9mIp8uJpl61k7G)

### 4.2 Schema Design (3NF Normalization)

The database is structured into **5 normalized tables** linked through surrogate primary keys and foreign key constraints. All transitive dependencies are eliminated — `state_name` is never stored alongside city data; it is always resolved through a `state_id` join.

#### Table: `states`
| Column | Type | Constraints |
|--------|------|-------------|
| `state_id` | INT AUTO_INCREMENT | PRIMARY KEY |
| `state_name` | VARCHAR(100) | NOT NULL, UNIQUE |
| `region` | ENUM('North','South','East','West','Central','Northeast') | NOT NULL |

#### Table: `cities`
| Column | Type | Constraints |
|--------|------|-------------|
| `city_id` | INT AUTO_INCREMENT | PRIMARY KEY |
| `city_name` | VARCHAR(100) | NOT NULL |
| `state_id` | INT | FK → states(state_id) ON DELETE CASCADE |
| `population` | INT | — |
| `area_sq_km` | DECIMAL(10,2) | — |
| `is_metro` | BOOLEAN | DEFAULT FALSE |

#### Table: `roads`
| Column | Type | Constraints |
|--------|------|-------------|
| `road_id` | INT AUTO_INCREMENT | PRIMARY KEY |
| `road_name` | VARCHAR(200) | NOT NULL |
| `city_id` | INT | FK → cities(city_id) ON DELETE CASCADE |
| `road_type` | ENUM('NH','SH','Urban','Arterial','Expressway') | NOT NULL |
| `length_km` | DECIMAL(10,2) | — |
| `lanes` | INT | — |
| `speed_limit_kmph` | INT | — |

#### Table: `traffic_readings`
| Column | Type | Constraints |
|--------|------|-------------|
| `reading_id` | INT AUTO_INCREMENT | PRIMARY KEY |
| `road_id` | INT | FK → roads(road_id) ON DELETE CASCADE |
| `reading_timestamp` | DATETIME | NOT NULL |
| `vehicle_count` | INT | — |
| `avg_speed_kmph` | DECIMAL(5,2) | — |
| `congestion_level` | ENUM('Low','Moderate','High','Severe') | NOT NULL |
| `weather` | ENUM('Clear','Rain','Fog','Storm') | DEFAULT 'Clear' |

#### Table: `vehicles`
| Column | Type | Constraints |
|--------|------|-------------|
| `vehicle_id` | INT AUTO_INCREMENT | PRIMARY KEY |
| `vehicle_type` | ENUM('Car','Bus','Truck','Two-Wheeler','Auto','Taxi','Emergency') | NOT NULL |
| `registration_state` | INT | FK → states(state_id) ON DELETE SET NULL |
| `registration_year` | INT | — |

### 4.3 Entity Relationships

```
states (1) ──has──▸ (N) cities (1) ──has──▸ (N) roads (1) ──has──▸ (N) traffic_readings
  │
  └─── (1) ──registers──▸ (N) vehicles
```

### 4.4 Referential Integrity & ACID Constraints

- `ON DELETE CASCADE` on `cities → states`, `roads → cities`, `traffic_readings → roads`
- `ON DELETE SET NULL` on `vehicles → states` (registration state can be orphaned gracefully)

### 4.5 Approximate Data Volume

| Table | Records |
|-------|---------|
| `states` | 36 |
| `cities` | 50 |
| `roads` | ~250 |
| `traffic_readings` | ~15,000+ |
| `vehicles` | 5,000 |

---

## 5. Backend Design

### 5.1 Architecture Overview

![Backend Architecture](https://drive.google.com/uc?export=view&id=1SVxKGfYBUlFsblBw8lavNY_69f581Q8E)

### 5.2 Server Configuration (`server.js`)

The Express server provides the following middleware pipeline:

```
Request → CORS → JSON Parser → Static Files → Query Timer & Context Middleware → Route Handler → Response
```

**Key Functions:**

| Function / Middleware | Description |
|----------------------|-------------|
| `app.use(cors())` | Enables Cross-Origin Resource Sharing |
| `app.use(express.json())` | Parses incoming JSON request bodies |
| `app.use(express.static())` | Serves frontend files from `/public` |
| **Query Timer Middleware** | Uses `perf_hooks.performance.now()` to measure query duration; attaches `X-Query-Time` and `X-Index-Status` response headers |
| **AsyncLocalStorage Context** | Reads `X-Ignore-Index` request header and stores it in `AsyncLocalStorage` for the database layer to pick up |
| **SPA Fallback** | `app.get('*')` returns `index.html` for all non-API routes |
| **Background TomTom Poller** | Every 15 minutes, fetches live traffic data for 5 metro cities and inserts fresh readings into the database |

### 5.3 Database Connection Layer (`connection.js`)

**Key Design Pattern — IGNORE INDEX Interceptor:**

The connection pool overrides `pool.query()` to dynamically inject `IGNORE INDEX` hints when the user toggles indexing off in the UI. This uses a negative lookbehind regex to avoid injecting hints inside subqueries:

```javascript
// Regex: only match top-level FROM clauses, not subquery FROMs
const topLevelFromRe = /(?<!\()\bFROM\s+traffic_readings(\s+tr\b)?(?!\s+IGNORE)/ig;
sql = sql.replace(topLevelFromRe, (m, p1) =>
    `FROM traffic_readings${p1 || ''} ${ignoreHint}`
);
```

### 5.4 Database Security

The application implements several security best practices to protect the database layer:

- **Parameterized Queries (SQL Injection Prevention):** All user-supplied inputs (city IDs, road IDs, date ranges) are passed as parameterized placeholders (`?`) via the `mysql2/promise` driver, ensuring that raw user input is never interpolated directly into SQL strings. For example:
  ```javascript
  const [rows] = await pool.query(
      'SELECT * FROM roads WHERE city_id = ?',
      [req.params.cityId]  // safely parameterized
  );
  ```

- **Environment Variable Credential Management:** Sensitive credentials (`DB_PASSWORD`, `TOMTOM_API_KEY`) are stored in a `.env` file excluded from version control via `.gitignore`. The `dotenv` package loads these at runtime, ensuring secrets never appear in source code.

- **Connection Pooling with Limits:** The MySQL connection pool is configured with `connectionLimit: 10` and `queueLimit: 0`, preventing resource exhaustion from excessive concurrent connections.

- **Input Validation:** Route handlers validate and sanitize parameters (e.g., casting `cityId` to integer, defaulting `days` via `parseInt() || 7`) before query execution.

- **Centralized Error Handling:** A global Express error handler catches all unhandled exceptions and returns a sanitized `500` response, preventing internal stack traces or database details from leaking to the client.

### 5.5 Route Modules — Functions Defined

#### 5.4.1 Traffic Routes (`routes/traffic.js`) — 8 Endpoints

| # | Function | Route | Description |
|---|----------|-------|-------------|
| 1 | `GET /live` | `/api/traffic/live?city_id=` | Fetches latest reading per road with multi-table JOIN (traffic_readings → roads → cities → states) |
| 2 | `GET /congestion/:cityId` | `/api/traffic/congestion/:cityId` | Aggregates congestion breakdown per road with CASE-WHEN counting |
| 3 | `GET /trend/:roadId` | `/api/traffic/trend/:roadId?days=7` | Hourly time-series aggregation using `DATE()` and `HOUR()` functions |
| 4 | `GET /heatmap` | `/api/traffic/heatmap` | City-level congestion ranking with LEFT JOINs and HAVING clause |
| 5 | `GET /cities` | `/api/traffic/cities` | Lists all cities for dropdown, sorted by metro status |
| 6 | `GET /roads/:cityId` | `/api/traffic/roads/:cityId` | Lists roads in a specific city |
| 7 | `GET /city-kpi/:cityId` | `/api/traffic/city-kpi/:cityId` | Runs 4 parallel queries for KPI stats using `Promise.all()` |
| 8 | `GET /peak-hours/:cityId` | `/api/traffic/peak-hours/:cityId` | Traffic volume grouped by `HOUR(reading_timestamp)` |

#### 5.4.2 Analytics Routes (`routes/analytics.js`) — 4 Endpoints

| # | Function | Route | Description |
|---|----------|-------|-------------|
| 1 | `GET /overview` | `/api/analytics/overview` | Runs 6 parallel COUNT/AVG queries for dashboard KPIs |
| 2 | `GET /city-comparison` | `/api/analytics/city-comparison` | Reads from `v_city_traffic_summary` SQL view (top 20 cities) |
| 3 | `GET /congestion-distribution` | `/api/analytics/congestion-distribution` | Nationwide congestion level breakdown with percentage calculation |
| 4 | `GET /weather-impact` | `/api/analytics/weather-impact` | Weather condition impact on speed and congestion |

#### 5.4.3 DBMS Routes (`routes/dbms.js`) — 3 Endpoints

| # | Function | Route | Description |
|---|----------|-------|-------------|
| 1 | `GET /indexes` | `/api/dbms/indexes` | Queries `INFORMATION_SCHEMA.STATISTICS` and classifies indexes by level (Single, Composite, Covering) |
| 2 | `GET /cost-estimation` | `/api/dbms/cost-estimation` | Runs `EXPLAIN FORMAT=TRADITIONAL` on 4 predefined queries with/without index; computes I/O cost, CPU cost, selectivity, and improvement % |
| 3 | `GET /index-stats` | `/api/dbms/index-stats` | Returns cardinality and selectivity for each index using `INFORMATION_SCHEMA` |

### 5.5 Live Data Module (`fetchLiveTraffic.js`)

| Function | Description |
|----------|-------------|
| `getLiveTrafficForCity(cityName)` | Fetches real-time speed data from TomTom Traffic Flow API for 8 Indian metro cities using randomized coordinates within ~5km of city center |
| `determineCongestion(current, freeFlow)` | Calculates congestion level from speed ratio: >0.8 = Low, >0.6 = Moderate, >0.3 = High, else Severe |
| `getRandomCoordinate(baseLat, baseLon)` | Generates random lat/lon within ~5km offset for varied API responses |

### 5.6 Data Flow

```
Browser (SPA)                    Node.js / Express                  MySQL (InnoDB)
─────────────                    ─────────────────                  ──────────────
fetch('/api/traffic/live')  ──▸  routes/traffic.js              ──▸  SELECT ... JOIN
  + X-Ignore-Index header        connection.js intercepts            B+ Tree index scan
                                 injects IGNORE INDEX if toggled     OR full table scan
                             ◂──  JSON response                 ◂──  Optimized result set
  X-Query-Time header            + query duration measured
  Chart.js renders data
```

---

## 6. Frontend Design

### 6.1 SPA Architecture

The frontend is a **Single Page Application** with client-side routing managed by `app.js`. Three JavaScript modules handle different concerns:

| Module | Size | Responsibility |
|--------|------|----------------|
| `app.js` | 718 lines | SPA router, page switching, KPI rendering, theme management, GSAP animations, back-to-top, toast notifications |
| `charts.js` | 699 lines | All Chart.js configurations and 9 chart rendering functions |
| `dbms.js` | 534 lines | DBMS concepts panel — index visualization, B+ tree SVG, cost estimation UI, live race animation |

### 6.2 Key Frontend Functions

#### `app.js` — Core Application Functions

| Function | Description |
|----------|-------------|
| `api(url)` | Global fetch wrapper that attaches `X-Ignore-Index` header and reads `X-Query-Time` from response to update the performance stopwatch |
| `switchPage(page)` | SPA page router — hides/shows page sections, kills stale GSAP animations, triggers entrance animations |
| `loadDashboard()` | Fetches overview, congestion, weather, and city comparison data in parallel via `Promise.all()` |
| `loadTraffic()` | Initializes city/road dropdowns, event listeners, and loads initial traffic data |
| `refreshTrafficPage(cityId)` | Fetches congestion, KPI, peak-hours, heatmap, and live data in parallel |
| `renderTrafficKpis(data)` | Generates KPI card HTML with animated counters |
| `renderHeatmapTable(data)` | Renders color-coded congestion ranking table |
| `loadLiveTraffic(cityId)` | Populates the live traffic readings table with badges and icons |
| `animateCounter(el, target)` | Cubic ease-out animated number counter |
| `initBackgroundAnimation()` | Initializes GSAP floating orb animations and grid breathing |
| `themeTransitionEffect()` | GSAP-powered smooth dark/light theme transition with flash overlay |
| `initBackToTop()` | Scroll-triggered back-to-top button |
| `showRefreshToast(msg)` | Toast notification on data refresh |

#### `charts.js` — Chart Rendering Functions

| Function | Chart Type | Description |
|----------|-----------|-------------|
| `renderCongestionDonut(data)` | Doughnut | Nationwide congestion distribution with custom HTML legend |
| `renderWeatherChart(data)` | Bar + Line | Weather impact on speed (bars) and congestion % (line) |
| `renderCityComparison(data)` | Bar + Line | Top 12 congested cities comparison |
| `renderRoadCongestion(data)` | Horizontal Stacked Bar | Road-level congestion breakdown (Severe/High/Moderate/Low) |
| `renderSpeedComparison(data)` | Bar + Line | Actual speed vs speed limit per road |
| `renderTrafficTrend(data)` | Dual-axis Line | 7-day hourly traffic volume and speed trend |
| `renderRoadTypeLoad(data)` | Polar Area | Vehicle load distribution by road type |
| `renderPeakHours(data)` | Bar + Line | 24-hour peak hours analysis |
| `updateChartTheme(isLight)` | — | Updates all chart instances for dark/light mode |

#### `dbms.js` — DBMS Concepts Module

| Function | Description |
|----------|-------------|
| `DBMS.init()` | Entry point — sets up tabs, loads indexes, loads cost estimation, initializes race |
| `DBMS.setupTabs()` | Tab switching logic for Index Visualizer and Cost Estimation tabs |
| `DBMS.loadIndexes()` | Fetches index data from `/api/dbms/indexes` |
| `DBMS.renderIndexLevels(indexes)` | Renders Level 1/2/3 index classification cards |
| `DBMS.renderBTree()` | Generates interactive SVG B+ Tree visualization with root, internal, and leaf nodes |
| `DBMS.drawBTreeConnectors()` | Draws SVG connector lines between B+ tree nodes |
| `DBMS.renderIndexTable(indexes)` | Populates the all-indexes table from INFORMATION_SCHEMA |
| `DBMS.initRace()` | Sets up the O(N) vs O(log N) live race animation |
| `DBMS.startRace()` | Runs the animated comparison — full table scan (4.5s) vs B+ tree lookup (0.5s) |
| `DBMS.loadCostEstimation()` | Fetches cost data from `/api/dbms/cost-estimation` |
| `DBMS.renderCostOverview(stats)` | Renders table statistics card (rows, pages, data size) |
| `DBMS.renderCostComparison(queries)` | Renders side-by-side cost comparison cards with animated progress bars |
| `DBMS.stopAnimations()` | Cleanup — kills all DBMS-related GSAP animations when navigating away |

---

## 7. DBMS Concepts Demonstrated

### 7.1 Third Normal Form (3NF) Normalization

All transitive dependencies are eliminated. For example, `state_name` is never stored alongside city data; it is always resolved through a `state_id` foreign key join.

### 7.2 Multi-Level B+ Tree Indexing

Four indexes are defined on the `traffic_readings` table:

| Level | Index Name | Columns | Purpose |
|-------|-----------|---------|---------|
| **Level 1** — Single Column | `idx_traffic_timestamp` | `reading_timestamp` | Fast range queries on time |
| **Level 2** — Composite | `idx_traffic_road_congestion` | `road_id, congestion_level` | Multi-predicate filtering |
| **Level 2** — Composite | `idx_traffic_road_timestamp` | `road_id, reading_timestamp` | Road-specific time series |
| **Level 3** — Covering | `idx_traffic_covering` | `road_id, reading_timestamp, avg_speed_kmph, vehicle_count` | Zero table lookups — index-only scan |

### 7.3 Query Cost Estimation

The `/api/dbms/cost-estimation` endpoint runs `EXPLAIN FORMAT=TRADITIONAL` on 4 predefined queries, each executed **with** and **without** its index (using `IGNORE INDEX`). It computes:

- **Rows examined** (selectivity = estimated rows / total rows)
- **I/O cost** = ceil(rows × avg_row_length ÷ 16KB page size)
- **CPU cost** = rows × 0.01 (cpu_tuple_cost)
- **Total cost** = I/O cost + CPU cost
- **Improvement %** = (1 − cost_with / cost_without) × 100

### 7.4 Precompiled SQL Views

| View | Purpose |
|------|---------|
| `v_city_traffic_summary` | Aggregated traffic metrics per city (avg speed, congestion %, severe counts) via multi-table JOIN |
| `v_road_congestion_ranking` | Road-level congestion ranking across all cities |

### 7.5 Stored Procedures

| Procedure | Parameters | Purpose |
|-----------|-----------|---------|
| `sp_congestion_report` | `city_id, date_from, date_to` | Generates congestion breakdown for a specific city and date range |
| `sp_traffic_trend` | `road_id, days` | Returns hourly traffic trends for a given road |

---

## 8. Features Implemented

### 8.1 Dashboard Page
- **KPI Cards** with animated counters (Total Roads, Avg Speed, Congestion Rate)
- **Congestion Distribution Donut** chart with interactive custom legend
- **Weather Impact Chart** — dual-axis bar+line showing speed and congestion by weather
- **Top Congested Cities** bar chart powered by the `v_city_traffic_summary` view

### 8.2 Traffic Monitor Page
- **City & Road Dropdown Selectors** for 50 seeded cities
- **Dynamic KPI Cards** — road count, avg speed, peak vehicles, congestion rate, dominant weather
- **6 Interactive Charts** — road congestion (stacked bar), speed vs limit, 7-day trend (line), vehicle load by road type (polar), peak hours analysis, congestion heatmap table
- **Live Traffic Table** with color-coded speed, congestion badges, and weather icons
- **Refresh Button** with toast notification

### 8.3 DBMS Concepts Page
- **Multi-Level Index Visualizer** — cards for each index level with columns and cardinality
- **B+ Tree SVG Visualization** — interactive tree with root, internal, and leaf nodes connected by SVG lines
- **O(N) vs O(log N) Live Race** — animated comparison of full table scan vs B+ tree index search
- **All Database Indexes Table** — pulled from `INFORMATION_SCHEMA.STATISTICS`
- **Query Cost Estimation Tab** — side-by-side cost breakdown for 4 queries

### 8.4 Global Features
- **Index Toggle** (`X-Ignore-Index` header) to demonstrate performance difference
- **Performance Stopwatch** displaying server-side query time (`X-Query-Time` header)
- **Dark/Light Theme Toggle** with smooth GSAP transition
- **GSAP Entrance Animations** with perspective transforms and stagger timing
- **Animated Background Orbs** with grid breathing effect
- **Back-to-Top Button** and **SPA Deep-Link Guard**

---

## 9. API Reference

### Traffic Routes (`/api/traffic`) — 8 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/live?city_id=` | Latest reading per road |
| GET | `/congestion/:cityId` | Congestion analysis per road |
| GET | `/trend/:roadId?days=7` | Hourly time-series data |
| GET | `/heatmap` | City-level congestion ranking |
| GET | `/cities` | All cities for dropdown |
| GET | `/roads/:cityId` | Roads in a specific city |
| GET | `/city-kpi/:cityId` | Aggregated KPI stats |
| GET | `/peak-hours/:cityId` | Traffic volume by hour |

### Analytics Routes (`/api/analytics`) — 4 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/overview` | Dashboard KPI data |
| GET | `/city-comparison` | Top 20 cities from SQL view |
| GET | `/congestion-distribution` | Nationwide congestion breakdown |
| GET | `/weather-impact` | Weather impact analysis |

### DBMS Routes (`/api/dbms`) — 3 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/indexes` | All indexes classified by level |
| GET | `/cost-estimation` | Full cost comparison (4 queries) |
| GET | `/index-stats` | Cardinality and selectivity |

---

## 10. Data Seeding & Live Integration

### 10.1 Seed Script (`database/seed.js`)

The seed script handles the complete database setup in one command (`npm run seed`):

1. Runs `schema.sql` — creates the `smart_traffic` database and 5 tables
2. Inserts **36 states/UTs**, **50 cities**, **~250 roads**
3. Generates **~15,000+ traffic readings** with realistic congestion patterns
4. Inserts **5,000 vehicles** across 7 types
5. Creates **2 SQL views** from `procedures.sql`
6. Registers **2 stored procedures**

### 10.2 Metro Congestion Weighting

Metro cities receive heavier congestion using real-world weights based on TomTom Traffic Index data:

| City | Weight | City | Weight |
|------|--------|------|--------|
| Mumbai | 0.85 | Pune | 0.72 |
| Delhi | 0.82 | Ahmedabad | 0.68 |
| Bangalore | 0.80 | Surat | 0.65 |
| Kolkata | 0.78 | Jaipur | 0.63 |
| Chennai | 0.77 | Lucknow | 0.60 |
| Hyderabad | 0.75 | | |

### 10.3 Weather Distribution

Clear: 70% · Rain: 15% · Fog: 10% · Storm: 5%

### 10.4 Background Polling & Error Resilience

Once the server is running, it polls the TomTom API every **15 minutes** (900,000 ms) to insert fresh live traffic readings for the top 5 metro cities.

**Error Handling & Fault Tolerance:**

- **API Failure Graceful Degradation:** If the TomTom API is unreachable, returns an error, or hits rate limits, the `getLiveTrafficForCity()` function silently returns `null`. The system then falls back to its existing synthetic/historical data, ensuring the application remains fully functional without live data.
- **Per-City Isolation:** Each city's API call is independent — if one city's fetch fails, the remaining cities are still processed and inserted.
- **Timeout Protection:** All TomTom API requests are configured with a **5-second timeout** (`{ timeout: 5000 }`) to prevent the poller from hanging on slow network responses.
- **Non-Blocking Architecture:** The background poller runs inside a `setInterval` callback and does not block the main Express request-response cycle. API failures in the poller never affect user-facing requests.

---

## 11. Conclusion

The Smart Traffic & Transport Database System successfully demonstrates the practical application of core DBMS concepts in a real-world scenario. The project covers:

- **Database normalization** through a well-structured 3NF schema with 5 interconnected tables
- **B+ Tree indexing** at three levels of complexity with measurable performance gains
- **Query cost estimation** providing quantitative proof of index optimization
- **SQL Views and Stored Procedures** for efficient data aggregation
- **Referential integrity** through cascading foreign key constraints
- **Live data integration** through the TomTom Traffic Flow API
- **Full-stack web development** with a modern, responsive SPA interface

The interactive DBMS Concepts page allows users to visually explore how B+ Tree indexes work, compare O(N) vs O(log N) search performance through live animation, and analyze query cost breakdowns — making abstract database concepts tangible and accessible.

---

> **Smart Traffic & Transport Database System** — A DBMS Academic Project
