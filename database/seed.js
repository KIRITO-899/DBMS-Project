// ============================================================
// Smart Traffic & Transport Database System
// Seed Script — Populates all 7 tables with realistic data
// Run:  npm run seed
// ============================================================

require('dotenv').config();
const mysql = require('mysql2/promise');
const path  = require('path');
const fs    = require('fs');
const { getLiveTrafficForCity, determineCongestion } = require('./fetchLiveTraffic');

// Re-use the same config as connection.js
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,           // <-- Sourced from .env
    database: process.env.DB_NAME || 'railway',
    multipleStatements: true,
    dateStrings: true
};

// ────────────────────────────────────────────────────
// Helper utilities
// ────────────────────────────────────────────────────
const pick   = arr => arr[Math.floor(Math.random() * arr.length)];
const rand   = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const randF  = (lo, hi, dec = 2) => +(Math.random() * (hi - lo) + lo).toFixed(dec);
const pad    = n => String(n).padStart(2, '0');

function randomDate(start, end) {
    const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function randomDatetime(start, end) {
    const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ────────────────────────────────────────────────────
// Data: Indian States & Union Territories
// ────────────────────────────────────────────────────
const STATES = [
    ['Andhra Pradesh','South'],['Arunachal Pradesh','Northeast'],['Assam','Northeast'],
    ['Bihar','East'],['Chhattisgarh','Central'],['Goa','West'],
    ['Gujarat','West'],['Haryana','North'],['Himachal Pradesh','North'],
    ['Jharkhand','East'],['Karnataka','South'],['Kerala','South'],
    ['Madhya Pradesh','Central'],['Maharashtra','West'],['Manipur','Northeast'],
    ['Meghalaya','Northeast'],['Mizoram','Northeast'],['Nagaland','Northeast'],
    ['Odisha','East'],['Punjab','North'],['Rajasthan','North'],
    ['Sikkim','Northeast'],['Tamil Nadu','South'],['Telangana','South'],
    ['Tripura','Northeast'],['Uttar Pradesh','North'],['Uttarakhand','North'],
    ['West Bengal','East'],
    // Union Territories
    ['Delhi','North'],['Chandigarh','North'],['Puducherry','South'],
    ['Jammu & Kashmir','North'],['Ladakh','North'],['Andaman & Nicobar','South'],
    ['Dadra & Nagar Haveli and Daman & Diu','West'],['Lakshadweep','South']
];

// ────────────────────────────────────────────────────
// Data: Major Indian Cities
// ────────────────────────────────────────────────────
const CITIES = [
    // [name, stateName, population, area_sq_km, is_metro]
    ['Mumbai','Maharashtra',20411000,603.4,true],
    ['Delhi','Delhi',19000000,1484,true],
    ['Bangalore','Karnataka',12765000,741,true],
    ['Hyderabad','Telangana',10269000,650,true],
    ['Ahmedabad','Gujarat',8059000,464,true],
    ['Chennai','Tamil Nadu',10971000,426,true],
    ['Kolkata','West Bengal',14850000,206.1,true],
    ['Pune','Maharashtra',7400000,331.3,true],
    ['Jaipur','Rajasthan',3900000,485,true],
    ['Lucknow','Uttar Pradesh',3600000,349,true],
    ['Kanpur','Uttar Pradesh',3100000,403.7,false],
    ['Nagpur','Maharashtra',2800000,228,false],
    ['Indore','Madhya Pradesh',2500000,530,false],
    ['Thane','Maharashtra',2400000,147,false],
    ['Bhopal','Madhya Pradesh',2300000,285.9,false],
    ['Visakhapatnam','Andhra Pradesh',2100000,681.96,false],
    ['Patna','Bihar',2400000,136.2,false],
    ['Vadodara','Gujarat',2100000,235,false],
    ['Ludhiana','Punjab',1900000,159.4,false],
    ['Agra','Uttar Pradesh',1800000,188.4,false],
    ['Nashik','Maharashtra',1700000,264.2,false],
    ['Ranchi','Jharkhand',1500000,175.1,false],
    ['Coimbatore','Tamil Nadu',1600000,257,false],
    ['Guwahati','Assam',1100000,328,false],
    ['Chandigarh','Chandigarh',1100000,114,false],
    ['Kochi','Kerala',2100000,94.88,false],
    ['Thiruvananthapuram','Kerala',950000,214.9,false],
    ['Bhubaneswar','Odisha',1100000,422,false],
    ['Dehradun','Uttarakhand',700000,308.2,false],
    ['Raipur','Chhattisgarh',1200000,226,false],
    ['Amritsar','Punjab',1200000,135,false],
    ['Varanasi','Uttar Pradesh',1400000,82,false],
    ['Surat','Gujarat',7500000,326.5,true],
    ['Jodhpur','Rajasthan',1300000,321,false],
    ['Mysuru','Karnataka',1100000,128.4,false],
    ['Goa','Goa',650000,3702,false],
    ['Shimla','Himachal Pradesh',220000,35.3,false],
    ['Imphal','Manipur',500000,35,false],
    ['Shillong','Meghalaya',400000,64.4,false],
    ['Aizawl','Mizoram',400000,457,false],
    ['Gangtok','Sikkim',100000,19.2,false],
    ['Agartala','Tripura',500000,76.5,false],
    ['Kohima','Nagaland',120000,30,false],
    ['Itanagar','Arunachal Pradesh',70000,128,false],
    ['Vijayawada','Andhra Pradesh',1100000,61.9,false],
    ['Madurai','Tamil Nadu',1500000,147.97,false],
    ['Jabalpur','Madhya Pradesh',1200000,367,false],
    ['Aurangabad','Maharashtra',1400000,139,false],
    ['Rajkot','Gujarat',1600000,170.1,false],
    ['Meerut','Uttar Pradesh',1500000,141.9,false]
];

// ────────────────────────────────────────────────────
// Data: Road name templates & types
// ────────────────────────────────────────────────────
const ROAD_PREFIXES = [
    'NH-44','NH-48','NH-8','NH-2','NH-7','NH-6','NH-17','NH-1','NH-5','NH-3',
    'SH-12','SH-45','SH-17','SH-3','SH-8','SH-22','SH-150','SH-76',
    'Ring Road','Outer Ring Road','Inner Ring Road','Bypass Road',
    'MG Road','GT Road','Marine Drive','Link Road','Service Road',
    'Old Airport Road','New Airport Road','Highway Connector',
    'Eastern Express','Western Express','Central Avenue',
    'Lal Bahadur Shastri Marg','Jawaharlal Nehru Marg','Rajiv Gandhi Salai',
    'Anna Salai','Mount Road','Poonamallee High Road',
    'FC Road','JM Road','University Road','Canal Road','Mall Road',
    'Station Road','Industrial Road','IT Corridor','Tech Park Road'
];

const ROAD_TYPES   = ['NH','SH','Urban','Arterial','Expressway'];
const WEATHERS     = ['Clear','Rain','Fog','Storm'];
const CONGESTIONS  = ['Low','Moderate','High','Severe'];
const TIMES_OF_DAY = ['Morning','Afternoon','Evening','Night'];
const VEHICLE_TYPES = ['Car','Bus','Truck','Two-Wheeler','Auto','Taxi','Emergency'];




// ────────────────────────────────────────────────────
// Main Seed Function
// ────────────────────────────────────────────────────
async function seed() {
    console.log('\n🚦  Smart Traffic & Transport — Database Seeder');
    console.log('━'.repeat(55));

    // --- Connect without database first, run schema ---
    let conn = await mysql.createConnection({ ...DB_CONFIG });

    console.log('📄  Running schema.sql ...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await conn.query(schemaSQL);
    console.log('   ✅  Schema created.\n');

    // --- Now connect to the database ---
    await conn.changeUser({ database: process.env.DB_NAME || 'railway' });

    // ─── 1. States ──────────────────────────────────
    console.log('🏛️   Seeding states ...');
    const stateValues = STATES.map(([n,r]) => `('${n}','${r}')`).join(',\n       ');
    await conn.query(`INSERT INTO states (state_name, region) VALUES ${stateValues}`);
    const [stateRows] = await conn.query('SELECT state_id, state_name FROM states');
    const stateMap = {};
    stateRows.forEach(r => stateMap[r.state_name] = r.state_id);
    console.log(`   ✅  ${stateRows.length} states inserted.`);

    // ─── 2. Cities ──────────────────────────────────
    console.log('🏙️   Seeding cities ...');
    const cityInserts = CITIES.map(([name,state,pop,area,metro]) =>
        `('${name}', ${stateMap[state]}, ${pop}, ${area}, ${metro ? 1 : 0})`
    );
    await conn.query(`INSERT INTO cities (city_name, state_id, population, area_sq_km, is_metro) VALUES ${cityInserts.join(',\n       ')}`);
    const [cityRows] = await conn.query('SELECT city_id, city_name FROM cities');
    const cityMap = {};
    cityRows.forEach(r => cityMap[r.city_name] = r.city_id);
    const cityIds = cityRows.map(r => r.city_id);
    console.log(`   ✅  ${cityRows.length} cities inserted.`);

    // ─── 3. Roads ───────────────────────────────────
    console.log('🛣️   Seeding roads ...');
    const roads = [];
    // Ensure every city gets at least 3 roads
    for (const cid of cityIds) {
        const count = rand(3, 7);
        const usedNames = new Set();
        for (let i = 0; i < count; i++) {
            let rname;
            do { rname = pick(ROAD_PREFIXES); } while (usedNames.has(rname));
            usedNames.add(rname);
            const rtype = rname.startsWith('NH') ? 'NH' : rname.startsWith('SH') ? 'SH' :
                          rname.includes('Express') ? 'Expressway' : pick(['Urban','Arterial']);
            const length = rtype === 'NH' ? randF(50,400) : rtype === 'SH' ? randF(20,150) :
                           rtype === 'Expressway' ? randF(30,200) : randF(2,25);
            const lanes  = rtype === 'Expressway' ? pick([6,8]) : rtype === 'NH' ? pick([4,6]) : pick([2,4]);
            const speed  = rtype === 'Expressway' ? 120 : rtype === 'NH' ? 100 : rtype === 'SH' ? 80 : pick([40,50,60]);
            roads.push(`('${rname}', ${cid}, '${rtype}', ${length}, ${lanes}, ${speed})`);
        }
    }
    await conn.query(`INSERT INTO roads (road_name, city_id, road_type, length_km, lanes, speed_limit_kmph) VALUES ${roads.join(',\n       ')}`);
    const [roadRows] = await conn.query('SELECT road_id, road_name, city_id, road_type, speed_limit_kmph FROM roads');
    const roadIds = roadRows.map(r => r.road_id);
    console.log(`   ✅  ${roadRows.length} roads inserted.`);

    // ─── 4. Traffic Readings ────────────────────────
    console.log('📊  Seeding traffic readings (this may take a moment) ...');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const trafficBatch = [];
    const BATCH_SIZE = 500;
    let totalReadings = 0;

    // Identify metro cities for congestion weighting
    // India's most congested metros based on TomTom Traffic Index & MoRTH data
    const METRO_CONGESTION_WEIGHTS = {
        'Mumbai': 0.85, 'Delhi': 0.82, 'Bangalore': 0.80, 'Kolkata': 0.78,
        'Chennai': 0.77, 'Hyderabad': 0.75, 'Pune': 0.72, 'Ahmedabad': 0.68,
        'Surat': 0.65, 'Jaipur': 0.63, 'Lucknow': 0.60
    };

    for (const road of roadRows) {
        // Map road's city to fetch live baseline
        const cityName = cityRows.find(c => c.city_id === road.city_id)?.city_name;
        const isMetroCity = CITIES.find(c => c[0] === cityName)?.[4] || false;
        const metroCongestionWeight = METRO_CONGESTION_WEIGHTS[cityName] || 0;
        let liveBaseline = null;
        if (cityName) {
            liveBaseline = await getLiveTrafficForCity(cityName);
        }

        // Generate 30-80 readings per road depending on road type
        // Metro cities get MORE readings to reflect higher data density
        const readingsCount = isMetroCity ? rand(60, 100) :
                              road.road_type === 'NH' ? rand(50,80) :
                              road.road_type === 'Expressway' ? rand(40,70) : rand(30,50);

        for (let i = 0; i < readingsCount; i++) {
            const isLatest = (i === readingsCount - 1);
            const ts = isLatest ? randomDatetime(new Date(now.getTime() - 1000 * 60 * 5), now) : randomDatetime(thirtyDaysAgo, now);
            const hour = parseInt(ts.split(' ')[1].split(':')[0]);

            let congestion, vcount, avgSpeed;

            if (liveBaseline && isLatest) {
                // LIVE API INJECTION: The exact current metrics for this road
                avgSpeed = liveBaseline.currentSpeed;
                congestion = determineCongestion(liveBaseline.currentSpeed, liveBaseline.freeFlowSpeed);
                vcount = congestion === 'Severe' ? rand(1500,2500) : congestion === 'Low' ? rand(100,400) : rand(500,1200);
            } else if (liveBaseline) {
                // BACKFILL: Mathematically synthesize historical data from the live baseline
                // Metro cities get more aggressive congestion (lower speeds) during peak hours
                const peakMultiplier = metroCongestionWeight > 0.7 ? randF(0.15, 0.45) : randF(0.4, 0.7);
                const midMultiplier  = metroCongestionWeight > 0.7 ? randF(0.5, 0.75) : randF(0.8, 1.1);
                const offMultiplier  = metroCongestionWeight > 0.7 ? randF(0.8, 1.2) : randF(1.2, 1.6);
                
                const timeMultiplier = ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) ? peakMultiplier : 
                                       ((hour >= 21 || hour <= 5)) ? offMultiplier : midMultiplier;
                
                avgSpeed = Math.min(liveBaseline.freeFlowSpeed, Math.max(5, liveBaseline.freeFlowSpeed * timeMultiplier));
                congestion = determineCongestion(avgSpeed, liveBaseline.freeFlowSpeed);
                vcount = congestion === 'Severe' ? rand(1500,2500) : congestion === 'Low' ? rand(100,400) : rand(500,1200);

                // Metro boost: upgrade "Low" congestion to at least "Moderate" for metros during non-night hours
                if (isMetroCity && congestion === 'Low' && hour >= 6 && hour <= 22) {
                    congestion = Math.random() < metroCongestionWeight ? 'Moderate' : 'Low';
                    avgSpeed = Math.min(avgSpeed, randF(25, 40));
                }
            } else {
                // FALLBACK: Standard simulation — metros get heavier congestion
                if (isMetroCity) {
                    // Metro fallback: heavy congestion bias reflecting real Indian metro traffic
                    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
                        congestion = pick(['Severe','Severe','High','High','High','Moderate']);
                        vcount = rand(1200, 2500);
                        avgSpeed = randF(5, 22);
                    } else if (hour >= 11 && hour <= 16) {
                        congestion = pick(['High','High','Moderate','Moderate','Severe']);
                        vcount = rand(600, 1800);
                        avgSpeed = randF(15, 40);
                    } else if (hour >= 21 || hour <= 5) {
                        congestion = pick(['Low','Moderate','Moderate','Low']);
                        vcount = rand(100, 600);
                        avgSpeed = randF(35, road.speed_limit_kmph);
                    } else {
                        congestion = pick(['High','Moderate','High','Severe','Moderate']);
                        vcount = rand(500, 1500);
                        avgSpeed = randF(12, 35);
                    }
                } else {
                    // Non-metro fallback: original logic
                    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
                        congestion = pick(['High','Severe','Moderate','High']);
                        vcount = rand(800, 2500);
                        avgSpeed = randF(8, 35);
                    } else if (hour >= 11 && hour <= 16) {
                        congestion = pick(['Moderate','Low','Moderate','High']);
                        vcount = rand(300, 1200);
                        avgSpeed = randF(25, 65);
                    } else if (hour >= 21 || hour <= 5) {
                        congestion = pick(['Low','Low','Low','Moderate']);
                        vcount = rand(50, 400);
                        // Clamp range so lo <= hi for low-speed-limit urban roads
                        const offSpeedLo = Math.min(45, road.speed_limit_kmph);
                        avgSpeed = randF(offSpeedLo, road.speed_limit_kmph);
                    } else {
                        congestion = pick(CONGESTIONS);
                        vcount = rand(200, 1000);
                        avgSpeed = randF(20, 55);
                    }
                }
            }

            // Single random draw for correct weather distribution:
            // Clear 70% | Rain 15% | Fog 10% | Storm 5%
            const wRoll = Math.random();
            const weather = wRoll < 0.70 ? 'Clear' :
                            wRoll < 0.85 ? 'Rain' :
                            wRoll < 0.95 ? 'Fog' : 'Storm';

            // Bad weather slows things down slightly if it's currently clear in the baseline
            if (weather !== 'Clear' && (!liveBaseline || !isLatest)) {
                avgSpeed = Math.max(5, avgSpeed * 0.7);
                if (congestion === 'Low') congestion = 'Moderate';
            }

            // Final metro safety net: ensure metros never have too much "Low" congestion during daytime
            if (isMetroCity && congestion === 'Low' && hour >= 7 && hour <= 21 && Math.random() < metroCongestionWeight) {
                congestion = 'Moderate';
                avgSpeed = Math.min(avgSpeed, randF(20, 38));
            }

            trafficBatch.push(`(${road.road_id}, '${ts}', ${vcount}, ${avgSpeed.toFixed(2)}, '${congestion}', '${weather}')`);
            totalReadings++;

            if (trafficBatch.length >= BATCH_SIZE) {
                await conn.query(`INSERT INTO traffic_readings (road_id, reading_timestamp, vehicle_count, avg_speed_kmph, congestion_level, weather) VALUES ${trafficBatch.join(',')}`);
                trafficBatch.length = 0;
            }
        }
    }
    if (trafficBatch.length > 0) {
        await conn.query(`INSERT INTO traffic_readings (road_id, reading_timestamp, vehicle_count, avg_speed_kmph, congestion_level, weather) VALUES ${trafficBatch.join(',')}`);
    }
    console.log(`   ✅  ${totalReadings} traffic readings inserted.`);



    // ─── 6. Vehicles ────────────────────────────────
    console.log('🚗  Seeding vehicles ...');
    const vehicleBatch = [];
    const stateIds = Object.values(stateMap);

    for (let i = 0; i < 5000; i++) {
        const vtype = pick(VEHICLE_TYPES);
        const regState = pick(stateIds);
        const regYear  = rand(2005, 2026);
        vehicleBatch.push(`('${vtype}', ${regState}, ${regYear})`);
    }
    // Insert in chunks
    for (let i = 0; i < vehicleBatch.length; i += BATCH_SIZE) {
        const chunk = vehicleBatch.slice(i, i + BATCH_SIZE);
        await conn.query(`INSERT INTO vehicles (vehicle_type, registration_state, registration_year) VALUES ${chunk.join(',')}`);
    }
    console.log(`   ✅  ${vehicleBatch.length} vehicles inserted.`);



    // ─── Run views from procedures.sql ──────────────
    const procPath = path.join(__dirname, 'procedures.sql');
    if (fs.existsSync(procPath)) {
        console.log('\n📄  Running procedures.sql (views) ...');
        const procSQL = fs.readFileSync(procPath, 'utf8');
        await conn.query(procSQL);
        console.log('   ✅  Views created.');
    }

    // ─── Create stored procedures individually ──────
    console.log('📦  Creating stored procedures ...');

    await conn.query('DROP PROCEDURE IF EXISTS sp_congestion_report');
    await conn.query(`
        CREATE PROCEDURE sp_congestion_report(
            IN p_city_id INT,
            IN p_date_from DATE,
            IN p_date_to DATE
        )
        BEGIN
            SELECT
                r.road_name, r.road_type,
                COUNT(tr.reading_id) AS readings,
                ROUND(AVG(tr.vehicle_count), 0) AS avg_vehicles,
                ROUND(AVG(tr.avg_speed_kmph), 2) AS avg_speed,
                SUM(CASE WHEN tr.congestion_level = 'Severe' THEN 1 ELSE 0 END) AS severe,
                SUM(CASE WHEN tr.congestion_level = 'High' THEN 1 ELSE 0 END) AS high,
                SUM(CASE WHEN tr.congestion_level = 'Moderate' THEN 1 ELSE 0 END) AS moderate,
                SUM(CASE WHEN tr.congestion_level = 'Low' THEN 1 ELSE 0 END) AS low
            FROM roads r
            LEFT JOIN traffic_readings tr
                ON tr.road_id = r.road_id
                AND tr.reading_timestamp BETWEEN p_date_from AND p_date_to
            WHERE r.city_id = p_city_id
            GROUP BY r.road_id, r.road_name, r.road_type
            ORDER BY severe DESC, high DESC;
        END
    `);


    await conn.query('DROP PROCEDURE IF EXISTS sp_traffic_trend');
    await conn.query(`
        CREATE PROCEDURE sp_traffic_trend(
            IN p_road_id INT,
            IN p_days INT
        )
        BEGIN
            SELECT
                DATE(reading_timestamp) AS reading_date,
                HOUR(reading_timestamp) AS reading_hour,
                ROUND(AVG(vehicle_count), 0) AS avg_vehicles,
                ROUND(AVG(avg_speed_kmph), 2) AS avg_speed,
                GROUP_CONCAT(DISTINCT congestion_level) AS congestion_levels
            FROM traffic_readings
            WHERE road_id = p_road_id
              AND reading_timestamp >= DATE_SUB(NOW(), INTERVAL p_days DAY)
            GROUP BY reading_date, reading_hour
            ORDER BY reading_date, reading_hour;
        END
    `);

    console.log('   ✅  2 stored procedures created.');

    // ─── Summary ────────────────────────────────────
    console.log('\n' + '━'.repeat(55));
    console.log('✅  SEED COMPLETE — Summary:');
    const tables = ['states','cities','roads','traffic_readings','vehicles'];
    for (const t of tables) {
        const [[{cnt}]] = await conn.query(`SELECT COUNT(*) AS cnt FROM ${t}`);
        console.log(`   📋  ${t.padEnd(22)} ${String(cnt).padStart(7)} rows`);
    }
    console.log('━'.repeat(55) + '\n');

    await conn.end();
    process.exit(0);
}

seed().catch(err => {
    console.error('\n❌  Seed failed:', err.message);
    console.error(err);
    process.exit(1);
});
