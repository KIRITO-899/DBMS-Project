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
const SEVERITIES   = ['Minor','Major','Fatal'];
const VEHICLE_TYPES = ['Car','Bus','Truck','Two-Wheeler','Auto','Taxi','Emergency'];
const TRANSPORT_TYPES = ['Bus','Metro','Tram','Ferry'];

// ────────────────────────────────────────────────────
// Weighted accident causes — MoRTH India data (2022-2024)
// Source: Ministry of Road Transport & Highways annual reports
// Weight = approximate % contribution to total accidents
// ────────────────────────────────────────────────────
const WEIGHTED_CAUSES = [
    { cause: 'Over-speeding',                weight: 28 },
    { cause: 'Dangerous/Negligent driving',  weight: 18 },
    { cause: 'Driving on wrong side',        weight: 8  },
    { cause: 'Drunk driving',                weight: 6  },
    { cause: 'Red light / signal jumping',   weight: 5  },
    { cause: 'Distracted driving (mobile)',  weight: 5  },
    { cause: 'Overtaking error',             weight: 5  },
    { cause: 'Poor road conditions',         weight: 4  },
    { cause: 'Pedestrian fault',             weight: 4  },
    { cause: 'Tire burst',                   weight: 3  },
    { cause: 'Fog / Low visibility',         weight: 3  },
    { cause: 'Brake failure',                weight: 2  },
    { cause: 'Overloaded vehicle',           weight: 2  },
    { cause: 'Stray animals on road',        weight: 2  },
    { cause: 'Waterlogging / Rain',          weight: 2  },
    { cause: 'Vehicle malfunction',          weight: 1  },
    { cause: 'U-turn violation',             weight: 1  },
    { cause: 'Construction zone hazard',     weight: 1  },
];

// Build a weighted pick array for causes
const CAUSE_POOL = [];
WEIGHTED_CAUSES.forEach(c => { for (let i = 0; i < c.weight; i++) CAUSE_POOL.push(c.cause); });

// ────────────────────────────────────────────────────
// Weighted state accident distribution — MoRTH 2023
// Higher-accident states are weighted to receive more records
// ────────────────────────────────────────────────────
const STATE_ACCIDENT_WEIGHTS = {
    'Tamil Nadu': 12, 'Madhya Pradesh': 10, 'Uttar Pradesh': 10,
    'Karnataka': 9,   'Maharashtra': 9,     'Rajasthan': 8,
    'Andhra Pradesh': 7, 'Telangana': 6,    'Gujarat': 6,
    'Kerala': 5,       'West Bengal': 4,     'Punjab': 4,
    'Haryana': 4,      'Bihar': 3,           'Chhattisgarh': 3,
    'Odisha': 3,       'Jharkhand': 2,       'Assam': 2,
    'Delhi': 4,        'Uttarakhand': 2,     'Goa': 1,
    'Himachal Pradesh': 1, 'Jammu & Kashmir': 1,
};

// Time-of-day weighting based on MoRTH data
// Evening/Night are most dangerous (60%+ of fatalities)
const TIME_WEIGHTS = [
    { time: 'Morning',   weight: 22 },   // 6 AM – 12 PM
    { time: 'Afternoon', weight: 18 },   // 12 PM – 4 PM
    { time: 'Evening',   weight: 35 },   // 4 PM – 9 PM  (peak danger)
    { time: 'Night',     weight: 25 },   // 9 PM – 6 AM
];
const TIME_POOL = [];
TIME_WEIGHTS.forEach(t => { for (let i = 0; i < t.weight; i++) TIME_POOL.push(t.time); });

// ────────────────────────────────────────────────────
// Real Indian Public Transport data
// Sources: DMRC, BMRCL, CMRL, HMRL, NMMC, BEST, DTC, KSRTC, MTC reports
// ────────────────────────────────────────────────────
const REAL_TRANSPORT = [
    // Delhi Metro — DMRC (daily ~5.7 million)
    { city: 'Delhi', type: 'Metro', name: 'DMRC Yellow Line (Samaypur Badli–HUDA City Centre)', stops: 37, ridership: 820000, freq: 3 },
    { city: 'Delhi', type: 'Metro', name: 'DMRC Blue Line (Dwarka Sector 21–Noida Electronic City)', stops: 50, ridership: 1050000, freq: 3 },
    { city: 'Delhi', type: 'Metro', name: 'DMRC Red Line (Rithala–Shaheed Sthal)', stops: 29, ridership: 480000, freq: 4 },
    { city: 'Delhi', type: 'Metro', name: 'DMRC Green Line (Mundka–Brigadier Hoshiar Singh)', stops: 21, ridership: 310000, freq: 5 },
    { city: 'Delhi', type: 'Metro', name: 'DMRC Violet Line (Kashmere Gate–Raja Nahar Singh)', stops: 34, ridership: 520000, freq: 4 },
    { city: 'Delhi', type: 'Metro', name: 'DMRC Magenta Line (Janakpuri West–Botanical Garden)', stops: 25, ridership: 380000, freq: 5 },
    { city: 'Delhi', type: 'Metro', name: 'DMRC Pink Line (Majlis Park–Shiv Vihar)', stops: 38, ridership: 290000, freq: 5 },
    { city: 'Delhi', type: 'Bus',   name: 'DTC Bus Route 604 (ISBT–Badarpur)', stops: 32, ridership: 45000, freq: 8 },
    { city: 'Delhi', type: 'Bus',   name: 'DTC Bus Route 473 (Dwarka–Connaught Place)', stops: 28, ridership: 38000, freq: 10 },
    { city: 'Delhi', type: 'Bus',   name: 'DTC Cluster Bus AC-785 (Mehrauli–Kashmere Gate)', stops: 24, ridership: 22000, freq: 12 },

    // Mumbai Metro & Suburban Railway (Local trains form the backbone)
    { city: 'Mumbai', type: 'Metro', name: 'Mumbai Local: Western Line (Churchgate–Dahanu)', stops: 37, ridership: 3500000, freq: 3 },
    { city: 'Mumbai', type: 'Metro', name: 'Mumbai Local: Central Line (CSMT–Kalyan/Kasara)', stops: 62, ridership: 3300000, freq: 3 },
    { city: 'Mumbai', type: 'Metro', name: 'Mumbai Local: Harbour Line (CSMT–Panvel)', stops: 24, ridership: 1200000, freq: 4 },
    { city: 'Mumbai', type: 'Metro', name: 'Mumbai Metro Line 1 (Versova–Ghatkopar)', stops: 12, ridership: 420000, freq: 4 },
    { city: 'Mumbai', type: 'Metro', name: 'Mumbai Metro Line 2A (Dahisar–D.N. Nagar)', stops: 17, ridership: 185000, freq: 6 },
    { city: 'Mumbai', type: 'Metro', name: 'Mumbai Metro Line 7 (Dahisar E–Andheri E)', stops: 13, ridership: 160000, freq: 6 },
    { city: 'Mumbai', type: 'Bus',   name: 'BEST Bus 1 (Colaba–CSMT)', stops: 18, ridership: 55000, freq: 5 },
    { city: 'Mumbai', type: 'Bus',   name: 'BEST Bus 83 (Dharavi–Bandra)', stops: 22, ridership: 42000, freq: 8 },
    { city: 'Mumbai', type: 'Bus',   name: 'BEST AC Bus A-36 (BKC–Powai)', stops: 16, ridership: 18000, freq: 12 },
    { city: 'Mumbai', type: 'Ferry', name: 'Mumbai Ferry (Gateway of India–Alibaug)', stops: 2, ridership: 8500, freq: 30 },
    { city: 'Mumbai', type: 'Ferry', name: 'Mumbai Ferry (Mandwa–Gateway)', stops: 2, ridership: 6200, freq: 45 },

    // Bangalore — Namma Metro (daily ~700K)
    { city: 'Bangalore', type: 'Metro', name: 'Namma Metro Purple Line (Whitefield–Kengeri)', stops: 35, ridership: 420000, freq: 4 },
    { city: 'Bangalore', type: 'Metro', name: 'Namma Metro Green Line (Nagasandra–Silk Institute)', stops: 30, ridership: 280000, freq: 5 },
    { city: 'Bangalore', type: 'Bus',   name: 'BMTC Volvo 335E (Majestic–Electronic City)', stops: 18, ridership: 35000, freq: 10 },
    { city: 'Bangalore', type: 'Bus',   name: 'BMTC KBS-8 (Kempegowda–Banashankari)', stops: 24, ridership: 28000, freq: 8 },
    { city: 'Bangalore', type: 'Bus',   name: 'BMTC 401K (Majestic–ITPL)', stops: 20, ridership: 22000, freq: 12 },

    // Hyderabad Metro (daily ~450K)
    { city: 'Hyderabad', type: 'Metro', name: 'Hyderabad Metro Red Line (Miyapur–L.B. Nagar)', stops: 29, ridership: 210000, freq: 5 },
    { city: 'Hyderabad', type: 'Metro', name: 'Hyderabad Metro Blue Line (Nagole–Raidurg)', stops: 24, ridership: 155000, freq: 5 },
    { city: 'Hyderabad', type: 'Metro', name: 'Hyderabad Metro Green Line (JBS–MGBS)', stops: 8, ridership: 85000, freq: 7 },
    { city: 'Hyderabad', type: 'Bus',   name: 'TSRTC City Bus 10K (Secunderabad–Mehdipatnam)', stops: 26, ridership: 32000, freq: 10 },
    { city: 'Hyderabad', type: 'Bus',   name: 'TSRTC Metro Luxury 300 (Uppal–Hi-Tech City)', stops: 14, ridership: 18000, freq: 15 },

    // Chennai Metro & Suburban Railway
    { city: 'Chennai', type: 'Metro', name: 'Chennai Suburban: South Line (Beach–Tambaram)', stops: 18, ridership: 550000, freq: 5 },
    { city: 'Chennai', type: 'Metro', name: 'Chennai Suburban: North Line (MMC–Gummidipoondi)', stops: 21, ridership: 320000, freq: 8 },
    { city: 'Chennai', type: 'Metro', name: 'Chennai Suburban: West Line (MMC–Arakkonam)', stops: 27, ridership: 410000, freq: 6 },
    { city: 'Chennai', type: 'Metro', name: 'Chennai Metro Blue Line (Wimco Nagar–Airport)', stops: 32, ridership: 95000, freq: 6 },
    { city: 'Chennai', type: 'Metro', name: 'Chennai Metro Green Line (CMBT–St. Thomas Mount)', stops: 14, ridership: 45000, freq: 8 },
    { city: 'Chennai', type: 'Bus',   name: 'MTC Bus 27C (Broadway–Tambaram)', stops: 30, ridership: 48000, freq: 6 },
    { city: 'Chennai', type: 'Bus',   name: 'MTC Bus 21G (CMBT–Thiruvanmiyur)', stops: 28, ridership: 42000, freq: 8 },
    { city: 'Chennai', type: 'Bus',   name: 'MTC Volvo S70 (Adyar–Airport)', stops: 12, ridership: 15000, freq: 15 },

    // Kolkata Metro, Tram, & Suburban
    { city: 'Kolkata', type: 'Metro', name: 'Kolkata Suburban (Sealdah South Section)', stops: 29, ridership: 1100000, freq: 5 },
    { city: 'Kolkata', type: 'Metro', name: 'Kolkata Suburban (Howrah Section)', stops: 40, ridership: 950000, freq: 5 },
    { city: 'Kolkata', type: 'Metro', name: 'Kolkata Metro Blue Line (Dakshineswar–Kavi Subhash)', stops: 24, ridership: 650000, freq: 5 },
    { city: 'Kolkata', type: 'Metro', name: 'Kolkata Metro Green Line (Sector V–Howrah Maidan)', stops: 12, ridership: 85000, freq: 8 },
    { city: 'Kolkata', type: 'Tram',  name: 'Kolkata Tram Route 5 (Esplanade–Tollygunge)', stops: 14, ridership: 3200, freq: 12 },
    { city: 'Kolkata', type: 'Tram',  name: 'Kolkata Tram Route 25 (Esplanade–Rajabazar)', stops: 10, ridership: 2100, freq: 15 },
    { city: 'Kolkata', type: 'Tram',  name: 'Kolkata Tram Route 36 (Gariahat–BBD Bagh)', stops: 12, ridership: 1800, freq: 18 },
    { city: 'Kolkata', type: 'Bus',   name: 'WBTC Bus S-12 (Howrah–Salt Lake)', stops: 22, ridership: 28000, freq: 10 },

    // Pune
    { city: 'Pune', type: 'Metro', name: 'Pune Metro Purple Line (PCMC–Swargate)', stops: 15, ridership: 120000, freq: 6 },
    { city: 'Pune', type: 'Metro', name: 'Pune Metro Aqua Line (Vanaz–Ramwadi)', stops: 16, ridership: 95000, freq: 7 },
    { city: 'Pune', type: 'Bus',   name: 'PMPML Bus 155 (Swargate–Hinjewadi IT Park)', stops: 22, ridership: 32000, freq: 10 },
    { city: 'Pune', type: 'Bus',   name: 'PMPML Rainbow BRT (Katraj–Nigdi)', stops: 18, ridership: 25000, freq: 8 },

    // Ahmedabad
    { city: 'Ahmedabad', type: 'Metro', name: 'Ahmedabad Metro Blue Line (Thaltej–Vastral)', stops: 20, ridership: 55000, freq: 8 },
    { city: 'Ahmedabad', type: 'Bus',   name: 'AMTS Bus Route 12 (Lal Darwaja–SG Highway)', stops: 18, ridership: 22000, freq: 12 },
    { city: 'Ahmedabad', type: 'Bus',   name: 'BRTS Janmarg (RTO–Maninagar)', stops: 15, ridership: 130000, freq: 4 },

    // Jaipur
    { city: 'Jaipur', type: 'Metro', name: 'Jaipur Metro Pink Line (Mansarovar–Badi Chaupar)', stops: 11, ridership: 35000, freq: 10 },
    { city: 'Jaipur', type: 'Bus',   name: 'JCTSL City Bus 1 (Vidyadhar Nagar–Sanganer)', stops: 20, ridership: 18000, freq: 15 },

    // Lucknow
    { city: 'Lucknow', type: 'Metro', name: 'Lucknow Metro Red Line (Munshi Pulia–Chaudhary Charan Singh Airport)', stops: 21, ridership: 45000, freq: 8 },
    { city: 'Lucknow', type: 'Bus',   name: 'UPSRTC City Bus G-1 (Alambagh–Charbagh)', stops: 14, ridership: 12000, freq: 15 },

    // Surat
    { city: 'Surat', type: 'Bus',   name: 'BRTS Sitilink Route 101 (Udhna–Sarthana)', stops: 22, ridership: 85000, freq: 5 },
    { city: 'Surat', type: 'Bus',   name: 'BRTS Sitilink Route 110 (Surat Station–Sachin)', stops: 18, ridership: 52000, freq: 8 },

    // Kochi
    { city: 'Kochi', type: 'Metro', name: 'Kochi Metro (Aluva–Pettah SN Junction)', stops: 25, ridership: 65000, freq: 7 },
    { city: 'Kochi', type: 'Ferry', name: 'Kochi Water Metro W1 (Vyttila–Kakkanad)', stops: 6, ridership: 8500, freq: 20 },
    { city: 'Kochi', type: 'Ferry', name: 'Kochi Water Metro W2 (High Court–Vypeen)', stops: 4, ridership: 5200, freq: 25 },
    { city: 'Kochi', type: 'Ferry', name: 'Kochi Water Metro W3 (Vyttila–Fort Kochi)', stops: 5, ridership: 4800, freq: 30 },

    // Nagpur
    { city: 'Nagpur', type: 'Metro', name: 'Nagpur Metro Aqua Line (Sitabuldi–Automotive Square)', stops: 13, ridership: 28000, freq: 10 },
    { city: 'Nagpur', type: 'Metro', name: 'Nagpur Metro Orange Line (Khapri–Lokmanya Nagar)', stops: 15, ridership: 22000, freq: 12 },

    // Other cities — bus services
    { city: 'Indore', type: 'Bus', name: 'Indore City Bus iBus Route 8 (Rajwada–Vijay Nagar)', stops: 16, ridership: 15000, freq: 12 },
    { city: 'Bhopal', type: 'Bus', name: 'BCLL City Bus Red Line (Habibganj–BHEL)', stops: 18, ridership: 12000, freq: 15 },
    { city: 'Chandigarh', type: 'Bus', name: 'CTU AC Bus Route 1 (Sector 17–IT Park)', stops: 14, ridership: 8000, freq: 12 },
    { city: 'Coimbatore', type: 'Bus', name: 'Town Bus 76A (Gandhipuram–Peelamedu)', stops: 16, ridership: 14000, freq: 10 },
    { city: 'Visakhapatnam', type: 'Bus', name: 'APSRTC City 28C (RTC Complex–Simhachalam)', stops: 18, ridership: 12000, freq: 15 },
    { city: 'Thiruvananthapuram', type: 'Bus', name: 'KSRTC Fast 991 (East Fort–Technopark)', stops: 12, ridership: 9000, freq: 15 },
    { city: 'Patna', type: 'Bus', name: 'Patna City Bus G-12 (Patna Junction–Danapur)', stops: 14, ridership: 8500, freq: 18 },
    { city: 'Varanasi', type: 'Bus', name: 'Varanasi City Bus E-1 (Cantt–BHU)', stops: 12, ridership: 6000, freq: 20 },
    { city: 'Guwahati', type: 'Bus', name: 'ASTC City Volvo G-5 (Paltan Bazaar–IIT Guwahati)', stops: 16, ridership: 7500, freq: 15 },
    { city: 'Bhubaneswar', type: 'Bus', name: 'Mo Bus Route 18 (Master Canteen–Infocity)', stops: 14, ridership: 11000, freq: 10 },
    { city: 'Mysuru', type: 'Bus', name: 'KSRTC City Bus 101 (KR Circle–Infosys Campus)', stops: 12, ridership: 9500, freq: 12 },
];

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
    await conn.changeUser({ database: 'smart_traffic' });

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
                        avgSpeed = randF(45, road.speed_limit_kmph);
                    } else {
                        congestion = pick(CONGESTIONS);
                        vcount = rand(200, 1000);
                        avgSpeed = randF(20, 55);
                    }
                }
            }

            const weather = Math.random() < 0.7 ? 'Clear' :
                            Math.random() < 0.5 ? 'Rain' :
                            Math.random() < 0.7 ? 'Fog' : 'Storm';

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

    // ─── 5. Accidents (MoRTH-weighted realistic data) ─────
    console.log('🚨  Seeding accidents (MoRTH-weighted distributions) ...');
    const accidentBatch = [];
    const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);

    // Build a weighted road pool: roads in high-accident states get more accidents
    const weightedRoadPool = [];
    for (const road of roadRows) {
        const city = cityRows.find(c => c.city_id === road.city_id);
        if (!city) continue;
        const [stateRow] = (await conn.query('SELECT state_name FROM states s JOIN cities c ON s.state_id = c.state_id WHERE c.city_id = ?', [city.city_id]))[0];
        const stateName = stateRow?.state_name;
        const weight = STATE_ACCIDENT_WEIGHTS[stateName] || 1;
        for (let w = 0; w < weight; w++) weightedRoadPool.push(road.road_id);
    }

    // MoRTH severity ratios: ~13% Fatal, ~30% Major, ~57% Minor
    const pickSeverity = () => {
        const r = Math.random();
        if (r < 0.13) return 'Fatal';
        if (r < 0.43) return 'Major';
        return 'Minor';
    };

    for (let i = 0; i < 600; i++) {
        const rid   = pick(weightedRoadPool);
        const adate = randomDate(twoYearsAgo, now);
        const tod   = pick(TIME_POOL);   // Weighted: Evening/Night dominant
        const sev   = pickSeverity();
        // MoRTH: Fatal avg 2.5 vehicles, Major avg 2, Minor avg 1.5
        const vinv  = sev === 'Fatal' ? rand(2,5) : sev === 'Major' ? rand(2,4) : rand(1,3);
        // MoRTH: Fatal avg 1.6 deaths, Major has injuries
        const cas   = sev === 'Fatal' ? rand(1,4) : sev === 'Major' ? rand(0,2) : 0;
        const cause = pick(CAUSE_POOL);  // MoRTH-weighted causes
        const road  = roadRows.find(r => r.road_id === rid);
        const city  = road ? cityRows.find(c => c.city_id === road.city_id) : null;
        const desc  = `${cause} on ${road?.road_name || 'road'} near ${city?.city_name || 'city'} during ${tod.toLowerCase()} hours. ${sev === 'Fatal' ? 'Emergency services deployed.' : sev === 'Major' ? 'Injuries reported.' : 'Minor damage.'}`;

        accidentBatch.push(`(${rid}, '${adate}', '${tod}', '${sev}', ${vinv}, ${cas}, '${cause.replace(/'/g, "\\'")}', '${desc.replace(/'/g, "\\'")}')`);
    }
    await conn.query(`INSERT INTO accidents (road_id, accident_date, time_of_day, severity, vehicles_involved, casualties, cause, description) VALUES ${accidentBatch.join(',\n       ')}`);
    console.log(`   ✅  ${accidentBatch.length} accidents inserted (MoRTH-weighted).`);

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

    // ─── 7. Public Transport (Real Indian data) ─────
    console.log('🚌  Seeding public transport routes (real Indian transit data) ...');
    const transportBatch = [];

    for (const route of REAL_TRANSPORT) {
        const cid = cityMap[route.city];
        if (!cid) {
            console.log(`   ⚠️  Skipping route (city not found): ${route.name}`);
            continue;
        }
        transportBatch.push(`('${route.name.replace(/'/g,"\\'").replace(/–/g,'-')}', ${cid}, '${route.type}', ${route.stops}, ${route.ridership}, ${route.freq})`);
    }

    // Also add generic bus routes for cities without specific data
    const citiesWithRoutes = new Set(REAL_TRANSPORT.map(r => r.city));
    for (const cid of cityIds) {
        const cityName = cityRows.find(r => r.city_id === cid)?.city_name;
        if (!cityName || citiesWithRoutes.has(cityName)) continue;
        // Add 1-2 generic bus routes for remaining cities
        const routeCount = rand(1, 2);
        for (let i = 0; i < routeCount; i++) {
            const rname = `${cityName} City Bus Route ${i + 1}`;
            const stops = rand(10, 22);
            const ridership = rand(3000, 12000);
            const freq = rand(12, 25);
            transportBatch.push(`('${rname.replace(/'/g,"\\'")}', ${cid}, 'Bus', ${stops}, ${ridership}, ${freq})`);
        }
    }

    await conn.query(`INSERT INTO public_transport (route_name, city_id, transport_type, stops, daily_ridership, frequency_mins) VALUES ${transportBatch.join(',\n       ')}`);
    console.log(`   ✅  ${transportBatch.length} transport routes inserted (real Indian data).`);

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

    await conn.query('DROP PROCEDURE IF EXISTS sp_accident_hotspots');
    await conn.query(`
        CREATE PROCEDURE sp_accident_hotspots(
            IN p_state_id INT,
            IN p_top_n INT
        )
        BEGIN
            SELECT
                r.road_name, c.city_name, r.road_type,
                COUNT(a.accident_id) AS total_accidents,
                SUM(a.casualties) AS total_casualties,
                SUM(CASE WHEN a.severity = 'Fatal' THEN 1 ELSE 0 END) AS fatal_accidents
            FROM roads r
            JOIN cities c ON r.city_id = c.city_id
            JOIN accidents a ON a.road_id = r.road_id
            WHERE c.state_id = p_state_id
            GROUP BY r.road_id, r.road_name, c.city_name, r.road_type
            ORDER BY total_accidents DESC
            LIMIT p_top_n;
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

    console.log('   ✅  3 stored procedures created.');

    // ─── Summary ────────────────────────────────────
    console.log('\n' + '━'.repeat(55));
    console.log('✅  SEED COMPLETE — Summary:');
    const tables = ['states','cities','roads','traffic_readings','accidents','vehicles','public_transport'];
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
