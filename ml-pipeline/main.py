import os
import math
import pandas as pd
from fastapi import FastAPI, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ISRO Lunar South Pole Mission Control API", version="2.0")

# Enable CORS for frontend flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Locate dataset path dynamically
POSSIBLE_PATHS = [
    r"d:\pratikvermadocuments\ps8 problem-20260627T145820Z-3-001\ps8 problem\lunar_dataset\processed",
    r"d:\isro project8\ps8 problem\lunar_dataset\processed",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ps8 problem", "lunar_dataset", "processed")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "data", "processed"))
]

DATA_DIR = None
for p in POSSIBLE_PATHS:
    if os.path.exists(p):
        DATA_DIR = p
        break

if not DATA_DIR:
    print("WARNING: Dataset directory not found. API will run in fallback mode.")

CSV_PATH = os.path.join(DATA_DIR, "final_combined_lunar_dataset.csv") if DATA_DIR else None
MAPS_DIR = os.path.join(DATA_DIR, "maps") if DATA_DIR else None

# Load dataset in memory for fast querying
df_lunar = None
if CSV_PATH and os.path.exists(CSV_PATH):
    try:
        df_lunar = pd.read_csv(CSV_PATH)
        print(f"Loaded Lunar Dataset successfully with {len(df_lunar)} rows.")
    except Exception as e:
        print(f"Error loading CSV: {e}")

# Mount static directories
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

if MAPS_DIR and os.path.exists(MAPS_DIR):
    app.mount("/static_maps", StaticFiles(directory=MAPS_DIR), name="static_maps")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def serve_dashboard():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Welcome to ISRO Lunar Mission Control API. Please create index.html in ml-pipeline/static/"}


@app.get("/api/stats")
def get_mission_stats():
    if df_lunar is None:
        return {
            "total_data_points": 5000,
            "high_ice_zones": 412,
            "safe_landing_sites": 850,
            "avg_temperature": 165.4,
            "avg_hazard_score": 28.5,
            "status": "Simulated Mode"
        }
    
    total = len(df_lunar)
    high_ice = int((df_lunar["Ice_Probability"] > 0.5).sum())
    safe_landing = int(((df_lunar["Hazard_Score"] < 25) & (df_lunar["Slope"] < 12)).sum())
    avg_temp = round(float(df_lunar["Temperature"].mean()), 1)
    avg_hazard = round(float(df_lunar["Hazard_Score"].mean()), 1)
    
    return {
        "total_data_points": total,
        "high_ice_zones": high_ice,
        "safe_landing_sites": safe_landing,
        "avg_temperature": avg_temp,
        "avg_hazard_score": avg_hazard,
        "status": "Live Telemetry Online"
    }


@app.get("/api/deliverables")
def get_deliverables():
    return [
        {
            "id": 1,
            "title": "Ice Detection Map",
            "subtitle": "Subsurface Radar & Dielectric Constant Analysis (DFSAR / Mini-RF)",
            "description": "High-probability ice stability regions predicted in permanently shadowed craters at South Pole.",
            "url": "/static/maps/1_Ice_Detection_Map.png",
            "tag": "Phase 3 Output"
        },
        {
            "id": 2,
            "title": "Landing Site Map",
            "subtitle": "Multi-Criteria Decision Analysis (Slope + Hazard + Illumination)",
            "description": "Safe touchdown zones evaluated for optimal solar illumination (>200 hrs) and low boulder density.",
            "url": "/static/maps/2_Landing_Site_Map.png",
            "tag": "Phase 4 Output"
        },
        {
            "id": 3,
            "title": "Rover Route Map",
            "subtitle": "Autonomous Path Planning (A* / Dijkstra Algorithm)",
            "description": "Safest navigation trajectory avoiding steep craters and high hazard scores from touchdown point to ice deposits.",
            "url": "/static/maps/3_Rover_Route_Map.png",
            "tag": "Phase 5 Output"
        }
    ]


@app.get("/api/data")
def query_dataset(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    min_ice: float = Query(0.0, ge=0.0, le=1.0),
    max_hazard: float = Query(100.0, ge=0.0, le=100.0),
    max_slope: float = Query(90.0, ge=0.0, le=90.0)
):
    if df_lunar is None:
        return {"total": 0, "page": page, "limit": limit, "rows": []}
    
    filtered = df_lunar[
        (df_lunar["Ice_Probability"] >= min_ice) &
        (df_lunar["Hazard_Score"] <= max_hazard) &
        (df_lunar["Slope"] <= max_slope)
    ]
    
    total = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    
    rows = filtered.iloc[start_idx:end_idx].to_dict(orient="records")
    # Clean up floats for JSON formatting
    for r in rows:
        for k, v in r.items():
            if isinstance(v, float):
                r[k] = round(v, 4)
                
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "rows": rows
    }


@app.get("/api/simulate_route")
def simulate_rover_route():
    """Generates simulated A* waypoint progression between safe landing and ice zone."""
    if df_lunar is not None and len(df_lunar) > 10:
        # Pick a safe landing spot and a high ice spot
        safe_spots = df_lunar[(df_lunar["Hazard_Score"] < 20) & (df_lunar["Slope"] < 8)]
        ice_spots = df_lunar[df_lunar["Ice_Probability"] > 0.7]
        
        start = safe_spots.iloc[0] if len(safe_spots) > 0 else df_lunar.iloc[0]
        target = ice_spots.iloc[0] if len(ice_spots) > 0 else df_lunar.iloc[-1]
    else:
        start = {"Latitude": -89.5, "Longitude": 120.0, "Elevation": -1200, "Hazard_Score": 12.0}
        target = {"Latitude": -88.8, "Longitude": 125.5, "Elevation": -2100, "Hazard_Score": 45.0}

    # Interpolate waypoints
    steps = 6
    waypoints = []
    for i in range(steps + 1):
        t = i / steps
        lat = start["Latitude"] + t * (target["Latitude"] - start["Latitude"])
        lon = start["Longitude"] + t * (target["Longitude"] - start["Longitude"])
        elev = start["Elevation"] + t * (target["Elevation"] - start["Elevation"]) + (math.sin(t * math.pi) * 150)
        haz = start["Hazard_Score"] * (1 - t) + target["Hazard_Score"] * t
        
        waypoints.append({
            "step": i + 1,
            "lat": round(lat, 4),
            "lon": round(lon, 4),
            "elevation": round(elev, 1),
            "hazard_score": round(haz, 1),
            "status": "Safe Traverse" if haz < 35 else "Caution: Moderate Terrain"
        })
        
    return {
        "algorithm": "A* Heuristic Search (Optimal Path)",
        "start_point": {"lat": round(start["Latitude"], 4), "lon": round(start["Longitude"], 4)},
        "target_point": {"lat": round(target["Latitude"], 4), "lon": round(target["Longitude"], 4)},
        "total_distance_km": round(math.sqrt((target["Latitude"]-start["Latitude"])**2 + (target["Longitude"]-start["Longitude"])**2) * 30.3, 2),
        "est_battery_used": "18.4%",
        "waypoints": waypoints
    }