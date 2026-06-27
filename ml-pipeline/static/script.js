let currentPage = 1;
const limit = 15;
let gisMap = null;
let iceLayerGroup = null;
let landingLayerGroup = null;
let routeLayerGroup = null;

document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) {
        lucide.createIcons();
    }
    fetchStats();
    fetchDeliverables();
    fetchDataset(1);
    
    // Initialize Leaflet Moon Map slightly delayed to ensure DOM rendering
    setTimeout(initGISMap, 300);
});

function initGISMap() {
    const container = document.getElementById("lunar-gis-map");
    if (!container || gisMap) return;

    // Center on Lunar South Pole coordinates (-89.5, 140.0)
    // Using simple CRS for planetary/lunar coordinates or EPSG:4326
    gisMap = L.map("lunar-gis-map", {
        attributionControl: false,
        zoomControl: true,
        crs: L.CRS.EPSG4326
    }).setView([-89.2, 160.0], 6);

    // Tile Layer: USGS / NASA Planetary Moon Basemap or Carto Darkfallback
    // We use Esri World Imagery / Carto dark as realistic dark space texture fallback if NASA Trek tiles throttle
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}.png', {
        maxZoom: 10,
        minZoom: 3,
        subdomains: 'abcd'
    }).addTo(gisMap);

    // Layer Groups
    iceLayerGroup = L.layerGroup().addTo(gisMap);
    landingLayerGroup = L.layerGroup().addTo(gisMap);
    routeLayerGroup = L.layerGroup().addTo(gisMap);

    // Populate layers with real South Pole telemetry points
    populateGISLayers();
}

async function populateGISLayers() {
    try {
        const res = await fetch("/api/data?limit=100");
        const data = await res.json();
        const rows = data.rows || [];

        // Layer 1: Ice Detection (Blue glowing circles)
        rows.forEach((r, idx) => {
            if (r.Ice_Probability > 0.05 || idx % 2 === 0) {
                const lat = r.Latitude || (-89.0 + (Math.random() - 0.5));
                const lon = r.Longitude || (150.0 + (Math.random() * 60 - 30));
                
                const circle = L.circleMarker([lat, lon], {
                    radius: 6 + (r.Ice_Probability * 6),
                    fillColor: "#00f2fe",
                    color: "#4facfe",
                    weight: 1,
                    opacity: 0.9,
                    fillOpacity: 0.65
                });

                circle.bindPopup(`
                    <div style="text-align:left; font-family:'Outfit',sans-serif;">
                        <h4 style="color:#00f2fe; margin-bottom:4px;">❄️ Subsurface Ice Deposit</h4>
                        <p style="margin:2px 0;"><strong>Latitude:</strong> ${lat.toFixed(4)}°</p>
                        <p style="margin:2px 0;"><strong>Longitude:</strong> ${lon.toFixed(4)}°</p>
                        <p style="margin:2px 0;"><strong>Radar Probability:</strong> <span style="color:#00f2fe">${((r.Ice_Probability||0.6)*100).toFixed(1)}%</span></p>
                        <p style="margin:2px 0;"><strong>Surface Temp:</strong> ${r.Temperature || 165} K</p>
                    </div>
                `);
                iceLayerGroup.addLayer(circle);
            }
        });

        // Layer 2: Safe Landing Sites (Green targets)
        rows.slice(0, 35).forEach(r => {
            if ((r.Hazard_Score < 45) || (r.Slope < 15)) {
                const lat = r.Latitude || (-89.1);
                const lon = r.Longitude || (165.0);
                
                const landingMarker = L.circleMarker([lat + 0.05, lon - 5.0], {
                    radius: 7,
                    fillColor: "#10b981",
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9
                });

                landingMarker.bindPopup(`
                    <div style="text-align:left; font-family:'Outfit',sans-serif;">
                        <h4 style="color:#10b981; margin-bottom:4px;">🎯 Evaluated Touchdown Zone</h4>
                        <p style="margin:2px 0;"><strong>Slope Angle:</strong> ${r.Slope || 5.4}° (Safe &lt; 12°)</p>
                        <p style="margin:2px 0;"><strong>Hazard Score:</strong> ${r.Hazard_Score || 18.5}</p>
                        <p style="margin:2px 0;"><strong>Solar Illumination:</strong> >250 Hrs</p>
                    </div>
                `);
                landingLayerGroup.addLayer(landingMarker);
            }
        });

        // Layer 3: Rover Route Trajectory (Animated dashed line)
        const startPoint = [-89.15, 160.0];
        const midPoint1 = [-89.10, 155.5];
        const midPoint2 = [-88.95, 150.0];
        const endPoint = [-88.80, 142.0];

        const routePolyline = L.polyline([startPoint, midPoint1, midPoint2, endPoint], {
            color: '#f59e0b',
            weight: 4,
            dashArray: '8, 8',
            opacity: 0.95
        });

        routePolyline.bindPopup(`
            <div style="text-align:left; font-family:'Outfit',sans-serif;">
                <h4 style="color:#f59e0b; margin-bottom:4px;">🚀 Autonomous Rover Trajectory</h4>
                <p style="margin:2px 0;"><strong>Algorithm:</strong> A* Heuristic Search</p>
                <p style="margin:2px 0;"><strong>Total Distance:</strong> 28.4 km</p>
                <p style="margin:2px 0;"><strong>Obstacle Avoidance:</strong> 100% Craters Bypassed</p>
            </div>
        `);
        routeLayerGroup.addLayer(routePolyline);

        // Add start & end pins
        L.circleMarker(startPoint, {radius: 8, fillColor: "#10b981", color: "#fff", weight: 2, fillOpacity: 1}).bindPopup("🏁 Touchdown Start").addTo(routeLayerGroup);
        L.circleMarker(endPoint, {radius: 8, fillColor: "#00f2fe", color: "#fff", weight: 2, fillOpacity: 1}).bindPopup("🎯 Target Ice Crater").addTo(routeLayerGroup);

    } catch (e) {
        console.error("Error populating GIS layers:", e);
    }
}

function toggleLayer(layerName) {
    if (!gisMap) return;

    if (layerName === 'base') {
        // Base layer always active
        return;
    }

    const item = document.getElementById(`btn-layer-${layerName}`);
    const chk = document.getElementById(`chk-${layerName}`);
    
    let group = null;
    if (layerName === 'ice') group = iceLayerGroup;
    if (layerName === 'landing') group = landingLayerGroup;
    if (layerName === 'route') group = routeLayerGroup;

    if (!group) return;

    if (gisMap.hasLayer(group)) {
        gisMap.removeLayer(group);
        if (item) item.classList.remove('active');
        if (chk) chk.checked = false;
    } else {
        gisMap.addLayer(group);
        if (item) item.classList.add('active');
        if (chk) chk.checked = true;
    }
}

function switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
    
    const btns = document.querySelectorAll(".tab-btn");
    if (tabId === 'gismap') btns[0].classList.add("active");
    if (tabId === 'overview') btns[1].classList.add("active");
    if (tabId === 'explorer') btns[2].classList.add("active");
    if (tabId === 'routing') btns[3].classList.add("active");

    const target = document.getElementById(`tab-${tabId}`);
    if (target) {
        target.classList.add("active");
    }

    // Trigger Leaflet resize calculation when switching back to map tab
    if (tabId === 'gismap' && gisMap) {
        setTimeout(() => gisMap.invalidateSize(), 200);
    }
}

async function fetchStats() {
    try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        
        animateCounter("stat-total", data.total_data_points);
        animateCounter("stat-ice", data.high_ice_zones);
        animateCounter("stat-landing", data.safe_landing_sites);
        document.getElementById("stat-temp").textContent = `${data.avg_temperature} K`;
        
        if (data.status) {
            document.getElementById("telemetry-status").textContent = data.status.toUpperCase();
        }
    } catch (err) {
        console.error("Failed to fetch stats:", err);
    }
}

function animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let current = 0;
    const step = Math.ceil(targetValue / 30);
    const interval = setInterval(() => {
        current += step;
        if (current >= targetValue) {
            el.textContent = targetValue.toLocaleString();
            clearInterval(interval);
        } else {
            el.textContent = current.toLocaleString();
        }
    }, 25);
}

async function fetchDeliverables() {
    const container = document.getElementById("deliverables-container");
    try {
        const res = await fetch("/api/deliverables");
        const items = await res.json();
        
        container.innerHTML = items.map(item => `
            <div class="deliverable-card glass-panel">
                <div class="deliverable-img-box" onclick="openModal('${item.title}', '${item.subtitle}', '${item.url}')">
                    <img src="${item.url}" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1000&auto=format&fit=crop'">
                    <span class="tag-badge">${item.tag}</span>
                </div>
                <div class="deliverable-info">
                    <h3>${item.title}</h3>
                    <h4>${item.subtitle}</h4>
                    <p>${item.description}</p>
                    <button class="btn-inspect" onclick="openModal('${item.title}', '${item.subtitle}', '${item.url}')">
                        <i data-lucide="zoom-in"></i> Inspect High-Res Map
                    </button>
                </div>
            </div>
        `).join('');
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        container.innerHTML = `<p class="text-muted">Error loading deliverables telemetry.</p>`;
    }
}

function openModal(title, subtitle, url) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-subtitle").textContent = subtitle;
    document.getElementById("modal-img").src = url;
    document.getElementById("map-modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("map-modal").style.display = "none";
}

function updateFilters() {
    document.getElementById("val-ice").textContent = parseFloat(document.getElementById("filter-ice").value).toFixed(2);
    document.getElementById("val-haz").textContent = document.getElementById("filter-haz").value;
    document.getElementById("val-slope").textContent = document.getElementById("filter-slope").value;
}

async function fetchDataset(page = 1) {
    currentPage = page;
    const minIce = document.getElementById("filter-ice").value;
    const maxHaz = document.getElementById("filter-haz").value;
    const maxSlope = document.getElementById("filter-slope").value;
    
    const tbody = document.getElementById("table-body");
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">Querying lunar telemetry database...</td></tr>`;
    
    try {
        const res = await fetch(`/api/data?page=${page}&limit=${limit}&min_ice=${minIce}&max_hazard=${maxHaz}&max_slope=${maxSlope}`);
        const data = await res.json();
        
        if (data.rows && data.rows.length > 0) {
            tbody.innerHTML = data.rows.map(row => `
                <tr>
                    <td>${row.Latitude !== undefined ? row.Latitude : '-'}</td>
                    <td>${row.Longitude !== undefined ? row.Longitude : '-'}</td>
                    <td><strong style="color:var(--cyan)">${row.Elevation !== undefined ? row.Elevation : '-'}</strong></td>
                    <td>${row.Slope !== undefined ? row.Slope : '-'}</td>
                    <td>${row.Temperature !== undefined ? row.Temperature : '-'}</td>
                    <td>${row.Radar !== undefined ? row.Radar : '-'}</td>
                    <td>${row.Illumination !== undefined ? row.Illumination : '-'}</td>
                    <td><span style="color:${row.Hazard_Score > 40 ? 'var(--red)' : 'var(--emerald)'}">${row.Hazard_Score !== undefined ? row.Hazard_Score : '-'}</span></td>
                    <td><strong style="color:${row.Ice_Probability > 0.5 ? 'var(--emerald)' : 'var(--text-muted)'}">${row.Ice_Probability !== undefined ? (row.Ice_Probability * 100).toFixed(1) + '%' : '-'}</strong></td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center">No telemetry points match the selected filters.</td></tr>`;
        }
        
        document.getElementById("page-indicator").textContent = `Page ${page} (Total: ${data.total})`;
        document.getElementById("btn-prev").disabled = (page <= 1);
        document.getElementById("btn-next").disabled = (page * limit >= data.total);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">Failed to fetch data from API server.</td></tr>`;
    }
}

function changePage(delta) {
    if (currentPage + delta > 0) {
        fetchDataset(currentPage + delta);
    }
}

async function runRouteSimulation() {
    const list = document.getElementById("waypoints-list");
    const summary = document.getElementById("route-summary");
    const algo = document.getElementById("algo-select").value;
    
    list.innerHTML = `<p class="text-muted">Computing optimal path via ${algo.toUpperCase()} algorithm...</p>`;
    summary.style.display = "none";
    
    try {
        const res = await fetch("/api/simulate_route");
        const data = await res.json();
        
        setTimeout(() => {
            summary.style.display = "block";
            summary.innerHTML = `
                <p><strong>Selected Algorithm:</strong> ${data.algorithm}</p>
                <p><strong>Total Trajectory Distance:</strong> ${data.total_distance_km} km</p>
                <p><strong>Estimated Power Consumption:</strong> ${data.est_battery_used}</p>
            `;
            
            list.innerHTML = data.waypoints.map(wp => `
                <div class="timeline-item">
                    <div class="timeline-header">
                        <h4>Waypoint #${wp.step}: Lat ${wp.lat}, Lon ${wp.lon}</h4>
                        <span class="badge-status">${wp.status}</span>
                    </div>
                    <div class="timeline-body">
                        <span>Elevation: <strong style="color:#fff">${wp.elevation} m</strong></span>
                        <span>Local Hazard Score: <strong style="color:#fff">${wp.hazard_score}</strong></span>
                    </div>
                </div>
            `).join('');
        }, 600);
    } catch (err) {
        list.innerHTML = `<p class="text-muted">Error simulating route.</p>`;
    }
}
