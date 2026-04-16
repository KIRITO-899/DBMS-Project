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

module.exports = pool;
