# Smart Traffic & Transport Database System

![Project Status](https://img.shields.io/badge/Status-Complete-success)
![Database](https://img.shields.io/badge/Database-MySQL-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green)

A comprehensive, full-stack Academic Database Management System designed for smart city infrastructure. It monitors real-time traffic, logs accidents, and manages public transport across India. 

The primary purpose of this project is to provide a robust demonstration of **Advanced DBMS Concepts**, specifically featuring interactive visualizers for **Multi-Level Indexing** and **Query Cost Estimation**.

## 🌟 Key Features

- **Dynamic Interactive Dashboard**: Premium dark-mode UI with glassmorphism, micro-animations, and custom HTML-interactive chart legends to visualize traffic congestion, weather impacts, and transport insights in real-time.
- **Accident Analytics Engine**: Track high-risk locations, analyze severity metrics, and visualize historical accident trends.
- **DBMS Concept Visualizer**: 
  - **Multi-Level Indexing**: Explores Single, Composite, and Covering Indexes on B+ tree structures directly inside the UI.
  - **Query Cost Estimation**: Interactively breaks down Selectivity, I/O Page Costs, and CPU Tuple Costs natively, explicitly tracking the performance difference between queries run `WITH` indexing versus `WITHOUT` (using `IGNORE INDEX`).
  - **Dynamic EXPLAIN Plans**: Highlights raw optimizer routing plans cleanly within the UI.
- **Robust Real-World Data**: Pre-seeded with **17,500+ records** mimicking real-world Indian traffic metrics (derived from data.gov.in standards) spanning 36 states and 50 major cities.

## 🛠️ Technology Stack

- **Database**: MySQL 8+ (InnoDB Engine)
- **Backend**: Node.js, Express.js, mysql2 (Promise-based)
- **Frontend**: HTML5, Vanilla JS, CSS3 Design System
- **Environment Management**: dotenv
- **Charting**: Chart.js 4.4.0

## 🗄️ Database Schema & Normalization

The database (`smart_traffic`) contains 7 fully normalized tables (in 3NF) built exactly for scale:

1. **`states`**: Indian States / Union Territories.
2. **`cities`**: Major metropolis details and demographics.
3. **`roads`**: Highways, Expressways, and urban grids.
4. **`traffic_readings`**: Sensor points tracking speed, vehicle count, and congestion levels. *(Multi-million row scale simulation)*.
5. **`accidents`**: Fatality, severity, and causality indexes.
6. **`vehicles`**: Registrations and classifications.
7. **`public_transport`**: Daily ridership and transit types.

### Dedicated SQL Architecture
- `schema.sql`: Table models, constraints, clustered primaries, and precise B+ Indexes.
- `procedures.sql`: Precompiled `Views` aggregating data to skip heavy iterative math on the backend.
- `seed.js`: Node based data architect to inject all logic.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL Server (running locally)

### 1. Installation
Clone the repository and install system dependencies:
```bash
git clone <your-repo-url>
cd "DBMS Project"
npm install
```

### 2. Configure Database Environment
We use a `.env` file to securely manage your MySQL credentials.
1. Create a `.env` file in the root directory.
2. Add your MySQL password to the file:
```env
DB_PASSWORD=your_mysql_password_here
```
*(Note: Do not commit your `.env` file! A `.gitignore` is included to prevent this.)*

### 3. Generate Database & Seed
Run the master initialization script. This interacts with MySQL to drop any existing databases, rebuild the 7-table schema, establish all indexes, and populate almost 18,000 distinct, realistic data records.
```bash
npm run seed
```

### 4. Start the Application
Spin up the Node/Express backend server:
```bash
npm run dev
```

Navigate your web browser to:
**[http://localhost:3000](http://localhost:3000)**

---

## 📚 Viewing the DBMS Concepts

This project was built to clearly output its own mathematical and theoretical proofs. 

Once your console is running on port 3000, click **DBMS Concepts** in the main sidebar. You can individually expand:
1. **Multi-Level Indexes**: View the explicit B+ hierarchies established natively in the `schema.sql` file.
2. **EXPLAIN Analysis**: See the direct optimizer data.
3. **Query Cost**: Look at exactly how the DB Engine computes I/O costs vs CPU metrics for 5 predefined queries natively running on the server.

---

*Designed and Developed for Smart City Academic Demonstration.*
