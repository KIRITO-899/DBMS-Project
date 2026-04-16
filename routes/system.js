const express = require('express');
const router = express.Router();
const pool = require('../database/connection');

router.get('/status', async (req, res) => {
    try {
        // Ping database
        const [rows] = await pool.query('SELECT DATABASE() as dbName');
        
        // Let's get an estimate of records for settings view
        const [counts] = await pool.query(`
            SELECT SUM(TABLE_ROWS) as total_records 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
        `);
        
        res.json({
            database: {
                status: 'Connected',
                name: rows.length > 0 ? rows[0].dbName : 'Unknown',
                total_records: counts.length > 0 ? counts[0].total_records : 0
            },
            api: {
                tomtom: process.env.TOMTOM_API_KEY ? 'Active' : 'Not Configured'
            },
            server: {
                uptime: Math.floor(process.uptime()),
                nodeVersion: process.version
            }
        });
    } catch (error) {
        console.error('System status error:', error);
        res.status(500).json({ error: 'Failed to retrieve system status' });
    }
});

module.exports = router;
