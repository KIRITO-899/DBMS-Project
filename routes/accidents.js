// ============================================================
// Accident Analytics Routes
// ============================================================

const router = require('express').Router();
const pool   = require('../database/connection');

// GET /api/accidents/summary — Overall stats
router.get('/summary', async (req, res, next) => {
    try {
        const { state, severity } = req.query;
        let sql = `
            SELECT
                COUNT(*) AS total_accidents,
                SUM(a.casualties) AS total_casualties,
                SUM(a.vehicles_involved) AS total_vehicles,
                SUM(CASE WHEN a.severity = 'Fatal' THEN 1 ELSE 0 END) AS fatal,
                SUM(CASE WHEN a.severity = 'Major' THEN 1 ELSE 0 END) AS major,
                SUM(CASE WHEN a.severity = 'Minor' THEN 1 ELSE 0 END) AS minor,
                ROUND(SUM(CASE WHEN a.severity = 'Fatal' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS fatality_rate
            FROM accidents a
        `;
        const params = [];
        let whereClauses = [];
        if (state) {
            sql += ` JOIN roads r ON a.road_id = r.road_id JOIN cities c ON r.city_id = c.city_id JOIN states s ON c.state_id = s.state_id`;
            whereClauses.push('s.state_name = ?');
            params.push(state);
        }
        if (severity) {
            whereClauses.push('a.severity = ?');
            params.push(severity);
        }
        if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ');
        
        const [rows] = await pool.query(sql, params);
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// GET /api/accidents/hotspots — Top accident-prone roads (optional ?state=&severity=)
router.get('/hotspots', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 15;
        const { state, severity } = req.query;
        let sql = `
            SELECT
                r.road_id, r.road_name, r.road_type,
                c.city_name, s.state_name,
                COUNT(a.accident_id) AS total_accidents,
                SUM(a.casualties) AS total_casualties,
                SUM(CASE WHEN a.severity = 'Fatal' THEN 1 ELSE 0 END) AS fatal_count,
                GROUP_CONCAT(DISTINCT a.cause ORDER BY a.cause SEPARATOR ', ') AS causes
            FROM accidents a
            JOIN roads r ON a.road_id = r.road_id
            JOIN cities c ON r.city_id = c.city_id
            JOIN states s ON c.state_id = s.state_id
            WHERE 1=1
        `;
        const params = [];
        if (state) { sql += ' AND s.state_name = ? '; params.push(state); }
        if (severity) { sql += ' AND a.severity = ? '; params.push(severity); }
        sql += `
            GROUP BY r.road_id, r.road_name, r.road_type, c.city_name, s.state_name
            ORDER BY total_accidents DESC
            LIMIT ?
        `;
        params.push(limit);
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/accidents/by-cause — Grouped by cause
router.get('/by-cause', async (req, res, next) => {
    try {
        const { state, severity } = req.query;
        let sql = `
            SELECT
                a.cause,
                COUNT(*) AS count,
                SUM(a.casualties) AS casualties,
                SUM(CASE WHEN a.severity = 'Fatal' THEN 1 ELSE 0 END) AS fatal_count
            FROM accidents a
        `;
        const params = [];
        let whereClauses = [];
        if (state) {
            sql += ` JOIN roads r ON a.road_id = r.road_id JOIN cities c ON r.city_id = c.city_id JOIN states s ON c.state_id = s.state_id`;
            whereClauses.push('s.state_name = ?');
            params.push(state);
        }
        if (severity) {
            whereClauses.push('a.severity = ?');
            params.push(severity);
        }
        if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ');
        sql += ` GROUP BY a.cause ORDER BY count DESC`;
        
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/accidents/trend — Monthly trends
router.get('/trend', async (req, res, next) => {
    try {
        const { state, severity } = req.query;
        let sql = `
            SELECT
                DATE_FORMAT(a.accident_date, '%Y-%m') AS month,
                COUNT(*) AS total,
                SUM(CASE WHEN a.severity = 'Fatal' THEN 1 ELSE 0 END) AS fatal,
                SUM(CASE WHEN a.severity = 'Major' THEN 1 ELSE 0 END) AS major,
                SUM(CASE WHEN a.severity = 'Minor' THEN 1 ELSE 0 END) AS minor,
                SUM(a.casualties) AS casualties
            FROM accidents a
        `;
        const params = [];
        let whereClauses = [];
        if (state) {
            sql += ` JOIN roads r ON a.road_id = r.road_id JOIN cities c ON r.city_id = c.city_id JOIN states s ON c.state_id = s.state_id`;
            whereClauses.push('s.state_name = ?');
            params.push(state);
        }
        if (severity) {
            whereClauses.push('a.severity = ?');
            params.push(severity);
        }
        if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ');
        sql += ` GROUP BY month ORDER BY month`;
        
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/accidents/by-time — Distribution by time of day
router.get('/by-time', async (req, res, next) => {
    try {
        const { state, severity } = req.query;
        let sql = `
            SELECT
                a.time_of_day,
                COUNT(*) AS count,
                SUM(a.casualties) AS casualties,
                SUM(CASE WHEN a.severity = 'Fatal' THEN 1 ELSE 0 END) AS fatal_count
            FROM accidents a
        `;
        const params = [];
        let whereClauses = [];
        if (state) {
            sql += ` JOIN roads r ON a.road_id = r.road_id JOIN cities c ON r.city_id = c.city_id JOIN states s ON c.state_id = s.state_id`;
            whereClauses.push('s.state_name = ?');
            params.push(state);
        }
        if (severity) {
            whereClauses.push('a.severity = ?');
            params.push(severity);
        }
        if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ');
        sql += ` GROUP BY a.time_of_day ORDER BY FIELD(a.time_of_day, 'Morning', 'Afternoon', 'Evening', 'Night')`;
        
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/accidents/by-state — Accident stats by state
router.get('/by-state', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM v_accident_statistics ORDER BY total_accidents DESC`);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/accidents/states — List of states for dropdown
router.get('/states', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT s.state_name
            FROM accidents a
            JOIN roads r ON a.road_id = r.road_id
            JOIN cities c ON r.city_id = c.city_id
            JOIN states s ON c.state_id = s.state_id
            ORDER BY s.state_name
        `);
        res.json(rows.map(r => r.state_name));
    } catch (err) { next(err); }
});

// GET /api/accidents/live — Recent live incidents from TomTom API
router.get('/live', async (req, res, next) => {
    try {
        const { state, severity } = req.query;
        let sql = `
            SELECT
                a.accident_id, a.accident_date, a.time_of_day, a.severity, 
                a.cause, a.description, r.road_name, c.city_name
            FROM accidents a
            JOIN roads r ON a.road_id = r.road_id
            JOIN cities c ON r.city_id = c.city_id
            JOIN states s ON c.state_id = s.state_id
            WHERE a.cause LIKE '[LIVE API]%'
              AND a.accident_date = CURRENT_DATE()
        `;
        const params = [];
        if (state) { sql += ' AND s.state_name = ? '; params.push(state); }
        if (severity) { sql += ' AND a.severity = ? '; params.push(severity); }
        
        sql += ` ORDER BY RAND() LIMIT 20 `;
        
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) { next(err); }
});

module.exports = router;
