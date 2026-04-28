// ============================================================
// DBMS Concepts Showcase Routes
// Multi-Level Indexing & Query Cost Estimation
// ============================================================

const router = require('express').Router();
const pool   = require('../database/connection');

// ────────────────────────────────────────────────────
// Predefined queries for EXPLAIN / cost analysis
// ────────────────────────────────────────────────────
const QUERIES = [
    {
        id: 1,
        name: 'Single-Column Index Scan (Live TomTom Data)',
        description: 'Range query analyzing recent Live TomTom traffic flow streams using a single-column B+ tree.',
        indexLevel: 1,
        sql: `SELECT * FROM traffic_readings
              WHERE reading_timestamp >= DATE_SUB(NOW(), INTERVAL 3 DAY)`,
        sqlNoIndex: `SELECT * FROM traffic_readings IGNORE INDEX (idx_traffic_timestamp)
              WHERE reading_timestamp >= DATE_SUB(NOW(), INTERVAL 3 DAY)`,
        indexUsed: 'idx_traffic_timestamp'
    },
    {
        id: 2,
        name: 'Composite Index Search (Severe TomTom Delays)',
        description: 'Multi-predicate filter pinpointing specific road segments experiencing "Severe" congestion levels based on Live TomTom metrics.',
        indexLevel: 2,
        sql: `SELECT * FROM traffic_readings
              WHERE road_id = 10 AND congestion_level = 'Severe'`,
        sqlNoIndex: `SELECT * FROM traffic_readings IGNORE INDEX (idx_traffic_road_congestion)
              WHERE road_id = 10 AND congestion_level = 'Severe'`,
        indexUsed: 'idx_traffic_road_congestion'
    },
    {
        id: 3,
        name: 'Covering Index Scan (Live Traffic Trends)',
        description: 'Query fully satisfied by idx_traffic_covering. Ideal for rendering real-time dashboard API requests without hitting physical disk.',
        indexLevel: 3,
        sql: `SELECT road_id, reading_timestamp, avg_speed_kmph, vehicle_count
              FROM traffic_readings
              WHERE road_id = 5
              ORDER BY reading_timestamp DESC
              LIMIT 100`,
        sqlNoIndex: `SELECT road_id, reading_timestamp, avg_speed_kmph, vehicle_count
              FROM traffic_readings IGNORE INDEX (idx_traffic_covering)
              WHERE road_id = 5
              ORDER BY reading_timestamp DESC
              LIMIT 100`,
        indexUsed: 'idx_traffic_covering'

    },
    {
        id: 5,
        name: 'TomTom Live Aggregation JOIN (Level 2)',
        description: 'Multi-table join aggregating realistic speeds dynamically pulled from the TomTom API maps across multiple cities.',
        indexLevel: 2,
        sql: `SELECT c.city_name, r.road_name,
                     COUNT(tr.reading_id) AS readings,
                     AVG(tr.avg_speed_kmph) AS avg_speed
              FROM cities c
              JOIN roads r ON r.city_id = c.city_id
              JOIN traffic_readings tr ON tr.road_id = r.road_id
              WHERE c.city_id = 1
              GROUP BY c.city_name, r.road_name
              ORDER BY avg_speed ASC`,
        sqlNoIndex: `SELECT c.city_name, r.road_name,
                     COUNT(tr.reading_id) AS readings,
                     AVG(tr.avg_speed_kmph) AS avg_speed
              FROM cities c
              JOIN roads r ON r.city_id = c.city_id
              JOIN traffic_readings tr IGNORE INDEX (idx_traffic_road_congestion, idx_traffic_road_timestamp, idx_traffic_covering) ON tr.road_id = r.road_id
              WHERE c.city_id = 1
              GROUP BY c.city_name, r.road_name
              ORDER BY avg_speed ASC`,
        indexUsed: 'idx_traffic_road_timestamp + idx_road_city'
    }
];

// ────────────────────────────────────────────────────
// GET /api/dbms/indexes — List all indexes
// ────────────────────────────────────────────────────
router.get('/indexes', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                TABLE_NAME AS table_name,
                INDEX_NAME AS index_name,
                NON_UNIQUE AS non_unique,
                SEQ_IN_INDEX AS seq,
                COLUMN_NAME AS column_name,
                CARDINALITY AS cardinality,
                INDEX_TYPE AS index_type,
                NULLABLE AS nullable
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = 'smart_traffic'
            ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
        `);

        // Group columns per index
        const indexMap = {};
        rows.forEach(r => {
            const key = `${r.table_name}.${r.index_name}`;
            if (!indexMap[key]) {
                indexMap[key] = {
                    table: r.table_name,
                    name: r.index_name,
                    type: r.index_type,
                    unique: !r.non_unique,
                    columns: [],
                    cardinality: r.cardinality
                };
            }
            indexMap[key].columns.push(r.column_name);
        });

        // Classify index level
        const indexes = Object.values(indexMap).map(idx => {
            let level;
            if (idx.name === 'PRIMARY') level = 'Primary (Clustered)';
            else if (idx.columns.length === 1) level = 'Level 1 — Single Column';
            else if (idx.name.includes('covering')) level = 'Level 3 — Covering';
            else level = 'Level 2 — Composite';

            return { ...idx, level };
        });

        res.json(indexes);
    } catch (err) { next(err); }
});



// ────────────────────────────────────────────────────
// GET /api/dbms/cost-estimation — Full cost comparison
// ────────────────────────────────────────────────────
router.get('/cost-estimation', async (req, res, next) => {
    try {
        // Get table stats for cost calculation
        const [[tableStats]] = await pool.query(`
            SELECT
                TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH,
                AVG_ROW_LENGTH
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = 'smart_traffic' AND TABLE_NAME = 'traffic_readings'
        `);

        const totalRows    = tableStats.TABLE_ROWS || 1;
        const dataLength   = tableStats.DATA_LENGTH || 1;
        const avgRowLength = tableStats.AVG_ROW_LENGTH || 100;
        const pageSize     = 16384; // InnoDB default: 16KB
        const totalPages   = Math.ceil(dataLength / pageSize);

        // Analyze each query
        const results = [];
        for (const query of QUERIES) {
            const [explainWith]    = await pool.query(`EXPLAIN FORMAT=TRADITIONAL ${query.sql}`);
            const [explainWithout] = await pool.query(`EXPLAIN FORMAT=TRADITIONAL ${query.sqlNoIndex}`);

            const rowsWith    = explainWith.reduce((sum, e) => sum + (e.rows || 0), 0);
            const rowsWithout = explainWithout.reduce((sum, e) => sum + (e.rows || 0), 0);

            // Selectivity = estimated rows / total rows
            const selectivityWith    = +(rowsWith / totalRows).toFixed(6);
            const selectivityWithout = +(rowsWithout / totalRows).toFixed(6);

            // I/O cost estimate (pages to read)
            const ioCostWith    = Math.ceil(rowsWith * avgRowLength / pageSize);
            const ioCostWithout = Math.ceil(rowsWithout * avgRowLength / pageSize);

            // CPU cost estimate (rows to process × cpu_tuple_cost)
            const cpuTupleCost = 0.01;
            const cpuCostWith    = +(rowsWith * cpuTupleCost).toFixed(4);
            const cpuCostWithout = +(rowsWithout * cpuTupleCost).toFixed(4);

            // Total cost
            const totalCostWith    = +(ioCostWith + cpuCostWith).toFixed(4);
            const totalCostWithout = +(ioCostWithout + cpuCostWithout).toFixed(4);

            // Improvement
            const improvement = totalCostWithout > 0
                ? +((1 - totalCostWith / totalCostWithout) * 100).toFixed(2)
                : 0;

            results.push({
                queryId:     query.id,
                queryName:   query.name,
                indexLevel:  query.indexLevel,
                indexUsed:   query.indexUsed,
                sql:         query.sql.trim(),
                explainWith: explainWith[0],
                explainWithout: explainWithout[0],
                metrics: {
                    totalRows,
                    totalPages,
                    pageSize,
                    avgRowLength,
                    rowsExaminedWith: rowsWith,
                    rowsExaminedWithout: rowsWithout,
                    selectivityWith,
                    selectivityWithout,
                    ioCostWith,
                    ioCostWithout,
                    cpuCostWith,
                    cpuCostWithout,
                    totalCostWith,
                    totalCostWithout,
                    improvementPct: improvement
                }
            });
        }

        res.json({
            tableStats: {
                tableName: 'traffic_readings',
                totalRows,
                dataLengthBytes: dataLength,
                indexLengthBytes: tableStats.INDEX_LENGTH,
                avgRowLength,
                totalPages,
                pageSize
            },
            queries: results
        });
    } catch (err) { next(err); }
});

// ────────────────────────────────────────────────────
// GET /api/dbms/index-stats — Index usage statistics
// ────────────────────────────────────────────────────
router.get('/index-stats', async (req, res, next) => {
    try {
        // Get cardinality and selectivity for each index
        const [indexes] = await pool.query(`
            SELECT
                s.TABLE_NAME AS table_name,
                s.INDEX_NAME AS index_name,
                GROUP_CONCAT(s.COLUMN_NAME ORDER BY s.SEQ_IN_INDEX) AS columns,
                MAX(s.CARDINALITY) AS cardinality,
                t.TABLE_ROWS AS total_rows,
                ROUND(MAX(s.CARDINALITY) / NULLIF(t.TABLE_ROWS, 0), 6) AS selectivity,
                s.INDEX_TYPE AS index_type
            FROM INFORMATION_SCHEMA.STATISTICS s
            JOIN INFORMATION_SCHEMA.TABLES t
                ON s.TABLE_SCHEMA = t.TABLE_SCHEMA AND s.TABLE_NAME = t.TABLE_NAME
            WHERE s.TABLE_SCHEMA = 'smart_traffic'
            GROUP BY s.TABLE_NAME, s.INDEX_NAME, t.TABLE_ROWS, s.INDEX_TYPE
            ORDER BY selectivity DESC
        `);

        res.json(indexes);
    } catch (err) { next(err); }
});

module.exports = router;
