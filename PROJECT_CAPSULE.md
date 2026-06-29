# ISRO Lunar South Pole Mission Control — Project Capsule

> **Purpose**: This capsule serves as a permanent knowledge summary and architectural breakdown of the codebase. Read this document to understand the structure, tech stack, data flows, and key components without needing to rescan the entire repository.

---

## 1. System Overview & Tech Stack

The project is an AI-powered **Lunar South Pole Mission Control & GIS Dashboard** developed for ISRO. It combines rich interactive GIS visualizations, lunar ice volume estimations, hazard mapping, traverse path planning, and real-time telemetry into a unified modern web interface.

### **Frontend Stack**
- **Framework**: React 18 + TypeScript + Vite (`v5`)
- **Routing**: React Router DOM (`v7`) with modular nested routes under an `AppShell`
- **Styling**: Tailwind CSS (`v4` CLI build via `npm run build:css`) + Custom Glassmorphism & Neon theme (`index.css`)
- **Animation & UI**: Framer Motion, Lucide React, React Icons
- **Mapping**: Leaflet / React-Leaflet (`v5`) for interactive lunar surface layers

### **Backend & ML Pipeline Stack**
- **Core API**: Python FastAPI (`ml-pipeline/main.py`) running data serving, filtering, and analysis endpoints.
- **Serverless Wrapper**: Vercel Serverless Function entrypoint at `api/index.py` wrapping the FastAPI instance.
- **Data Layer**: Pandas DataFrame in-memory caching loading pre-processed CSV datasets (`final_combined_lunar_dataset.csv`, `ice_volume.csv`, `safe_landing.csv`, `path_planning.csv`).
- **Pathfinding**: A* algorithm implementation (`ml-pipeline/src/pathfinding/astar.py`) for rover traverse planning.

---

## 2. Directory & Module Breakdown

```text
d:\isro project8\
├── api/
│   └── index.py                # Vercel serverless adapter importing FastAPI app from ml-pipeline
├── backend/
│   ├── main.py                 # Lightweight health check & fallback API service
│   └── requirements.txt
├── frontend/
│   ├── package.json            # Scripts: dev, build:css, build, preview
│   ├── src/
│   │   ├── App.tsx             # Main router configuration mapping URLs to dashboard modules
│   │   ├── index.css           # Design system tokens, Tailwind directives & glassmorphism styling
│   │   ├── components/
│   │   │   ├── core/           # Reusable UI primitives (GlassCard.tsx, NeonButton.tsx)
│   │   │   └── layout/         # Shell components (AppShell.tsx, Sidebar.tsx, TopNav.tsx)
│   │   ├── features/           # Feature-specific dashboard views (See Section 3)
│   │   └── utils/
│   │       └── api.ts          # API client interfaces & fetch wrappers with graceful mock fallbacks
├── ml-pipeline/
│   ├── main.py                 # Primary FastAPI server handling lunar datasets & analytics
│   ├── generate_real_satellite_maps.py # Script for processing lunar raster/map layers
│   ├── create_sublayer_csvs.py # Script generating sublayer CSVs (ice, landing, traverse)
│   └── src/
│       ├── pathfinding/astar.py# Rover route optimization algorithm
│       └── data_processing/    # Data parsing tools (PDS4 parser)
└── vercel.json                 # Vercel deployment configuration routing /api/* to api/index.py
```

---

## 3. Frontend Feature Modules & Route Mapping

All feature modules are self-contained under `frontend/src/features/` and rendered inside the `AppShell` layout:

| Route Path | Component | Description |
| :--- | :--- | :--- |
| `/all-in-one`, `/mission-control` | `AllInOneDashboard.tsx` | Unified command center combining GIS map, stats, and critical telemetry. |
| `/gis-only`, `/*` | `Dashboard.tsx` | Full-screen interactive lunar GIS map with layer toggling. |
| `/intelligence`, `/science/ice-volume` | `IceMappingDashboard.tsx` | Lunar ice probability heatmap, subsurface depth, and volume estimations. |
| `/planning/traverse`, `/planning/landing` | `PathPlanningDashboard.tsx` | Safe touchdown assessment and A* waypoint traverse path planning. |
| `/analytics/radar` | `RadarDashboard.tsx` | Subsurface radar tracking and hazard evaluation metrics. |
| `/twin` | `DigitalTwinDashboard.tsx` | 3D/Digital Twin simulation view of spacecraft and rover operations. |
| `/simulation` | `SimulationDashboard.tsx` | Interactive mission scenario simulation and stress testing. |
| `/telemetry`, `/reports` | `TelemetryDashboard.tsx` | Real-time sensor feeds, power/thermal telemetry, and mission reports. |

---

## 4. API Endpoints & Data Flow

Frontend requests go through `API_BASE_URL` defined in `frontend/src/utils/api.ts`. If the backend is unreachable, the API layer automatically gracefully falls back to local mock data ensuring UI continuity.

Key FastAPI endpoints (`ml-pipeline/main.py`):
- `GET /api/stats`: Returns overall mission KPIs (`total_data_points`, `high_ice_zones`, `safe_landing_sites`, etc.).
- `GET /api/ice`: Paginated list of lunar ice crater predictions.
- `GET /api/landing`: Touchdown safety grades, slope, and hazard scores.
- `GET /api/path`: Waypoint sequence for safe rover traverse.

---

## 5. Quick Development Commands

### **Run Frontend Dev Server**
```bash
cd frontend
npm run build:css   # Build Tailwind CSS v4 bundle
npm run dev         # Starts Vite dev server (usually http://localhost:5173)
```

### **Run Backend API Server**
```bash
# Run the rich ML pipeline backend on port 8000
python -m uvicorn ml-pipeline.main:app --reload --port 8000

# Or run lightweight backend stub
python -m uvicorn backend.main:app --reload --port 8000
```
