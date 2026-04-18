// ============================================================
// Database Connection Pool
// Smart Traffic & Transport Database System
// ============================================================
// IMPORTANT: Update the 'password' field below with your MySQL root password.
// Default: empty string (no password)
// ============================================================

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,           // <-- Sourced from .env
    database: 'smart_traffic',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true       // Return dates as strings, not Date objects
});

const originalQuery = pool.query;
pool.query = async function(sql, values) {
    // Dynamically retrieve the async context to avoid circular dependency on load
    const serverModule = require('../server');
    const asyncLocalStorage = serverModule.asyncLocalStorage;
    
    if (asyncLocalStorage) {
        const store = asyncLocalStorage.getStore();
        if (store && store.ignoreIndex) {
            // Strip any explicit indexes if they exist (just in case)
            // Inject IGNORE INDEX for the main heavy tables
            if (typeof sql === 'string') {
                sql = sql.replace(/FROM\s+traffic_readings(\s+tr\b)?(?!\s+IGNORE)/ig, (m, p1) => `FROM traffic_readings${p1 || ''} IGNORE INDEX (idx_traffic_timestamp, idx_traffic_road_congestion, idx_traffic_covering)`);
                sql = sql.replace(/FROM\s+accidents(\s+a\b)?(?!\s+IGNORE)/ig, (m, p1) => `FROM accidents${p1 || ''} IGNORE INDEX (idx_accident_severity_date)`);
            } else if (sql && typeof sql.sql === 'string') {
                sql.sql = sql.sql.replace(/FROM\s+traffic_readings(\s+tr\b)?(?!\s+IGNORE)/ig, (m, p1) => `FROM traffic_readings${p1 || ''} IGNORE INDEX (idx_traffic_timestamp, idx_traffic_road_congestion, idx_traffic_covering)`);
                sql.sql = sql.sql.replace(/FROM\s+accidents(\s+a\b)?(?!\s+IGNORE)/ig, (m, p1) => `FROM accidents${p1 || ''} IGNORE INDEX (idx_accident_severity_date)`);
            }
        }
    }
    
    return originalQuery.call(this, sql, values);
};

module.exports = pool;
