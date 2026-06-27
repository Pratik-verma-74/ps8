let currentPage = 1;
const limit = 15;

document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) {
        lucide.createIcons();
    }
    fetchStats();
    fetchDeliverables();
    fetchDataset(1);
});

function switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
    
    // Find button based on onclick attribute
    const btns = document.querySelectorAll(".tab-btn");
    if (tabId === 'overview') btns[0].classList.add("active");
    if (tabId === 'explorer') btns[1].classList.add("active");
    if (tabId === 'routing') btns[2].classList.add("active");

    const target = document.getElementById(`tab-${tabId}`);
    if (target) {
        target.classList.add("active");
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
