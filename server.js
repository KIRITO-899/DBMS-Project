// ============================================================
// Smart Traffic & Transport Database System
// Express Server
// ============================================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const mysql   = require('mysql2/promise');
const { getLiveTrafficForCity, determineCongestion, CITY_COORDS } = require('./database/fetchLiveTraffic');
const { getLiveIncidentsForCity } = require('./database/fetchLiveIncidents');

// Load environment variables for the server and database
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ─────────────────────────────
app.use('/api/traffic',   require('./routes/traffic'));
app.use('/api/accidents', require('./routes/accidents'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/dbms',      require('./routes/dbms'));
app.use('/api/system',    require('./routes/system'));

// ─── SPA Fallback ───────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Error Handler ──────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.message);
    res.status(500).json({ error: err.message });
});

// ─── Start & Background Polling ───────────────
app.listen(PORT, async () => {
    console.log(`\n🚦  Smart Traffic Server running on http://localhost:${PORT}\n`);
    
    // Set up database pool for background polling
    const pool = require('./database/connection');
    
    // Background polling every 15 minutes (900000 ms)
    setInterval(async () => {
        try {
            console.log('📡 [TomTom Polling] Fetching latest live traffic for top cities...');
            // Fetch top cities that exist in DB
            const [cities] = await pool.query(`SELECT city_id, city_name FROM cities WHERE city_name IN ('Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai')`);
            if (cities.length === 0) return;

            let inserts = 0;
            for (const city of cities) {
                const liveData = await getLiveTrafficForCity(city.city_name);
                if (liveData) {
                    // Pick a random road from this city to update
                    const [roads] = await pool.query(`SELECT road_id FROM roads WHERE city_id = ? ORDER BY RAND() LIMIT 1`, [city.city_id]);
                    if (roads.length > 0) {
                        const roadId = roads[0].road_id;
                        const congestion = determineCongestion(liveData.currentSpeed, liveData.freeFlowSpeed);
                        const vcount = congestion === 'Severe' ? Math.floor(Math.random()*(2500-1500+1))+1500 : Math.floor(Math.random()*(800-200+1))+200;
                        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
                        
                        await pool.query(
                            `INSERT INTO traffic_readings (road_id, reading_timestamp, vehicle_count, avg_speed_kmph, congestion_level, weather) VALUES (?, ?, ?, ?, ?, ?)`,
                            [roadId, now, vcount, liveData.currentSpeed.toFixed(2), congestion, 'Clear']
                        );
                        inserts++;
                    }
                }
            }
            if (inserts > 0) {
                console.log(`✅ [TomTom Polling] Inserted ${inserts} live traffic readings into DB.`);
            }
        } catch (e) {
            console.error('❌ [TomTom Polling] Error:', e.message);
        }
    }, 900000);

    // Background polling every 30 minutes (1800000 ms) for Live Incidents
    const pollIncidents = async () => {
        try {
            console.log('📡 [TomTom Incidents] Fetching live crash & hazard data...');
            const [cities] = await pool.query(`SELECT city_id, city_name FROM cities WHERE city_name IN ('Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad')`);
            if (cities.length === 0) return;

            let inserts = 0;
            const now = new Date().toISOString().slice(0, 10); // current date YYYY-MM-DD

            for (const city of cities) {
                const liveIncidents = await getLiveIncidentsForCity(city.city_name);
                if (liveIncidents && liveIncidents.length > 0) {
                    
                    for (const inc of liveIncidents) {
                        // Pick a random road from this city to anchor the incident (since TomTom road ID doesn't directly map to our DB IDs)
                        const [roads] = await pool.query(`SELECT road_id FROM roads WHERE city_id = ? ORDER BY RAND() LIMIT 1`, [city.city_id]);
                        if (roads.length > 0) {
                            const roadId = roads[0].road_id;
                            
                            // Insert live incident
                            await pool.query(
                                `INSERT INTO accidents (road_id, accident_date, time_of_day, severity, vehicles_involved, casualties, cause, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                [roadId, now, inc.timeOfDay, inc.severity, inc.vehiclesInvolved, 0, inc.causePrefix, inc.description]
                            );
                            inserts++;
                        }
                    }
                }
            }
            if (inserts > 0) {
                console.log(`🚨 [TomTom Incidents] Inserted ${inserts} live accidents/hazards into DB.`);
            }
        } catch (e) {
            console.error('❌ [TomTom Incidents] Error:', e.message);
        }
    };
    
    // Call immediately and then set interval
    pollIncidents();
    setInterval(pollIncidents, 1800000);
});
