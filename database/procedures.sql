-- ============================================================
-- Smart Traffic & Transport Database System
-- Views (run via seed.js with multipleStatements: true)
-- Runs against whichever database the connection already selected
-- (Railway: "railway", local: "smart_traffic") — no hardcoded USE.
-- ============================================================

-- ============================================================
-- VIEW 1: City Traffic Summary
-- Aggregated traffic metrics per city
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
    SUM(CASE WHEN tr.congestion_level = 'Severe' THEN 1 ELSE 0 END) AS severe_count,
    SUM(CASE WHEN tr.congestion_level = 'High'   THEN 1 ELSE 0 END) AS high_count,
    ROUND(
        SUM(CASE WHEN tr.congestion_level IN ('High','Severe') THEN 1 ELSE 0 END)
        / NULLIF(COUNT(tr.reading_id), 0) * 100, 2
    ) AS congestion_pct
FROM cities c
JOIN states s ON c.state_id = s.state_id
JOIN roads r ON r.city_id = c.city_id
JOIN traffic_readings tr ON tr.road_id = r.road_id
GROUP BY c.city_id, c.city_name, s.state_name, c.population, c.is_metro;


-- ============================================================
-- VIEW 3: Road Congestion Ranking
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
JOIN traffic_readings tr ON tr.road_id = r.road_id
GROUP BY r.road_id, r.road_name, r.road_type, c.city_name, s.state_name;
