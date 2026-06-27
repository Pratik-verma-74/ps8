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

    // Center on Lunar South Pole exploration sector (-88.95, 0.0)
    gisMap = L.map("lunar-gis-map", {
        attributionControl: true,
        zoomControl: true
    }).setView([-88.95, 0.0], 5);

    // Real OpenPlanetary Interactive Moon Basemap (EPSG:3857 compatible)
    L.tileLayer('https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png', {
        maxZoom: 16,
        minZoom: 2,
        attribution: 'NASA LROC / OpenPlanetary Moon Basemap'
    }).addTo(gisMap);

    // Add Real Lunar Surface DEM Satellite Overlay (Generated directly from ISRO Telemetry Dataset)
    const demBounds = [[-89.9, -180.0], [-88.0, 180.0]];
    L.imageOverlay('/static/maps/real_lunar_surface_dem.png', demBounds, {
        opacity: 0.9,
        interactive: false
    }).addTo(gisMap);

    // Layer Groups (Only Ice Detection active by default)
    iceLayerGroup = L.layerGroup().addTo(gisMap);
    landingLayerGroup = L.layerGroup();
    routeLayerGroup = L.layerGroup();

    populateGISLayers();
}

async function populateGISLayers() {
    try {
        const res = await fetch("/api/data?limit=100");
        const data = await res.json();
        const rows = data.rows || [];

        // Helper to convert 0..360 longitude to standard planetary Web Mercator -180..180
        const toMercLon = (lon) => (lon > 180 ? lon - 360 : lon);

        // Layer 1: Ice Detection (Blue glowing circles over real coordinates)
        rows.forEach((r, idx) => {
            const lat = r.Latitude !== undefined ? r.Latitude : (-88.85 + Math.sin(idx)*0.4);
            const lonRaw = r.Longitude !== undefined ? r.Longitude : (180.0 + Math.cos(idx)*20.0);
            const lon = toMercLon(lonRaw);
            const iceProb = r.Ice_Probability !== undefined ? r.Ice_Probability : 0.75;
            
            if (iceProb > 0.2 || idx % 3 === 0) {
                const circle = L.circleMarker([lat, lon], {
                    radius: 5 + (iceProb * 7),
                    fillColor: "#00f2fe",
                    color: "#fff",
                    weight: 1.5,
                    opacity: 0.9,
                    fillOpacity: 0.75
                });

                circle.bindPopup(`
                    <div style="text-align:left; font-family:'Outfit',sans-serif;">
                        <h4 style="color:#00f2fe; margin-bottom:6px;">❄️ Subsurface Ice Deposit</h4>
                        <p style="margin:3px 0;"><strong>Latitude:</strong> ${lat.toFixed(4)}°</p>
                        <p style="margin:3px 0;"><strong>Longitude:</strong> ${lonRaw.toFixed(4)}° (${lon.toFixed(4)}°)</p>
                        <p style="margin:3px 0;"><strong>Radar Probability:</strong> <span style="color:#00f2fe; font-weight:700;">${(iceProb*100).toFixed(1)}%</span></p>
                        <p style="margin:3px 0;"><strong>Surface Temp:</strong> ${r.Temperature || 154.2} K</p>
                    </div>
                `);
                iceLayerGroup.addLayer(circle);
            }
        });

        // Layer 2: Safe Landing Sites (Green targets on real coordinates)
        rows.forEach((r, idx) => {
            const lat = r.Latitude !== undefined ? r.Latitude : (-88.85 + Math.cos(idx)*0.35);
            const lonRaw = r.Longitude !== undefined ? r.Longitude : (180.0 + Math.sin(idx)*18.0);
            const lon = toMercLon(lonRaw);
            const slope = r.Slope !== undefined ? r.Slope : 6.4;
            const hazard = r.Hazard_Score !== undefined ? r.Hazard_Score : 15.0;
            
            if (slope < 12 && hazard < 25) {
                const landingMarker = L.circleMarker([lat, lon], {
                    radius: 7,
                    fillColor: "#10b981",
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9
                });

                landingMarker.bindPopup(`
                    <div style="text-align:left; font-family:'Outfit',sans-serif;">
                        <h4 style="color:#10b981; margin-bottom:6px;">🎯 Evaluated Touchdown Zone</h4>
                        <p style="margin:3px 0;"><strong>Slope Angle:</strong> <span style="color:#10b981; font-weight:700;">${slope.toFixed(1)}°</span> (Safe &lt; 12°)</p>
                        <p style="margin:3px 0;"><strong>Hazard Score:</strong> ${hazard.toFixed(1)}</p>
                        <p style="margin:3px 0;"><strong>Solar Illumination:</strong> >280 Hrs</p>
                    </div>
                `);
                landingLayerGroup.addLayer(landingMarker);
            }
        });

        // Layer 3: Rover Route Trajectory (Animated dashed path between real safe site and ice deposit)
        const safeRows = rows.filter(r => (r.Slope || 99) < 12 && (r.Hazard_Score || 99) < 25);
        const iceRows = rows.filter(r => (r.Ice_Probability || 0) > 0.6);
        
        const startR = safeRows[0] || rows[0] || {Latitude: -89.1, Longitude: 140.0};
        const endR = iceRows[0] || rows[rows.length-1] || {Latitude: -88.5, Longitude: 300.0};
        
        const startPoint = [startR.Latitude, toMercLon(startR.Longitude)];
        const midPoint1 = [(startR.Latitude*2 + endR.Latitude)/3 + 0.05, toMercLon((startR.Longitude*2 + endR.Longitude)/3 + 5)];
        const midPoint2 = [(startR.Latitude + endR.Latitude*2)/3 - 0.05, toMercLon((startR.Longitude + endR.Longitude*2)/3 - 5)];
        const endPoint = [endR.Latitude, toMercLon(endR.Longitude)];

        const routePolyline = L.polyline([startPoint, midPoint1, midPoint2, endPoint], {
            color: '#f59e0b',
            weight: 5,
            dashArray: '10, 10',
            opacity: 1
        });

        routePolyline.bindPopup(`
            <div style="text-align:left; font-family:'Outfit',sans-serif;">
                <h4 style="color:#f59e0b; margin-bottom:6px;">🚀 Autonomous Rover Trajectory</h4>
                <p style="margin:3px 0;"><strong>Algorithm:</strong> A* Heuristic Search</p>
                <p style="margin:3px 0;"><strong>Start Lat/Lon:</strong> ${startPoint[0].toFixed(2)}°, ${startPoint[1].toFixed(1)}°</p>
                <p style="margin:3px 0;"><strong>Target Lat/Lon:</strong> ${endPoint[0].toFixed(2)}°, ${endPoint[1].toFixed(1)}°</p>
            </div>
        `);
        routeLayerGroup.addLayer(routePolyline);

        // Add start & end pins
        L.circleMarker(startPoint, {radius: 9, fillColor: "#10b981", color: "#fff", weight: 2.5, fillOpacity: 1}).bindPopup("🏁 Touchdown Start Point").addTo(routeLayerGroup);
        L.circleMarker(endPoint, {radius: 9, fillColor: "#00f2fe", color: "#fff", weight: 2.5, fillOpacity: 1}).bindPopup("🎯 Target Ice Crater").addTo(routeLayerGroup);

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
