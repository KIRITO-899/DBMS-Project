-- ============================================================
-- Smart Traffic & Transport Database System
-- Schema Definition (7 Normalized Tables in 3NF)
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_traffic;
USE smart_traffic;

-- ============================================================
-- Table 1: states — Indian States & Union Territories
-- ============================================================
DROP TABLE IF EXISTS public_transport;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS accidents;
DROP TABLE IF EXISTS traffic_readings;
DROP TABLE IF EXISTS roads;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS states;

CREATE TABLE states (
    state_id    INT AUTO_INCREMENT PRIMARY KEY,
    state_name  VARCHAR(100) NOT NULL UNIQUE,
    region      ENUM('North','South','East','West','Central','Northeast') NOT NULL
) ENGINE=InnoDB;

-- ============================================================
-- Table 2: cities — Major Indian Cities
-- ============================================================
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

-- ============================================================
-- Table 3: roads — Roads and Highways
-- ============================================================
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

-- ============================================================
-- Table 4: traffic_readings — Traffic Sensor Data
-- ============================================================
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

-- ============================================================
-- Table 5: accidents — Road Accident Records
-- ============================================================
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

-- ============================================================
-- Table 6: vehicles — Registered Vehicles
-- ============================================================
CREATE TABLE vehicles (
    vehicle_id          INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_type        ENUM('Car','Bus','Truck','Two-Wheeler','Auto','Taxi','Emergency') NOT NULL,
    registration_state  INT,
    registration_year   INT,
    FOREIGN KEY (registration_state) REFERENCES states(state_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- Table 7: public_transport — Public Transit Routes
-- ============================================================
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

-- Level 1: Single-column indexes for high-selectivity queries
CREATE INDEX idx_traffic_timestamp
    ON traffic_readings (reading_timestamp);

CREATE INDEX idx_accident_date
    ON accidents (accident_date);

-- Level 2: Composite indexes for multi-predicate queries
CREATE INDEX idx_traffic_road_congestion
    ON traffic_readings (road_id, congestion_level);

CREATE INDEX idx_traffic_road_timestamp
    ON traffic_readings (road_id, reading_timestamp);

CREATE INDEX idx_accident_severity_date
    ON accidents (severity, accident_date);

-- Level 3: Covering indexes (include all queried columns)
CREATE INDEX idx_traffic_covering
    ON traffic_readings (road_id, reading_timestamp, avg_speed_kmph, vehicle_count);
