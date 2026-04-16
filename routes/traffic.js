// ============================================================
// Traffic Monitoring Routes
// ============================================================

const router = require('express').Router();
const pool   = require('../database/connection');

// GET /api/traffic/live — Latest readings per road (optional ?city_id=)
router.get('/live', async (req, res, next) => {
    try {
        const { city_id } = req.query;
        let sql = `
            SELECT
                tr.reading_id, tr.road_id, tr.reading_timestamp,
                tr.vehicle_count, tr.avg_speed_kmph,
                tr.congestion_level, tr.weather,
                r.road_name, r.road_type, r.speed_limit_kmph, r.lanes,
                c.city_name, s.state_name
            FROM traffic_readings tr
            JOIN roads r  ON tr.road_id = r.road_id
            JOIN cities c ON r.city_id  = c.city_id
            JOIN states s ON c.state_id = s.state_id
            WHERE tr.reading_id IN (
                SELECT MAX(reading_id) FROM traffic_readings GROUP BY road_id
            )
        `;
        const params = [];
        if (city_id) {
            sql += ' AND r.city_id = ? ';
            params.push(city_id);
        }
        sql += ' ORDER BY tr.congestion_level DESC, tr.vehicle_count DESC LIMIT 50';
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/traffic/congestion/:cityId — Congestion analysis
router.get('/congestion/:cityId', async (req, res, next) => {
    try {
        let sql = `
            SELECT
                r.road_id, r.road_name, r.road_type,
                COUNT(tr.reading_id) AS total_readings,
                ROUND(AVG(tr.vehicle_count), 0) AS avg_vehicles,
                ROUND(AVG(tr.avg_speed_kmph), 2) AS avg_speed,
                r.speed_limit_kmph,
                SUM(CASE WHEN tr.congestion_level = 'Severe' THEN 1 ELSE 0 END) AS severe_count,
                SUM(CASE WHEN tr.congestion_level = 'High' THEN 1 ELSE 0 END) AS high_count,
                SUM(CASE WHEN tr.congestion_level = 'Moderate' THEN 1 ELSE 0 END) AS moderate_count,
                SUM(CASE WHEN tr.congestion_level = 'Low' THEN 1 ELSE 0 END) AS low_count,
                ROUND(
                    SUM(CASE WHEN tr.congestion_level IN ('High','Severe') THEN 1 ELSE 0 END)
                    / NULLIF(COUNT(tr.reading_id), 0) * 100, 2
                ) AS congestion_pct
            FROM roads r
            LEFT JOIN traffic_readings tr ON tr.road_id = r.road_id
        `;
        let params = [];
        if (req.params.cityId !== 'all') {
            sql += ' WHERE r.city_id = ? ';
            params.push(req.params.cityId);
        }
        sql += `
            GROUP BY r.road_id, r.road_name, r.road_type, r.speed_limit_kmph
            ORDER BY congestion_pct DESC
            LIMIT 50
        `;
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/traffic/trend/:roadId — Time-series data
router.get('/trend/:roadId', async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const [rows] = await pool.query(`
            SELECT
                DATE(reading_timestamp) AS date,
                HOUR(reading_timestamp) AS hour,
                ROUND(AVG(vehicle_count), 0)   AS avg_vehicles,
                ROUND(AVG(avg_speed_kmph), 2)  AS avg_speed,
                MAX(congestion_level)           AS peak_congestion
            FROM traffic_readings
            WHERE road_id = ?
              AND reading_timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY date, hour
            ORDER BY date, hour
        `, [req.params.roadId, days]);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/traffic/heatmap — Congestion heatmap by city
router.get('/heatmap', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                c.city_id, c.city_name, s.state_name, c.population,
                COUNT(tr.reading_id) AS readings,
                ROUND(AVG(tr.avg_speed_kmph), 2) AS avg_speed,
                ROUND(
                    SUM(CASE WHEN tr.congestion_level IN ('High','Severe') THEN 1 ELSE 0 END)
                    / NULLIF(COUNT(tr.reading_id), 0) * 100, 2
                ) AS congestion_pct,
                ROUND(AVG(tr.vehicle_count), 0) AS avg_vehicles
            FROM cities c
            JOIN states s ON c.state_id = s.state_id
            LEFT JOIN roads r ON r.city_id = c.city_id
            LEFT JOIN traffic_readings tr ON tr.road_id = r.road_id
            GROUP BY c.city_id, c.city_name, s.state_name, c.population
            HAVING readings > 0
            ORDER BY congestion_pct DESC
        `);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/traffic/cities — List of cities for dropdown
router.get('/cities', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.city_id, c.city_name, s.state_name, c.is_metro
            FROM cities c
            JOIN states s ON c.state_id = s.state_id
            ORDER BY c.is_metro DESC, c.city_name
        `);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/traffic/roads/:cityId — Roads in a city
router.get('/roads/:cityId', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT road_id, road_name, road_type, length_km, lanes, speed_limit_kmph
            FROM roads WHERE city_id = ? ORDER BY road_name
        `, [req.params.cityId]);
        res.json(rows);
    } catch (err) { next(err); }
});

module.exports = router;
