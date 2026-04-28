// ============================================================
// Chart.js Configuration & Rendering
// Smart Traffic & Transport Database System
// ============================================================

const ChartConfig = {
    // Global defaults for dark theme
    defaults: {
        color: '#8b8fa8',
        borderColor: 'rgba(255,255,255,0.06)',
        font: { family: "'Inter', sans-serif", size: 12 },
    },

    // Color palettes
    colors: {
        cyan:    '#00e5ff',
        purple:  '#7c4dff',
        green:   '#00e676',
        orange:  '#ff9100',
        red:     '#ff1744',
        blue:    '#448aff',
        pink:    '#f50057',
        yellow:  '#ffea00',
    },

    congestionColors: {
        Low:      '#00e676',
        Moderate: '#ffea00',
        High:     '#ff9100',
        Severe:   '#ff1744',
    },

    // Create gradient fill
    createGradient(ctx, color1, color2, vertical = true) {
        const gradient = vertical
            ? ctx.createLinearGradient(0, 0, 0, 400)
            : ctx.createLinearGradient(0, 0, 400, 0);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    },

    // Common chart options
    commonOptions(title = '') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#8b8fa8',
                        font: { family: "'Inter', sans-serif", size: 11 },
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 8,
                    }
                },
                title: title ? {
                    display: true,
                    text: title,
                    color: '#eef0f6',
                    font: { family: "'Inter', sans-serif", size: 14, weight: 600 },
                    padding: { bottom: 16 }
                } : { display: false },
                tooltip: {
                    backgroundColor: 'rgba(12,14,26,0.95)',
                    titleColor: '#eef0f6',
                    bodyColor: '#8b8fa8',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    titleFont: { family: "'Inter', sans-serif", weight: 600 },
                    bodyFont: { family: "'Inter', sans-serif" },
                    displayColors: true,
                    boxPadding: 4,
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
                    ticks: { color: '#5c6078', font: { size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
                    ticks: { color: '#5c6078', font: { size: 11 } }
                }
            }
        };
    },

    // Donut / Pie options (no scales)
    pieOptions() {
        const o = this.commonOptions();
        delete o.scales;
        o.cutout = '65%';
        o.plugins.legend.position = 'bottom';
        return o;
    },

    barOptions() {
        const o = this.commonOptions();
        o.scales.x.grid.display = false;
        return o;
    },
};

// Set Chart.js global defaults
Chart.defaults.color = ChartConfig.defaults.color;
Chart.defaults.borderColor = ChartConfig.defaults.borderColor;
Chart.defaults.font.family = ChartConfig.defaults.font.family;

// ────────────────────────────────────────────────────
// Chart instances (stored for destruction on re-render)
// ────────────────────────────────────────────────────
const chartInstances = {};

function destroyChart(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
        delete chartInstances[id];
    }
}

// ────────────────────────────────────────────────────
// Dashboard Charts
// ────────────────────────────────────────────────────
function renderCongestionDonut(data) {
    destroyChart('congestionDonut');
    const ctx = document.getElementById('congestionDonut').getContext('2d');
    const colors = data.map(d => ChartConfig.congestionColors[d.congestion_level]);

    chartInstances.congestionDonut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.congestion_level),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: colors,
                borderColor: 'rgba(6,7,13,0.8)',
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            ...ChartConfig.pieOptions(),
            plugins: {
                ...ChartConfig.pieOptions().plugins,
                legend: {
                    display: false
                }
            }
        }
    });

    const chartCard = document.getElementById('congestionDonut').closest('.chart-card');
    let legendContainer = chartCard.querySelector('.custom-html-legend');
    if (!legendContainer) {
        legendContainer = document.createElement('div');
        legendContainer.className = 'custom-html-legend';
        legendContainer.style.display = 'flex';
        legendContainer.style.justifyContent = 'center';
        legendContainer.style.gap = '8px';
        legendContainer.style.flexWrap = 'wrap';
        legendContainer.style.padding = '0 20px 20px';
        chartCard.appendChild(legendContainer);
    }

    const chartInstance = chartInstances.congestionDonut;
    const total = data.reduce((sum, d) => sum + d.count, 0);

    legendContainer.innerHTML = data.map((d, i) => {
        const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : "0.0";
        const color = ChartConfig.congestionColors[d.congestion_level];
        const badgeClass = `badge-${d.congestion_level.toLowerCase()}`;
        return `
            <button class="badge ${badgeClass}" data-index="${i}" style="border: 1px solid ${color}40; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 0.8rem; background-color: ${color}15; color: ${color}; transition: all 0.2s; outline: none; font-family: var(--font-body);">
                <span class="legend-dot" style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; transition: background-color 0.2s; box-sizing: border-box;"></span>
                ${d.congestion_level} <span style="opacity: 0.8; font-family: var(--font-mono); margin-left: 2px;">(${pct}%)</span>
            </button>
        `;
    }).join('');

    legendContainer.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.dataset.index;
            const meta = chartInstance.getDatasetMeta(0);
            const isHidden = meta.data[index].hidden;
            meta.data[index].hidden = !isHidden;
            chartInstance.update();
            
            const dot = e.currentTarget.querySelector('.legend-dot');
            if (!isHidden) {
                e.currentTarget.style.opacity = '0.5';
                dot.style.backgroundColor = 'transparent';
                dot.style.border = `1px solid ${ChartConfig.congestionColors[data[index].congestion_level]}`;
            } else {
                e.currentTarget.style.opacity = '1';
                dot.style.backgroundColor = ChartConfig.congestionColors[data[index].congestion_level];
                dot.style.border = 'none';
            }
        });
    });
}

function renderWeatherChart(data) {
    destroyChart('weatherChart');
    const ctx = document.getElementById('weatherChart').getContext('2d');

    const weatherEmojis = { Clear: '☀️', Rain: '🌧️', Fog: '🌫️', Storm: '⛈️' };
    const weatherColors = {
        Clear: '#00e676', Rain: '#448aff', Fog: '#8b8fa8', Storm: '#ff1744'
    };

    chartInstances.weatherChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => `${weatherEmojis[d.weather] || ''} ${d.weather}`),
            datasets: [
                {
                    label: 'Avg Speed (km/h)',
                    data: data.map(d => d.avg_speed),
                    backgroundColor: data.map(d => weatherColors[d.weather] + '40'),
                    borderColor: data.map(d => weatherColors[d.weather]),
                    borderWidth: 1.5,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Congestion %',
                    data: data.map(d => d.congestion_pct),
                    type: 'line',
                    borderColor: ChartConfig.colors.orange,
                    backgroundColor: ChartConfig.colors.orange + '20',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...ChartConfig.barOptions(),
            layout: { padding: { bottom: 8 } },
            scales: {
                ...ChartConfig.barOptions().scales,
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#8b8fa8',
                        font: { size: 12 },
                        maxRotation: 0,
                        minRotation: 0,
                    }
                },
                y: {
                    ...ChartConfig.barOptions().scales.y,
                    position: 'left',
                    title: { display: true, text: 'Avg Speed (km/h)', color: '#5c6078' }
                },
                y1: {
                    position: 'right',
                    grid: { display: false },
                    ticks: { color: '#5c6078', font: { size: 11 } },
                    title: { display: true, text: 'Congestion %', color: '#5c6078' }
                }
            }
        }
    });

}

function renderCityComparison(data) {
    destroyChart('cityComparisonChart');
    const ctx = document.getElementById('cityComparisonChart').getContext('2d');
    const top = data.slice(0, 12);
    const gradient = ChartConfig.createGradient(ctx, '#00e5ff40', '#7c4dff10');

    chartInstances.cityComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top.map(d => d.city_name),
            datasets: [
                {
                    label: 'Congestion %',
                    data: top.map(d => d.congestion_pct),
                    backgroundColor: top.map(d =>
                        d.congestion_pct > 60 ? '#ff174440' :
                        d.congestion_pct > 40 ? '#ff910040' :
                        '#00e67640'
                    ),
                    borderColor: top.map(d =>
                        d.congestion_pct > 60 ? '#ff1744' :
                        d.congestion_pct > 40 ? '#ff9100' :
                        '#00e676'
                    ),
                    borderWidth: 1.5,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Avg Speed (km/h)',
                    data: top.map(d => d.avg_speed),
                    type: 'line',
                    borderColor: ChartConfig.colors.cyan,
                    backgroundColor: gradient,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...ChartConfig.barOptions(),
            scales: {
                ...ChartConfig.barOptions().scales,
                x: {
                    ...ChartConfig.barOptions().scales.x,
                    ticks: {
                        ...ChartConfig.barOptions().scales.x.ticks,
                        maxRotation: 45,
                        minRotation: 30,
                    }
                },
                y: {
                    ...ChartConfig.barOptions().scales.y,
                    position: 'left',
                    title: { display: true, text: 'Congestion %', color: '#5c6078' }
                },
                y1: {
                    position: 'right',
                    grid: { display: false },
                    ticks: { color: '#5c6078' },
                    title: { display: true, text: 'Avg Speed', color: '#5c6078' }
                }
            }
        }
    });
}

// ────────────────────────────────────────────────────
// Traffic Page Charts
// ────────────────────────────────────────────────────
function renderRoadCongestion(data) {
    destroyChart('roadCongestionChart');
    const ctx = document.getElementById('roadCongestionChart').getContext('2d');
    const top = data.slice(0, 10);

    chartInstances.roadCongestionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top.map(d => d.road_name),
            datasets: [
                { label: 'Severe', data: top.map(d => d.severe_count), backgroundColor: '#ff174480', borderColor: '#ff1744', borderWidth: 1, borderRadius: 4 },
                { label: 'High',   data: top.map(d => d.high_count),   backgroundColor: '#ff910080', borderColor: '#ff9100', borderWidth: 1, borderRadius: 4 },
                { label: 'Moderate', data: top.map(d => d.moderate_count), backgroundColor: '#ffea0060', borderColor: '#ffea00', borderWidth: 1, borderRadius: 4 },
                { label: 'Low',    data: top.map(d => d.low_count),    backgroundColor: '#00e67660', borderColor: '#00e676', borderWidth: 1, borderRadius: 4 },
            ]
        },
        options: {
            ...ChartConfig.barOptions(),
            indexAxis: 'y',
            scales: {
                x: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5c6078' } },
                y: { stacked: true, grid: { display: false }, ticks: { color: '#8b8fa8', font: { size: 10 } } }
            }
        }
    });
}

function renderSpeedComparison(data) {
    destroyChart('speedCompChart');
    const ctx = document.getElementById('speedCompChart').getContext('2d');
    const top = data.slice(0, 10);

    chartInstances.speedCompChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top.map(d => d.road_name),
            datasets: [
                {
                    label: 'Avg Speed',
                    data: top.map(d => d.avg_speed),
                    backgroundColor: top.map(d =>
                        d.avg_speed < d.speed_limit_kmph * 0.4 ? '#ff174440' :
                        d.avg_speed < d.speed_limit_kmph * 0.7 ? '#ff910040' :
                        '#00e67640'
                    ),
                    borderColor: top.map(d =>
                        d.avg_speed < d.speed_limit_kmph * 0.4 ? '#ff1744' :
                        d.avg_speed < d.speed_limit_kmph * 0.7 ? '#ff9100' :
                        '#00e676'
                    ),
                    borderWidth: 1.5,
                    borderRadius: 6,
                },
                {
                    label: 'Speed Limit',
                    data: top.map(d => d.speed_limit_kmph),
                    type: 'line',
                    borderColor: '#8b8fa8',
                    borderDash: [6, 4],
                    pointRadius: 3,
                    tension: 0,
                    fill: false,
                }
            ]
        },
        options: {
            ...ChartConfig.barOptions(),
            scales: {
                ...ChartConfig.barOptions().scales,
                x: {
                    ...ChartConfig.barOptions().scales.x,
                    ticks: { maxRotation: 45, minRotation: 30, color: '#5c6078', font: { size: 10 } }
                },
                y: {
                    ...ChartConfig.barOptions().scales.y,
                    title: { display: true, text: 'Speed (km/h)', color: '#5c6078' }
                }
            }
        }
    });
}

function renderTrafficTrend(data) {
    destroyChart('trafficTrendChart');
    const ctx = document.getElementById('trafficTrendChart').getContext('2d');
    if (!data || data.length === 0) return;

    const labels = data.map(d => {
        const dateStr = d.date ? new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '';
        return `${dateStr} ${String(d.hour).padStart(2, '0')}:00`;
    });

    const gradientVehicles = ChartConfig.createGradient(ctx, 'rgba(0,229,255,0.3)', 'rgba(0,229,255,0.02)');
    const gradientSpeed = ChartConfig.createGradient(ctx, 'rgba(0,230,118,0.2)', 'rgba(0,230,118,0.01)');

    chartInstances.trafficTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Avg Vehicles',
                    data: data.map(d => d.avg_vehicles),
                    borderColor: ChartConfig.colors.cyan,
                    backgroundColor: gradientVehicles,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 1.5,
                    pointHoverRadius: 5,
                    borderWidth: 2,
                    yAxisID: 'y',
                },
                {
                    label: 'Avg Speed (km/h)',
                    data: data.map(d => d.avg_speed),
                    borderColor: ChartConfig.colors.green,
                    backgroundColor: gradientSpeed,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 1,
                    pointHoverRadius: 4,
                    borderWidth: 1.5,
                    borderDash: [4, 3],
                    yAxisID: 'y1',
                }
            ]
        },
        options: {
            ...ChartConfig.commonOptions(),
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                    ticks: { color: '#5c6078', font: { size: 9 }, maxTicksLimit: 16, maxRotation: 45, minRotation: 30 }
                },
                y: {
                    position: 'left',
                    grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
                    ticks: { color: '#5c6078', font: { size: 11 } },
                    title: { display: true, text: 'Vehicles', color: '#5c6078' }
                },
                y1: {
                    position: 'right',
                    grid: { display: false },
                    ticks: { color: '#5c6078', font: { size: 11 } },
                    title: { display: true, text: 'Speed (km/h)', color: '#5c6078' }
                }
            }
        }
    });
}

function renderRoadTypeLoad(data) {
    destroyChart('roadTypeLoadChart');
    const ctx = document.getElementById('roadTypeLoadChart').getContext('2d');
    if (!data || data.length === 0) return;

    // Aggregate vehicle counts by road type from congestion data
    const typeMap = {};
    data.forEach(d => {
        const type = d.road_type || 'Unknown';
        if (!typeMap[type]) typeMap[type] = { total: 0, count: 0 };
        typeMap[type].total += Number(d.avg_vehicles || 0);
        typeMap[type].count += 1;
    });

    const types = Object.keys(typeMap);
    const values = types.map(t => Math.round(typeMap[t].total / typeMap[t].count));

    const typeColors = {
        NH: '#00e5ff',
        SH: '#7c4dff',
        Urban: '#448aff',
        Arterial: '#f50057',
        Expressway: '#ff9100',
    };

    chartInstances.roadTypeLoadChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: types,
            datasets: [{
                data: values,
                backgroundColor: types.map(t => (typeColors[t] || '#8b8fa8') + '50'),
                borderColor: types.map(t => typeColors[t] || '#8b8fa8'),
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#8b8fa8',
                        font: { family: "'Inter', sans-serif", size: 11 },
                        padding: 12,
                        usePointStyle: true,
                        pointStyleWidth: 8,
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(12,14,26,0.95)',
                    titleColor: '#eef0f6',
                    bodyColor: '#8b8fa8',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.raw.toLocaleString()} avg vehicles`
                    }
                }
            },
            scales: {
                r: {
                    grid: { color: 'rgba(255,255,255,0.06)' },
                    ticks: { display: false },
                    beginAtZero: true,
                }
            }
        }
    });
}

function renderPeakHours(data) {
    destroyChart('peakHoursChart');
    const ctx = document.getElementById('peakHoursChart').getContext('2d');
    if (!data || data.length === 0) return;

    // Pad missing hours
    const hourMap = {};
    data.forEach(d => { hourMap[d.hour] = d; });
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const labels = hours.map(h => `${String(h).padStart(2, '0')}:00`);
    const vehicleData = hours.map(h => hourMap[h]?.avg_vehicles || 0);
    const congestionData = hours.map(h => hourMap[h]?.congestion_pct || 0);

    // Gradient colors based on congestion intensity
    const barColors = hours.map(h => {
        const pct = hourMap[h]?.congestion_pct || 0;
        if (pct > 60) return '#ff174460';
        if (pct > 40) return '#ff910060';
        if (pct > 20) return '#ffea0050';
        return '#00e67640';
    });
    const barBorders = hours.map(h => {
        const pct = hourMap[h]?.congestion_pct || 0;
        if (pct > 60) return '#ff1744';
        if (pct > 40) return '#ff9100';
        if (pct > 20) return '#ffea00';
        return '#00e676';
    });

    chartInstances.peakHoursChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Avg Vehicles',
                    data: vehicleData,
                    backgroundColor: barColors,
                    borderColor: barBorders,
                    borderWidth: 1,
                    borderRadius: 4,
                    yAxisID: 'y',
                },
                {
                    label: 'Congestion %',
                    data: congestionData,
                    type: 'line',
                    borderColor: ChartConfig.colors.red,
                    backgroundColor: ChartConfig.colors.red + '15',
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    yAxisID: 'y1',
                }
            ]
        },
        options: {
            ...ChartConfig.barOptions(),
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#5c6078', font: { size: 9 }, maxRotation: 60, minRotation: 45 }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#5c6078' },
                    title: { display: true, text: 'Avg Vehicles', color: '#5c6078' }
                },
                y1: {
                    position: 'right',
                    grid: { display: false },
                    ticks: { color: '#5c6078' },
                    title: { display: true, text: 'Congestion %', color: '#5c6078' },
                    min: 0,
                    max: 100,
                }
            }
        }
    });
}



// ────────────────────────────────────────────────────
// Theme Toggle Update
// ────────────────────────────────────────────────────
window.updateChartTheme = function(isLightMode) {
    const color = isLightMode ? '#475569' : '#8b8fa8';
    const borderColor = isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
    const titleColor = isLightMode ? '#1e293b' : '#eef0f6';
    const gridColor = isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';

    Chart.defaults.color = color;
    Chart.defaults.borderColor = borderColor;

    Object.values(chartInstances).forEach(chart => {
        if (!chart) return;
        
        if (chart.options.scales) {
            Object.values(chart.options.scales).forEach(scale => {
                if (scale.ticks) scale.ticks.color = color;
                if (scale.grid) scale.grid.color = gridColor;
                if (scale.title) scale.title.color = color;
            });
        }

        if (chart.options.plugins) {
            if (chart.options.plugins.legend && chart.options.plugins.legend.labels) {
                chart.options.plugins.legend.labels.color = color;
            }
            if (chart.options.plugins.title) {
                chart.options.plugins.title.color = titleColor;
            }
            if (chart.options.plugins.tooltip) {
                chart.options.plugins.tooltip.backgroundColor = isLightMode ? 'rgba(255,255,255,0.95)' : 'rgba(12,14,26,0.95)';
                chart.options.plugins.tooltip.titleColor = titleColor;
                chart.options.plugins.tooltip.bodyColor = color;
                chart.options.plugins.tooltip.borderColor = isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
            }
        }
        chart.update();
    });
};
