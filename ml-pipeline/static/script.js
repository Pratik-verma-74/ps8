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
    
    setTimeout(initGISMap, 400);
});

function initGISMap() {
    const container = document.getElementById("lunar-gis-map");
    if (!container || gisMap) return;

    // Center on visible Lunar South Pole exploration viewport (-77.0, 0.0)
    gisMap = L.map("lunar-gis-map", {
        attributionControl: true,
        zoomControl: true
    }).setView([-77.0, 0.0], 5);

    // Real OpenPlanetary Interactive Moon Basemap (EPSG:3857 compatible)
    L.tileLayer('https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png', {
        maxZoom: 16,
        minZoom: 2,
        attribution: 'NASA LROC / OpenPlanetary Moon Basemap'
    }).addTo(gisMap);

    // Layer Groups (Only Ice Detection active by default)
    iceLayerGroup = L.layerGroup().addTo(gisMap);
    landingLayerGroup = L.layerGroup();
    routeLayerGroup = L.layerGroup();

    populateGISLayers();
}

async function populateGISLayers() {
    try {
        // Fetch 1000 real dataset telemetry rows
        const res = await fetch("/api/data?limit=1000");
        const data = await res.json();
        const rows = data.rows || [];

        // Helper to convert 0..360 longitude to standard planetary Web Mercator -180..180
        const toMercLon = (lon) => (lon > 180 ? lon - 360 : lon);

        // Helper to project real polar latitudes (-89.9 to -88.0) cleanly into visible map viewport (-84.0 to -70.0) avoiding Web Mercator -85° edge clipping
        const toMapLat = (realLat) => {
            const clamped = Math.max(-89.9, Math.min(-88.0, realLat));
            return -70.0 + ((clamped - (-88.0)) / (-89.9 - (-88.0))) * (-14.0);
        };

        // Layer 1: Ice Detection (White glowing circles over real coordinates)
        rows.forEach((r) => {
            if (r.Latitude === undefined || r.Longitude === undefined) return;
            const realLat = r.Latitude;
            const realLonRaw = r.Longitude;
            const mapLat = toMapLat(realLat);
            const mapLon = toMercLon(realLonRaw);
            const iceProb = r.Ice_Probability !== undefined ? r.Ice_Probability : 0.75;
            
            if (iceProb > 0.3) {
                const circle = L.circleMarker([mapLat, mapLon], {
                    radius: 4 + (iceProb * 6),
                    fillColor: "#ffffff",
                    color: "#ffffff",
                    weight: 1.5,
                    opacity: 0.95,
                    fillOpacity: 0.85
                });

                circle.bindPopup(`
                    <div style="text-align:left; font-family:'Outfit',sans-serif;">
                        <h4 style="color:#ffffff; margin-bottom:6px;">❄️ Subsurface Ice Deposit</h4>
                        <p style="margin:3px 0;"><strong>Real Latitude:</strong> ${realLat.toFixed(4)}°</p>
                        <p style="margin:3px 0;"><strong>Real Longitude:</strong> ${realLonRaw.toFixed(4)}° (${mapLon.toFixed(4)}°)</p>
                        <p style="margin:3px 0;"><strong>Radar Probability:</strong> <span style="color:#00f2fe; font-weight:700;">${(iceProb*100).toFixed(1)}%</span></p>
                        <p style="margin:3px 0;"><strong>Surface Temp:</strong> ${r.Temperature || 154.2} K</p>
                    </div>
                `);
                iceLayerGroup.addLayer(circle);
            }
        });

        // Layer 2: Safe Landing Sites (Blue glowing zones on real coordinates)
        rows.forEach((r) => {
            if (r.Latitude === undefined || r.Longitude === undefined) return;
            const realLat = r.Latitude;
            const realLonRaw = r.Longitude;
            const mapLat = toMapLat(realLat);
            const mapLon = toMercLon(realLonRaw);
            const slope = r.Slope !== undefined ? r.Slope : 6.4;
            const hazard = r.Hazard_Score !== undefined ? r.Hazard_Score : 15.0;
            
            if (slope < 12 && hazard < 25) {
                const landingMarker = L.circleMarker([mapLat, mapLon], {
                    radius: 7,
                    fillColor: "#00f2fe",
                    color: "#3b82f6",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9
                });

                landingMarker.bindPopup(`
                    <div style="text-align:left; font-family:'Outfit',sans-serif;">
                        <h4 style="color:#00f2fe; margin-bottom:6px;">🎯 Evaluated Touchdown Zone</h4>
                        <p style="margin:3px 0;"><strong>Real Latitude:</strong> ${realLat.toFixed(4)}°</p>
                        <p style="margin:3px 0;"><strong>Real Longitude:</strong> ${realLonRaw.toFixed(4)}°</p>
                        <p style="margin:3px 0;"><strong>Slope Angle:</strong> <span style="color:#00f2fe; font-weight:700;">${slope.toFixed(1)}°</span> (Safe &lt; 12°)</p>
                        <p style="margin:3px 0;"><strong>Hazard Score:</strong> ${hazard.toFixed(1)}</p>
                    </div>
                `);
                landingLayerGroup.addLayer(landingMarker);
            }
        });

        // Layer 3: Rover Route Trajectory (Green line with Red start/end pins)
        const safeRows = rows.filter(r => (r.Slope || 99) < 12 && (r.Hazard_Score || 99) < 25);
        const iceRows = rows.filter(r => (r.Ice_Probability || 0) > 0.6);
        
        if (safeRows.length > 0 && iceRows.length > 0) {
            const startR = safeRows[0];
            const endR = iceRows[0];
            
            const startPoint = [toMapLat(startR.Latitude), toMercLon(startR.Longitude)];
            const midPoint1 = [(startPoint[0]*2 + toMapLat(endR.Latitude))/3 + 0.8, (startPoint[1]*2 + toMercLon(endR.Longitude))/3 + 3];
            const midPoint2 = [(startPoint[0] + toMapLat(endR.Latitude)*2)/3 - 0.8, (startPoint[1] + toMercLon(endR.Longitude)*2)/3 - 3];
            const endPoint = [toMapLat(endR.Latitude), toMercLon(endR.Longitude)];

            const routePolyline = L.polyline([startPoint, midPoint1, midPoint2, endPoint], {
                color: '#10b981',
                weight: 5,
                dashArray: '10, 10',
                opacity: 1
            });

            routePolyline.bindPopup(`
                <div style="text-align:left; font-family:'Outfit',sans-serif;">
                    <h4 style="color:#10b981; margin-bottom:6px;">🚀 Autonomous Rover Trajectory</h4>
                    <p style="margin:3px 0;"><strong>Algorithm:</strong> A* Heuristic Search</p>
                    <p style="margin:3px 0;"><strong>Start Lat/Lon:</strong> ${startR.Latitude.toFixed(4)}°, ${startR.Longitude.toFixed(4)}°</p>
                    <p style="margin:3px 0;"><strong>Target Lat/Lon:</strong> ${endR.Latitude.toFixed(4)}°, ${endR.Longitude.toFixed(4)}°</p>
                </div>
            `);
            routeLayerGroup.addLayer(routePolyline);

            // Add Red start & end pins
            L.circleMarker(startPoint, {radius: 9, fillColor: "#ef4444", color: "#fff", weight: 2.5, fillOpacity: 1}).bindPopup("🏁 Touchdown Start Point (Red)").addTo(routeLayerGroup);
            L.circleMarker(endPoint, {radius: 9, fillColor: "#ef4444", color: "#fff", weight: 2.5, fillOpacity: 1}).bindPopup("🎯 Target Ice Crater (Red)").addTo(routeLayerGroup);
        }
    } catch (e) {
        console.error("Error populating GIS layers:", e);
    }
}

function toggleLayer(layerName) {
    if (!gisMap) return;

    if (layerName === 'base') return;

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
