// ============================================================
// Main Application Controller
// Smart Traffic & Transport Database System
// ============================================================

// ─── API Helper & Performance Stopwatch ────────────
async function api(url) {
    const toggle = document.getElementById('indexToggle');
    const ignoreIndex = toggle ? !toggle.checked : false; 
    
    const stopwatch = document.getElementById('perfStopwatch');
    if (stopwatch) stopwatch.style.opacity = '0.5';

    const startTime = performance.now();
    const res = await fetch(url, {
        headers: { 'X-Ignore-Index': ignoreIndex ? 'true' : 'false' }
    });

    if (stopwatch) {
        // Prefer server-side exact DB time, fallback to network time
        const dbTime = res.headers.get('X-Query-Time');
        const timeNum = dbTime ? parseFloat(dbTime) : (performance.now() - startTime);
        
        stopwatch.style.opacity = '1';
        stopwatch.textContent = `${timeNum > 50 ? '🐢' : '⚡'} ${timeNum.toFixed(1)}ms`;
        
        if (timeNum > 50) {
            stopwatch.style.color = 'var(--accent-red)';
            stopwatch.style.background = 'rgba(255,0,0,0.1)';
        } else {
            stopwatch.style.color = 'var(--accent-green)';
            stopwatch.style.background = 'rgba(0,255,0,0.1)';
        }
        
        // Add a quick pulse animation
        stopwatch.style.transform = 'scale(1.1)';
        setTimeout(() => stopwatch.style.transform = 'scale(1)', 150);
    }

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
}

// Global listener for the Index Toggle
document.addEventListener('change', (e) => {
    if (e.target.id === 'indexToggle') {
        const label = document.getElementById('perfToggleLabel');
        if (label) label.textContent = e.target.checked ? 'Index: ON' : 'Index: OFF';
        // Reload current page to immediately show the performance difference!
        if (currentPage && pageLoaded[currentPage]) {
            loadPageData(currentPage);
        }
    }
});

// ─── Number Formatter ────────────────────────────
function formatNum(n) {
    if (n === null || n === undefined) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
    return Number(n).toLocaleString();
}

// ─── Animated Counter ────────────────────────────
function animateCounter(el, target, duration = 1200) {
    const num = parseFloat(target);
    if (isNaN(num)) { el.textContent = '—'; return; }
    const start = 0;
    const startTime = performance.now();

    function update(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (num - start) * ease);
        el.textContent = formatNum(current);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = formatNum(num);
    }
    requestAnimationFrame(update);
}

// ─── Congestion Badge ────────────────────────────
function congestionBadge(level) {
    const cls = {
        Severe: 'badge-severe', High: 'badge-high',
        Moderate: 'badge-moderate', Low: 'badge-low'
    };
    return `<span class="badge ${cls[level] || ''}">${level}</span>`;
}

function weatherIcon(w) {
    const icons = { Clear: '☀️', Rain: '🌧️', Fog: '🌫️', Storm: '⛈️' };
    return `<span class="weather-icon">${icons[w] || ''} ${w}</span>`;
}

function roadTypeBadge(t) {
    return `<span class="badge badge-${t.toLowerCase()}">${t}</span>`;
}

// ─── Update Clock ────────────────────────────────
function updateClock() {
    const now = new Date();
    const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    document.getElementById('headerTime').textContent = now.toLocaleTimeString('en-IN', opts);
}
setInterval(updateClock, 1000);
updateClock();

// ════════════════════════════════════════════════════
// Page Navigation
// ════════════════════════════════════════════════════
const pageTitles = {
    dashboard: 'Dashboard',
    traffic:   'Traffic Monitor',
    accidents: 'Accident Analytics',
    transport: 'Public Transport',
    dbms:      'DBMS Concepts',
    settings:  'Settings'
};

let currentPage = 'dashboard';
const pageLoaded = {};

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        switchPage(page);
    });
});

async function switchPage(page) {
    if (currentPage === page) return;
    currentPage = page;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

    // Notify DBMS object to stop any internal animations if leaving the page
    if (currentPage !== 'dbms' && window.DBMS && typeof window.DBMS.stopAnimations === 'function') {
        window.DBMS.stopAnimations();
    }

    // Update pages: explicitly hide all and show target
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(p => {
        p.classList.remove('active');
        
        // Comprehensive cleanup of ANY animated elements to prevent "mixing"
        if (window.gsap) {
            const animatedElements = p.querySelectorAll('.animate-in, .chart-card, .data-table-card, .dbms-hero, .index-level-card, .cost-card, .explain-card, .query-item');
            gsap.killTweensOf(animatedElements);
            gsap.set(animatedElements, { clearProps: "all" });
        }
    });

    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    // Reset DBMS sub-tab visibility if we are LEAVING DBMS page
    if (page !== 'dbms') {
        document.querySelectorAll('.dbms-tab-content').forEach(c => {
            c.classList.remove('active');
            if (window.gsap) gsap.killTweensOf(c.querySelectorAll('*'));
        });
    }

    // Update title
    document.getElementById('pageTitle').textContent = pageTitles[page] || page;

    // Toggle performance widget visibility: Hide on settings/dbms, show on others
    const perfWidget = document.getElementById('perfWidgetContainer');
    if (perfWidget) {
        if (['settings', 'dbms'].includes(page)) {
            perfWidget.style.display = 'none';
        } else {
            perfWidget.style.display = 'flex';
        }
    }

    // Load page data if not loaded
    if (!pageLoaded[page]) {
        await loadPageData(page);
        pageLoaded[page] = true;
    }

    // Trigger GSAP entrance Animation
    if (pageEl) {
        const targets = pageEl.querySelectorAll('.animate-in, .chart-card, .data-table-card, .dbms-hero, .index-level-card');
        if (window.gsap && localStorage.getItem('pref_animations') !== 'false') {
            // Kill ANY existing animations on page targets to prevent "mixing" or ghosting
            gsap.killTweensOf(document.querySelectorAll('.animate-in, .chart-card, .data-table-card'));
            
            gsap.fromTo(targets, 
                { y: 30, opacity: 0, scale: 0.95, rotationX: 10, transformPerspective: 800 }, 
                { y: 0, opacity: 1, scale: 1, rotationX: 0, duration: 0.8, stagger: 0.08, ease: "expo.out", clearProps: "all" }
            );
        } else {
            targets.forEach(el => { if(el.classList.contains('animate-in')) el.style.opacity = 1; });
        }
    }

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
}

// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ════════════════════════════════════════════════════
// Page Data Loaders
// ════════════════════════════════════════════════════
async function loadPageData(page) {
    switch (page) {
        case 'dashboard': await loadDashboard(); break;
        case 'traffic':   await loadTraffic();   break;
        case 'accidents': await loadAccidents(); break;
        case 'transport': await loadTransport(); break;
        case 'dbms':      await DBMS.init();     break;
        case 'settings':  await loadSettings();  break;
    }
}

// ─── Dashboard ───────────────────────────────────
async function loadDashboard() {
    try {
        const [overview, congestion, weather, cities] = await Promise.all([
            api('/api/analytics/overview'),
            api('/api/analytics/congestion-distribution'),
            api('/api/analytics/weather-impact'),
            api('/api/analytics/city-comparison')
        ]);

        // KPI Cards — cast MySQL BigInt/Decimal strings to numbers
        const kpis = [
            { label: 'Total Roads',       value: Number(overview.total_roads),      color: 'cyan',   sub: `across ${overview.total_cities} cities` },
            { label: 'Traffic Readings',  value: Number(overview.total_readings),   color: 'purple', sub: 'sensor data points' },
            { label: 'Accidents Recorded',value: Number(overview.total_accidents),  color: 'red',    sub: 'in the last 2 years' },
            { label: 'Avg Speed',         value: parseFloat(overview.avg_speed) || 0, color: 'green',  sub: 'km/h across all roads', isSuffix: true, suffix: ' km/h' },
            { label: 'Congestion Rate',   value: parseFloat(overview.congestion_rate) || 0, color: 'orange', sub: 'high + severe readings', isSuffix: true, suffix: '%' },
            { label: 'Daily Ridership',   value: Number(overview.daily_ridership),  color: 'purple', sub: 'public transport users' },
        ];

        const kpiGrid = document.getElementById('kpiGrid');
        kpiGrid.innerHTML = kpis.map((k, i) => `
            <div class="kpi-card ${k.color} animate-in stagger-${i+1}">
                <div class="kpi-label">${k.label}</div>
                <div class="kpi-value ${k.color}" data-target="${k.value}" ${k.isSuffix ? `data-suffix="${k.suffix}"` : ''}>0</div>
                <div class="kpi-sub">${k.sub}</div>
            </div>
        `).join('');

        // Trigger KPI card entrance animation (data may load after page-switch animation)
        if (window.gsap && localStorage.getItem('pref_animations') !== 'false') {
            gsap.fromTo('#kpiGrid .kpi-card', { y: 35, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.75, stagger: 0.08, ease: 'power4.out', clearProps: 'all' });
        } else {
            kpiGrid.querySelectorAll('.kpi-card').forEach(el => el.style.opacity = '1');
        }

        // Animate counters
        kpiGrid.querySelectorAll('.kpi-value').forEach(el => {
            const target = parseFloat(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            if (suffix) {
                const clone = el;
                animateCounter(clone, target);
                setTimeout(() => { clone.textContent = formatNum(target) + suffix; }, 1300);
            } else {
                animateCounter(el, target);
            }
        });

        // Charts
        renderCongestionDonut(congestion);
        renderWeatherChart(weather);
        renderCityComparison(cities);
    } catch (err) {
        console.error('Dashboard load error:', err);
    }
}

// ─── Traffic Monitor ─────────────────────────────
let trafficCities = [];
let trafficRoads = [];

async function loadTraffic() {
    try {
        // Load cities dropdown
        trafficCities = await api('/api/traffic/cities');
        const citySelect = document.getElementById('trafficCitySelect');
        citySelect.innerHTML = '<option value="">All Cities</option>' +
            trafficCities.map(c =>
                `<option value="${c.city_id}">${c.city_name}${c.is_metro ? ' ★' : ''} — ${c.state_name}</option>`
            ).join('');

        const roadSelect = document.getElementById('trafficRoadSelect');

        // City change handler
        citySelect.addEventListener('change', async () => {
            const cityId = citySelect.value;
            await refreshTrafficPage(cityId);
            // Update road dropdown for selected city
            await loadRoadDropdown(cityId);
        });

        // Road change handler
        roadSelect.addEventListener('change', async () => {
            const roadId = roadSelect.value;
            if (roadId) {
                const road = trafficRoads.find(r => r.road_id == roadId);
                const label = document.getElementById('trendRoadLabel');
                if (label && road) label.textContent = road.road_name;
                await loadTrafficTrend(roadId);
            }
        });

        // Refresh button
        document.getElementById('trafficRefreshBtn').addEventListener('click', () => {
            const cityId = citySelect.value;
            refreshTrafficPage(cityId);
        });

        // Initial load: pick first metro city or first city
        const defaultCity = trafficCities.find(c => c.is_metro) || trafficCities[0];
        if (defaultCity) {
            citySelect.value = defaultCity.city_id;
            await refreshTrafficPage(defaultCity.city_id);
            await loadRoadDropdown(defaultCity.city_id);
        } else {
            await refreshTrafficPage('');
        }
    } catch (err) {
        console.error('Traffic load error:', err);
    }
}

async function refreshTrafficPage(cityId) {
    const id = cityId || 'all';
    try {
        // Load everything in parallel
        const [congestionData, kpiData, peakHoursData, heatmapData] = await Promise.all([
            api(`/api/traffic/congestion/${id}`),
            api(`/api/traffic/city-kpi/${id}`),
            api(`/api/traffic/peak-hours/${id}`),
            api('/api/traffic/heatmap'),
        ]);

        // Render KPI cards
        renderTrafficKpis(kpiData);

        // Render existing charts
        renderRoadCongestion(congestionData);
        renderSpeedComparison(congestionData);

        // Render new charts
        renderRoadTypeLoad(congestionData);
        renderPeakHours(peakHoursData);

        // Render heatmap table
        renderHeatmapTable(heatmapData);

        // Load live table
        await loadLiveTraffic(cityId);

        // Load trend for first road in data if available
        if (congestionData.length > 0) {
            const firstRoad = congestionData[0];
            const label = document.getElementById('trendRoadLabel');
            if (label) label.textContent = firstRoad.road_name || '7-Day History';
            await loadTrafficTrend(firstRoad.road_id);
        }
    } catch (err) {
        console.error('Traffic refresh error:', err);
    }
}

async function loadRoadDropdown(cityId) {
    const roadSelect = document.getElementById('trafficRoadSelect');
    if (!cityId) {
        roadSelect.innerHTML = '<option value="">All Roads</option>';
        trafficRoads = [];
        return;
    }
    try {
        trafficRoads = await api(`/api/traffic/roads/${cityId}`);
        roadSelect.innerHTML = '<option value="">— Select a road —</option>' +
            trafficRoads.map(r =>
                `<option value="${r.road_id}">${r.road_name} (${r.road_type})</option>`
            ).join('');
    } catch (err) {
        console.error('Road dropdown error:', err);
    }
}

function renderTrafficKpis(data) {
    const weatherIcons = { Clear: '☀️', Rain: '🌧️', Fog: '🌫️', Storm: '⛈️' };
    const kpis = [
        { label: 'Total Roads',     value: Number(data.total_roads),     color: 'cyan',   icon: '🛣️' },
        { label: 'Avg Speed',       value: parseFloat(data.avg_speed) || 0,  color: 'green',  icon: '⚡', suffix: ' km/h' },
        { label: 'Peak Vehicles',   value: Number(data.peak_vehicles),   color: 'purple', icon: '🚗' },
        { label: 'Congestion Rate', value: parseFloat(data.congestion_rate) || 0, color: 'red', icon: '🔴', suffix: '%' },
        { label: 'Total Readings',  value: Number(data.total_readings),  color: 'orange', icon: '📊' },
        { label: 'Dominant Weather', value: data.dominant_weather || 'Clear',  color: 'blue',  icon: weatherIcons[data.dominant_weather] || '☀️', isText: true },
    ];

    const container = document.getElementById('trafficKpis');
    container.innerHTML = kpis.map((k, i) => `
        <div class="kpi-card ${k.color} animate-in stagger-${i+1}">
            <div class="kpi-label">${k.icon} ${k.label}</div>
            <div class="kpi-value ${k.color}" ${k.isText ? '' : `data-target="${k.value}"`} ${k.suffix ? `data-suffix="${k.suffix}"` : ''}>${k.isText ? k.value : '0'}</div>
            ${data.city_name ? `<div class="kpi-sub">${data.city_name}${data.state_name ? ' • ' + data.state_name : ''}</div>` : ''}
        </div>
    `).join('');

    // Animate entrance
    if (window.gsap && localStorage.getItem('pref_animations') !== 'false') {
        gsap.fromTo('#trafficKpis .kpi-card', { y: 35, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.75, stagger: 0.08, ease: 'power4.out', clearProps: 'all' });
    } else {
        container.querySelectorAll('.kpi-card').forEach(el => el.style.opacity = '1');
    }

    // Animate counters
    container.querySelectorAll('.kpi-value[data-target]').forEach(el => {
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        animateCounter(el, target);
        if (suffix) {
            setTimeout(() => { el.textContent = formatNum(target) + suffix; }, 1300);
        }
    });
}

async function loadTrafficTrend(roadId) {
    if (!roadId) return;
    try {
        const data = await api(`/api/traffic/trend/${roadId}?days=7`);
        renderTrafficTrend(data);
    } catch (err) {
        console.error('Traffic trend error:', err);
    }
}

function renderHeatmapTable(data) {
    const tbody = document.getElementById('heatmapTableBody');
    if (!tbody) return;

    tbody.innerHTML = data.slice(0, 25).map((row, i) => {
        const pct = parseFloat(row.congestion_pct) || 0;
        const levelClass = pct > 60 ? 'level-severe' : pct > 40 ? 'level-high' : pct > 20 ? 'level-moderate' : 'level-low';
        const pctColor = pct > 60 ? 'var(--accent-red)' : pct > 40 ? 'var(--accent-orange)' : pct > 20 ? 'var(--accent-yellow)' : 'var(--accent-green)';

        return `
            <tr>
                <td style="font-family:var(--font-mono); color:var(--text-muted)">${i + 1}</td>
                <td style="color:var(--text-primary); font-weight:500">${row.city_name}</td>
                <td style="color:var(--text-muted); font-size:0.82rem">${row.state_name}</td>
                <td style="font-family:var(--font-mono)">${row.population ? Number(row.population).toLocaleString() : '—'}</td>
                <td style="font-family:var(--font-mono); color:var(--accent-cyan)">${Number(row.readings).toLocaleString()}</td>
                <td style="font-family:var(--font-mono); color:${parseFloat(row.avg_speed) < 30 ? 'var(--accent-red)' : parseFloat(row.avg_speed) < 50 ? 'var(--accent-orange)' : 'var(--accent-green)'}">${row.avg_speed} km/h</td>
                <td style="font-family:var(--font-mono)">${Number(row.avg_vehicles).toLocaleString()}</td>
                <td>
                    <div class="congestion-bar-container">
                        <div class="congestion-bar-track">
                            <div class="congestion-bar-fill ${levelClass}" style="width:${Math.min(pct, 100)}%"></div>
                        </div>
                        <span class="congestion-bar-pct" style="color:${pctColor}">${pct}%</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadLiveTraffic(cityId) {
    try {
        const url = cityId ? `/api/traffic/live?city_id=${cityId}` : '/api/traffic/live';
        const data = await api(url);
        const tbody = document.getElementById('trafficTableBody');
        tbody.innerHTML = data.map(r => `
            <tr>
                <td style="color:var(--text-primary); font-weight:500">${r.road_name}</td>
                <td>${r.city_name}</td>
                <td>${roadTypeBadge(r.road_type)}</td>
                <td style="font-family:var(--font-mono)">${r.vehicle_count?.toLocaleString()}</td>
                <td style="font-family:var(--font-mono); color:${r.avg_speed_kmph < r.speed_limit_kmph * 0.4 ? 'var(--accent-red)' : r.avg_speed_kmph < r.speed_limit_kmph * 0.7 ? 'var(--accent-orange)' : 'var(--accent-green)'}">
                    ${r.avg_speed_kmph} km/h
                </td>
                <td>${congestionBadge(r.congestion_level)}</td>
                <td>${weatherIcon(r.weather)}</td>
                <td style="font-family:var(--font-mono); font-size:0.78rem; color:var(--text-muted)">${r.reading_timestamp}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Live traffic error:', err);
    }
}

// ─── Accidents ───────────────────────────────────
async function loadAccidents() {
    try {
        const [summary, causes, trend, hotspots, timeData, stateData, states, liveData] = await Promise.all([
            api('/api/accidents/summary'),
            api('/api/accidents/by-cause'),
            api('/api/accidents/trend'),
            api('/api/accidents/hotspots'),
            api('/api/accidents/by-time'),
            api('/api/accidents/by-state'),
            api('/api/accidents/states'),
            api('/api/accidents/live')
        ]);

        // Populate state dropdown
        const stateSelect = document.getElementById('accidentStateSelect');
        stateSelect.innerHTML = '<option value="">All States</option>' +
            states.map(s => `<option value="${s}">${s}</option>`).join('');

        // Wire filter button
        document.getElementById('accidentFilterBtn').onclick = () => applyAccidentFilter();

        // KPI Cards
        const kpis = [
            { label: 'Total Accidents', value: summary.total_accidents, color: 'red' },
            { label: 'Fatal',           value: summary.fatal,            color: 'red' },
            { label: 'Major',           value: summary.major,            color: 'orange' },
            { label: 'Minor',           value: summary.minor,            color: 'green' },
            { label: 'Total Casualties',value: summary.total_casualties,  color: 'red' },
            { label: 'Fatality Rate',   value: summary.fatality_rate + '%', color: 'orange' },
        ];

        const kpiContainer = document.getElementById('accidentKpis');
        kpiContainer.innerHTML = kpis.map((k, i) => `
            <div class="kpi-card ${k.color} animate-in stagger-${i+1}">
                <div class="kpi-label">${k.label}</div>
                <div class="kpi-value ${k.color}">${typeof k.value === 'number' ? formatNum(k.value) : k.value}</div>
            </div>
        `).join('');

        // Trigger KPI card entrance animation
        if (window.gsap && localStorage.getItem('pref_animations') !== 'false') {
            gsap.fromTo('#accidentKpis .kpi-card', { y: 35, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.75, stagger: 0.08, ease: 'power4.out', clearProps: 'all' });
        } else {
            kpiContainer.querySelectorAll('.kpi-card').forEach(el => el.style.opacity = '1');
        }

        // Charts
        renderAccidentCauses(causes);
        renderSeverityChart(summary);
        renderAccidentTrend(trend);
        renderAccidentTimeChart(timeData);
        renderAccidentStateChart(stateData);

        // Hotspot table
        renderHotspotTable(hotspots, liveData);
    } catch (err) {
        console.error('Accidents load error:', err);
    }
}

async function applyAccidentFilter() {
    const state    = document.getElementById('accidentStateSelect').value;
    const severity = document.getElementById('accidentSeveritySelect').value;
    const btn = document.getElementById('accidentFilterBtn');
    btn.disabled = true;
    btn.textContent = 'Loading…';
    try {
        let params = [];
        if (state) params.push(`state=${encodeURIComponent(state)}`);
        if (severity) params.push(`severity=${encodeURIComponent(severity)}`);
        const qs = params.length > 0 ? '?' + params.join('&') : '';
        const limitQs = params.length > 0 ? qs + '&limit=20' : '?limit=20';
        
        const [summary, causes, trend, hotspots, timeData, liveData] = await Promise.all([
            api(`/api/accidents/summary${qs}`),
            api(`/api/accidents/by-cause${qs}`),
            api(`/api/accidents/trend${qs}`),
            api(`/api/accidents/hotspots${limitQs}`),
            api(`/api/accidents/by-time${qs}`),
            api(`/api/accidents/live${qs}`)
        ]);

        // Re-render KPIs
        const kpis = [
            { label: 'Total Accidents', value: summary.total_accidents, color: 'red' },
            { label: 'Fatal',           value: summary.fatal,            color: 'red' },
            { label: 'Major',           value: summary.major,            color: 'orange' },
            { label: 'Minor',           value: summary.minor,            color: 'green' },
            { label: 'Total Casualties',value: summary.total_casualties,  color: 'red' },
            { label: 'Fatality Rate',   value: summary.fatality_rate + '%', color: 'orange' },
        ];
        const kpiContainer = document.getElementById('accidentKpis');
        kpiContainer.innerHTML = kpis.map((k, i) => `
            <div class="kpi-card ${k.color} animate-in">
                <div class="kpi-label">${k.label}</div>
                <div class="kpi-value ${k.color}">${typeof k.value === 'number' ? formatNum(k.value) : k.value}</div>
            </div>
        `).join('');

        if (window.gsap && localStorage.getItem('pref_animations') !== 'false') {
            gsap.fromTo('#accidentKpis .animate-in', {y:30, opacity:0, scale:0.95}, {y:0, opacity:1, scale:1, duration:0.6, stagger:0.06, ease:'power3.out', clearProps:'all'});
        } else {
            document.querySelectorAll('#accidentKpis .animate-in').forEach(e => e.style.opacity = 1);
        }

        // Re-render charts
        renderAccidentCauses(causes);
        renderSeverityChart(summary);
        renderAccidentTrend(trend);
        renderAccidentTimeChart(timeData);

        // Re-render table
        renderHotspotTable(hotspots, liveData);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> Apply Filter`;
    }
}

function renderHotspotTable(hotspots, liveData = []) {
    const tbody = document.getElementById('hotspotTableBody');
    const badge = document.getElementById('liveAccidentsBadge');
    
    let html = '';

    // If we have live data, show the badge and prepend rows
    if (liveData && liveData.length > 0) {
        if (badge) badge.style.display = 'inline-block';
        html += liveData.map(l => `
            <tr style="background-color: rgba(255, 23, 68, 0.05); border-left: 2px solid var(--accent-red);">
                <td style="font-family:var(--font-mono); color:var(--accent-red); font-size: 0.8rem" class="pulse">LIVE</td>
                <td style="color:var(--text-primary); font-weight:500">${l.road_name}</td>
                <td>${l.city_name}</td>
                <td style="font-style:italic">Live API Data</td>
                <td style="font-family:var(--font-mono); color:var(--accent-orange); font-weight:600">1 (Active)</td>
                <td style="font-family:var(--font-mono); color:var(${l.severity === 'Fatal' ? '--accent-red' : l.severity === 'Major' ? '--accent-orange' : '--accent-cyan'}); font-weight:600">${l.severity}</td>
                <td style="font-family:var(--font-mono)">0</td>
                <td style="font-size:0.72rem; color:var(--accent-red); max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${l.description}">🚨 ${l.description}</td>
            </tr>
        `).join('');
    } else {
        if (badge) badge.style.display = 'none';
    }

    // Append regular hotspot data
    html += hotspots.map((h, i) => `
        <tr>
            <td style="font-family:var(--font-mono); color:var(--text-muted)">${i+1}</td>
            <td style="color:var(--text-primary); font-weight:500">${h.road_name}</td>
            <td>${h.city_name}</td>
            <td>${h.state_name}</td>
            <td style="font-family:var(--font-mono); color:var(--accent-orange); font-weight:600">${h.total_accidents}</td>
            <td style="font-family:var(--font-mono); color:var(--accent-red); font-weight:600">${h.fatal_count}</td>
            <td style="font-family:var(--font-mono)">${h.total_casualties}</td>
            <td style="font-size:0.72rem; color:var(--text-muted); max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${h.causes || ''}">${h.causes || '—'}</td>
        </tr>
    `).join('');
    
    tbody.innerHTML = html;
}

// ─── Transport ───────────────────────────────────
async function loadTransport() {
    try {
        const [summary, routes] = await Promise.all([
            api('/api/analytics/transport-summary'),
            api('/api/analytics/transport')
        ]);

        // KPI cards — cast all MySQL BigInt/Decimal strings to numbers
        const totalRidership = summary.byType.reduce((s, t) => s + Number(t.total_ridership), 0);
        const totalRoutes    = summary.byType.reduce((s, t) => s + Number(t.routes), 0);
        const avgFreq        = (summary.byType.reduce((s, t) => s + parseFloat(t.avg_frequency) * Number(t.routes), 0) / Math.max(totalRoutes, 1)).toFixed(1);
        const avgStops       = (summary.byType.reduce((s, t) => s + parseFloat(t.avg_stops) * Number(t.routes), 0) / Math.max(totalRoutes, 1)).toFixed(1);

        const transportKpis = [
            { label: 'Total Routes',     value: totalRoutes,                               color: 'cyan',   suffix: '' },
            { label: 'Daily Ridership',  value: totalRidership,                            color: 'purple', suffix: '' },
            { label: 'Avg Frequency',    value: isNaN(parseFloat(avgFreq)) ? 0 : avgFreq,  color: 'green',  suffix: ' min' },
            { label: 'Avg Stops/Route',  value: isNaN(parseFloat(avgStops)) ? 0 : avgStops, color: 'orange', suffix: '' },
        ];
        const kpiContainer = document.getElementById('transportKpis');
        kpiContainer.innerHTML = transportKpis.map((k, i) => `
            <div class="kpi-card ${k.color} animate-in stagger-${i+1}">
                <div class="kpi-label">${k.label}</div>
                <div class="kpi-value ${k.color}">${isNaN(Number(k.value)) ? '—' : formatNum(Number(k.value))}${k.suffix}</div>
            </div>
        `).join('');

        // Trigger KPI card entrance animation
        if (window.gsap && localStorage.getItem('pref_animations') !== 'false') {
            gsap.fromTo('#transportKpis .kpi-card', { y: 35, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.75, stagger: 0.08, ease: 'power4.out', clearProps: 'all' });
        } else {
            kpiContainer.querySelectorAll('.kpi-card').forEach(el => el.style.opacity = '1');
        }

        renderTransportType(summary.byType);
        renderTransportCity(summary.byCity);
        renderTransportFreqChart(summary.byType);
        renderTransportTable(routes);

        // Wire filter button
        document.getElementById('transportFilterBtn').onclick = () => applyTransportFilter();
    } catch (err) {
        console.error('Transport load error:', err);
    }
}

async function applyTransportFilter() {
    const type = document.getElementById('transportTypeSelect').value;
    const btn  = document.getElementById('transportFilterBtn');
    btn.disabled = true;
    btn.textContent = 'Loading…';
    try {
        const url = type ? `/api/analytics/transport?type=${encodeURIComponent(type)}` : '/api/analytics/transport';
        const routes = await api(url);
        renderTransportTable(routes);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> Filter`;
    }
}

function renderTransportTable(routes) {
    const badge = document.getElementById('transportRouteCount');
    if (badge) badge.textContent = `${routes.length} Routes`;

    const typeEmoji = { Bus: '🚌', Metro: '🚇', Tram: '🚋', Ferry: '⛴️' };
    const tbody = document.getElementById('transportTableBody');
    tbody.innerHTML = routes.map(r => {
        const typeBadge = `badge-${r.transport_type.toLowerCase()}`;
        // Efficiency: ridership per stop per frequency unit (higher = better)
        const eff = r.stops > 0 && r.frequency_mins > 0
            ? Math.round(r.daily_ridership / r.stops / (r.frequency_mins / 10))
            : 0;
        const effColor = eff > 500 ? 'var(--accent-green)' : eff > 200 ? 'var(--accent-cyan)' : 'var(--accent-orange)';
        const effLabel = eff > 500 ? 'High' : eff > 200 ? 'Medium' : 'Low';
        return `
            <tr>
                <td style="color:var(--text-primary); font-weight:500">${r.route_name}</td>
                <td>${r.city_name}</td>
                <td style="color:var(--text-muted); font-size:0.8rem">${r.state_name}</td>
                <td><span class="badge ${typeBadge}">${typeEmoji[r.transport_type] || ''} ${r.transport_type}</span></td>
                <td style="font-family:var(--font-mono)">${r.stops}</td>
                <td style="font-family:var(--font-mono); color:var(--accent-cyan)">${r.daily_ridership?.toLocaleString()}</td>
                <td style="font-family:var(--font-mono)">${r.frequency_mins} min</td>
                <td><span class="badge" style="color:${effColor}; border-color:${effColor}40; background:${effColor}15">${effLabel}</span></td>
            </tr>
        `;
    }).join('');
}

// ─── Settings ────────────────────────────────────
async function loadSettings() {
    try {
        const data = await api('/api/system/status');
        
        const formatStatus = (elId, val, okVal) => {
            const el = document.getElementById(elId);
            if (!el) return;
            el.textContent = val;
            el.className = 'settings-list-value ' + (val === okVal ? 'active' : (val === 'Missing' || val === 'Not Configured' || val.includes('Error') ? 'danger' : ''));
        };

        formatStatus('statusDbConn', data.database.status, 'Connected');
        document.getElementById('statusDbName').textContent = data.database.name;
        document.getElementById('statusDbRecords').textContent = Number(data.database.total_records).toLocaleString();
        
        formatStatus('statusApiTomTom', data.api.tomtom, 'Active');
        
        document.getElementById('statusNodeVersion').textContent = data.server.nodeVersion;
        
        const up = data.server.uptime;
        const h = Math.floor(up / 3600), m = Math.floor(up % 3600 / 60), s = Math.floor(up % 60);
        document.getElementById('statusServerUptime').textContent = `${h}h ${m}m ${s}s`;

    } catch (err) {
        console.error('Settings load error:', err);
        document.getElementById('statusDbConn').textContent = 'Error';
        document.getElementById('statusDbConn').className = 'settings-list-value danger';
    }
}

function applyPreferences() {
    const highContrast = localStorage.getItem('pref_highContrast') === 'true';
    const animations = localStorage.getItem('pref_animations') !== 'false'; // default true

    const hcCheckbox = document.getElementById('settingHighContrast');
    const animCheckbox = document.getElementById('settingAnimations');

    if (hcCheckbox) hcCheckbox.checked = highContrast;
    if (animCheckbox) animCheckbox.checked = animations;

    if (highContrast) document.body.classList.add('high-contrast');
    else document.body.classList.remove('high-contrast');

    if (!animations) document.body.classList.add('no-anim');
    else document.body.classList.remove('no-anim');
}

function applyTheme() {
    const isLightMode = localStorage.getItem('pref_theme') === 'light';
    
    if (isLightMode) {
        document.body.classList.add('light-mode');
        const sun = document.querySelector('.sun-icon');
        const moon = document.querySelector('.moon-icon');
        if(sun) sun.style.display = 'block';
        if(moon) moon.style.display = 'none';
    } else {
        document.body.classList.remove('light-mode');
        const sun = document.querySelector('.sun-icon');
        const moon = document.querySelector('.moon-icon');
        if(sun) sun.style.display = 'none';
        if(moon) moon.style.display = 'block';
    }

    // Trigger chart redraw adapting to CSS variables
    if (window.updateChartTheme) {
        window.updateChartTheme(isLightMode);
    }
}

// Global listeners for settings which might not be generated yet
document.addEventListener('change', (e) => {
    if (e.target.id === 'settingHighContrast') {
        localStorage.setItem('pref_highContrast', e.target.checked);
        applyPreferences();
    } else if (e.target.id === 'settingAnimations') {
        localStorage.setItem('pref_animations', e.target.checked);
        applyPreferences();
    }
});

document.addEventListener('click', (e) => {
    if (e.target.closest('#themeToggleBtn')) {
        themeTransitionEffect();
        const isLight = localStorage.getItem('pref_theme') === 'light';
        localStorage.setItem('pref_theme', isLight ? 'dark' : 'light');
        applyTheme();
    } else if (e.target.closest('#btnRefreshSettings')) {
        loadSettings();
    }
});

// ════════════════════════════════════════════════════
// Background Animation (GSAP)
// ════════════════════════════════════════════════════
function initBackgroundAnimation() {
    const orbs = document.querySelectorAll('.bg-orb');
    if (!orbs.length || !window.gsap) return;
    if (localStorage.getItem('pref_animations') === 'false') return;

    orbs.forEach((orb, i) => {
        animateOrbFloat(orb, i);
    });

    // Subtle grid breathing effect
    const grid = document.querySelector('.bg-grid');
    if (grid) {
        gsap.to(grid, {
            opacity: 0.35,
            duration: 6,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }
}

function animateOrbFloat(orb, index) {
    const xRange = 150 + index * 20;
    const yRange = 120 + index * 15;

    gsap.to(orb, {
        x: gsap.utils.random(-xRange, xRange),
        y: gsap.utils.random(-yRange, yRange),
        scale: gsap.utils.random(0.7, 1.3),
        rotation: gsap.utils.random(-60, 60),
        duration: gsap.utils.random(15, 25),
        ease: 'sine.inOut',
        onComplete: () => animateOrbFloat(orb, index)
    });
}

// Smooth theme transition flash overlay
function themeTransitionEffect() {
    if (!window.gsap) return;

    const isCurrentlyLight = document.body.classList.contains('light-mode');
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 10000; pointer-events: none;
        background: ${isCurrentlyLight ? 'rgba(6,7,13,0.15)' : 'rgba(255,255,255,0.15)'};
        opacity: 0;
    `;
    document.body.appendChild(flash);

    gsap.timeline()
        .to(flash, { opacity: 1, duration: 0.25, ease: 'power2.in' })
        .to(flash, { opacity: 0, duration: 0.45, ease: 'power2.out', onComplete: () => flash.remove() });

    // Pulse orbs during transition
    const orbs = document.querySelectorAll('.bg-orb');
    orbs.forEach((orb, i) => {
        gsap.to(orb, {
            scale: 1.5,
            opacity: 0.15,
            duration: 0.3,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1,
            delay: i * 0.04
        });
    });
}

// ════════════════════════════════════════════════════
// Initialization
// ════════════════════════════════════════════════════
async function init() {
    try {
        // Initialize GSAP background animation
        initBackgroundAnimation();

        await loadDashboard();
        pageLoaded.dashboard = true;
        // Trigger initial animation for dashboard
        const dashTargets = document.getElementById('page-dashboard').querySelectorAll('.animate-in, .chart-card');
        if (window.gsap && localStorage.getItem('pref_animations') !== 'false') {
            gsap.fromTo(dashTargets, { y: 30, opacity: 0, scale: 0.95, rotationX: 10, transformPerspective: 800 }, { y: 0, opacity: 1, scale: 1, rotationX: 0, duration: 0.8, stagger: 0.08, ease: "expo.out", clearProps: "all" });
        } else {
            dashTargets.forEach(el => { if(el.classList.contains('animate-in')) el.style.opacity = 1; });
        }
    } catch (err) {
        console.error('Init error:', err);
    } finally {
        // Hide loader
        setTimeout(() => {
            document.getElementById('loadingOverlay').classList.add('hidden');
        }, 600);
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    applyPreferences();
    applyTheme();
    init();
});
