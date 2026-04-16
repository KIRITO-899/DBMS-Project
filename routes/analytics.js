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
            pool.query('SELECT COUNT(*) AS cnt FROM accidents'),
            pool.query('SELECT COUNT(*) AS cnt FROM vehicles'),
            pool.query('SELECT COUNT(*) AS cnt FROM cities'),
            pool.query('SELECT COUNT(*) AS cnt FROM public_transport'),
            pool.query(`SELECT ROUND(AVG(avg_speed_kmph), 2) AS avg_speed FROM traffic_readings`),
            pool.query(`SELECT ROUND(
                SUM(CASE WHEN congestion_level IN ('High','Severe') THEN 1 ELSE 0 END)
                / COUNT(*) * 100, 2
            ) AS congestion_rate FROM traffic_readings`),
            pool.query(`SELECT SUM(daily_ridership) AS total_ridership FROM public_transport`)
        ];
        const results = await Promise.all(queries);
        res.json({
            total_roads:        results[0][0][0].cnt,
            total_readings:     results[1][0][0].cnt,
            total_accidents:    results[2][0][0].cnt,
            total_vehicles:     results[3][0][0].cnt,
            total_cities:       results[4][0][0].cnt,
            total_routes:       results[5][0][0].cnt,
            avg_speed:          results[6][0][0].avg_speed,
            congestion_rate:    results[7][0][0].congestion_rate,
            daily_ridership:    results[8][0][0].total_ridership
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

// GET /api/analytics/transport — Public transport analytics (optional ?type=)
router.get('/transport', async (req, res, next) => {
    try {
        const { type } = req.query;
        let sql = `
            SELECT
                pt.route_id, pt.route_name, pt.transport_type,
                pt.stops, pt.daily_ridership, pt.frequency_mins,
                c.city_name, s.state_name
            FROM public_transport pt
            JOIN cities c ON pt.city_id = c.city_id
            JOIN states s ON c.state_id = s.state_id
        `;
        const params = [];
        if (type) { sql += ' WHERE pt.transport_type = ? '; params.push(type); }
        sql += ' ORDER BY pt.daily_ridership DESC LIMIT 100';
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/analytics/transport-summary — Transport by type & city
router.get('/transport-summary', async (req, res, next) => {
    try {
        const [byType] = await pool.query(`
            SELECT
                transport_type,
                COUNT(*) AS routes,
                SUM(daily_ridership) AS total_ridership,
                ROUND(AVG(frequency_mins), 1) AS avg_frequency,
                ROUND(AVG(stops), 1) AS avg_stops
            FROM public_transport
            GROUP BY transport_type
            ORDER BY total_ridership DESC
        `);
        const [byCity] = await pool.query(`
            SELECT
                c.city_name,
                COUNT(pt.route_id) AS routes,
                SUM(pt.daily_ridership) AS total_ridership
            FROM public_transport pt
            JOIN cities c ON pt.city_id = c.city_id
            GROUP BY c.city_id, c.city_name
            ORDER BY total_ridership DESC
            LIMIT 15
        `);
        res.json({ byType, byCity });
    } catch (err) { next(err); }
});

// GET /api/analytics/congestion-distribution — Overall congestion levels
router.get('/congestion-distribution', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                congestion_level,
                COUNT(*) AS count,
                ROUND(COUNT(*) / (SELECT COUNT(*) FROM traffic_readings) * 100, 2) AS percentage
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
