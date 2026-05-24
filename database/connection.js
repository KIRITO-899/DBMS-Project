// ============================================================
// Database Connection Pool
// Smart Traffic & Transport Database System
// ============================================================
// IMPORTANT: Update the 'password' field below with your MySQL root password.
// Default: empty string (no password)
// ============================================================

require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
  user: process.env.MYSQLUSER || process.env.DB_USER || "root",
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || "smart_traffic",
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // Return dates as strings, not Date objects
});

const originalQuery = pool.query;
pool.query = async function (sql, values) {
  // Dynamically retrieve the async context to avoid circular dependency on load
  const serverModule = require("../server");
  const asyncLocalStorage = serverModule.asyncLocalStorage;

  if (asyncLocalStorage) {
    const store = asyncLocalStorage.getStore();
    if (store && store.ignoreIndex) {
      // Strip any explicit indexes if they exist (just in case)
      // Inject IGNORE INDEX for the main heavy tables
      // Only inject IGNORE INDEX on top-level FROM clauses — NOT inside sub-queries.
      // The negative lookbehind (?<!\() ensures we don't touch "(SELECT ... FROM traffic_readings)".
      const ignoreHint =
        "IGNORE INDEX (idx_traffic_timestamp, idx_traffic_road_congestion, idx_traffic_covering)";
      const topLevelFromRe =
        /(?<!\()\bFROM\s+traffic_readings(\s+tr\b)?(?!\s+IGNORE)/gi;
      if (typeof sql === "string") {
        sql = sql.replace(
          topLevelFromRe,
          (m, p1) => `FROM traffic_readings${p1 || ""} ${ignoreHint}`,
        );
      } else if (sql && typeof sql.sql === "string") {
        sql.sql = sql.sql.replace(
          topLevelFromRe,
          (m, p1) => `FROM traffic_readings${p1 || ""} ${ignoreHint}`,
        );
      }
    }
  }

  return originalQuery.call(this, sql, values);
};

module.exports = pool;
