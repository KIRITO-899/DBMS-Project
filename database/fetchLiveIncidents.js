require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.TOMTOM_API_KEY;

// City center coordinates to map live incidents to
const CITY_COORDS = {
    'Mumbai': { lat: 19.0760, lon: 72.8777 },
    'Delhi': { lat: 28.7041, lon: 77.1025 },
    'Bangalore': { lat: 12.9716, lon: 77.5946 },
    'Hyderabad': { lat: 17.3850, lon: 78.4867 },
    'Chennai': { lat: 13.0827, lon: 80.2707 },
    'Kolkata': { lat: 22.5726, lon: 88.3639 },
    'Pune': { lat: 18.5204, lon: 73.8567 },
    'Ahmedabad': { lat: 23.0225, lon: 72.5714 }
};

// Create a ~15km bounding box around a city center for the TomTom API
// bbox format: minLon,minLat,maxLon,maxLat
function getBoundingBox(lat, lon, margin = 0.15) {
    const minLat = lat - margin;
    const maxLat = lat + margin;
    const minLon = lon - margin;
    const maxLon = lon + margin;
    return `${minLon},${minLat},${maxLon},${maxLat}`;
}

// Map TomTom magnitudeOfDelay (0-4) to our Database Severity
function mapSeverity(magnitude) {
    // 0 = Unknown, 1 = Minor, 2 = Moderate, 3 = Major, 4 = Undefined
    if (magnitude >= 3) return 'Major';
    if (magnitude === 2) return 'Minor';
    return 'Minor'; // default
}

async function getLiveIncidentsForCity(cityName) {
    if (!API_KEY) {
        console.warn('⚠️ No TOMTOM_API_KEY found for incident polling.');
        return [];
    }

    const baseCoords = CITY_COORDS[cityName];
    if (!baseCoords) return [];

    const bbox = getBoundingBox(baseCoords.lat, baseCoords.lon);
    const fields = '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},startTime,delay,roadNumbers}}}';
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${API_KEY}&bbox=${bbox}&fields=${fields}&language=en-GB`;

    try {
        const { data } = await axios.get(url, { timeout: 8000 });
        if (data && data.incidents && data.incidents.length > 0) {
            
            // Filter strictly for accidents or hazards (iconCategory 1 is accident, 6 is roadworks, 14 is broken down vehicle)
            const relevantIncidents = data.incidents.filter(inc => {
                const icon = inc.properties.iconCategory;
                return icon === 1 || icon === 6 || icon === 14; 
            });

            return relevantIncidents.map(inc => {
                let description = 'Traffic incident';
                if (inc.properties.events && inc.properties.events.length > 0) {
                    description = inc.properties.events[0].description;
                }
                
                const causeCode = inc.properties.iconCategory === 1 ? 'Live Accident' :
                                  inc.properties.iconCategory === 6 ? 'Roadworks' : 
                                  inc.properties.iconCategory === 14 ? 'Broken Down Vehicle' : 'Traffic Event';

                const roadArray = inc.properties.roadNumbers;
                const roadGuess = roadArray && roadArray.length > 0 ? roadArray[0] : 'Unknown Road';

                return {
                    tomTomId: inc.properties.id,
                    causePrefix: `[LIVE API] ${causeCode}`,
                    description: `[LIVE API] ${description} on ${roadGuess}. Delay: ${inc.properties.delay}s`,
                    severity: mapSeverity(inc.properties.magnitudeOfDelay),
                    timeOfDay: determineTimeOfDay(),
                    vehiclesInvolved: inc.properties.iconCategory === 1 ? 2 : 1
                };
            });
        }
    } catch (err) {
        console.error(`❌ TomTom Incident API error for ${cityName}:`, err.message);
    }
    return [];
}

function determineTimeOfDay() {
    const hr = new Date().getHours();
    if (hr >= 6 && hr < 12) return 'Morning';
    if (hr >= 12 && hr < 17) return 'Afternoon';
    if (hr >= 17 && hr < 21) return 'Evening';
    return 'Night';
}

module.exports = {
    getLiveIncidentsForCity,
    CITY_COORDS
};
