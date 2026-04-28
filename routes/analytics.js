// ============================================================
// Dashboard Analytics Routes
// ============================================================

const router = require('express').Router();
const pool   = require('../database/connection');

// GET /api/analytics/overview — KPI card data
router.get('/overview', async (req, res, next) => {
    try {
        const queries = [
            pool.query('SELECT COUNT(*) AS cnt FROM roads'),
            pool.query('SELECT COUNT(*) AS cnt FROM traffic_readings'),
            pool.query('SELECT COUNT(*) AS cnt FROM vehicles'),
            pool.query('SELECT COUNT(*) AS cnt FROM cities'),
            pool.query(`SELECT ROUND(AVG(avg_speed_kmph), 2) AS avg_speed FROM traffic_readings`),
            pool.query(`SELECT ROUND(
                SUM(CASE WHEN congestion_level IN ('High','Severe') THEN 1 ELSE 0 END)
                / COUNT(*) * 100, 2
            ) AS congestion_rate FROM traffic_readings`)
        ];
        const results = await Promise.all(queries);
        res.json({
            total_roads:        results[0][0][0].cnt,
            total_readings:     results[1][0][0].cnt,
            total_vehicles:     results[2][0][0].cnt,
            total_cities:       results[3][0][0].cnt,
            avg_speed:          results[4][0][0].avg_speed,
            congestion_rate:    results[5][0][0].congestion_rate
        });
    } catch (err) { next(err); }
});

// GET /api/analytics/city-comparison — Compare cities
router.get('/city-comparison', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM v_city_traffic_summary
            WHERE total_readings > 0
            ORDER BY congestion_pct DESC
            LIMIT 20
        `);
        res.json(rows);
    } catch (err) { next(err); }
});



// GET /api/analytics/congestion-distribution — Overall congestion levels
router.get('/congestion-distribution', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                congestion_level,
                COUNT(*) AS count,
                ROUND(
                    COUNT(*) / NULLIF((SELECT COUNT(*) FROM traffic_readings), 0) * 100, 2
                ) AS percentage
            FROM traffic_readings
            GROUP BY congestion_level
            ORDER BY FIELD(congestion_level, 'Low', 'Moderate', 'High', 'Severe')
        `);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/analytics/weather-impact — Weather impact on traffic
router.get('/weather-impact', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                weather,
                COUNT(*) AS readings,
                ROUND(AVG(avg_speed_kmph), 2) AS avg_speed,
                ROUND(AVG(vehicle_count), 0)  AS avg_vehicles,
                ROUND(
                    SUM(CASE WHEN congestion_level IN ('High','Severe') THEN 1 ELSE 0 END)
                    / COUNT(*) * 100, 2
                ) AS congestion_pct
            FROM traffic_readings
            GROUP BY weather
            ORDER BY congestion_pct DESC
        `);
        res.json(rows);
    } catch (err) { next(err); }
});

module.exports = router;
