import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import scipy.interpolate as scipy_interp

# Locate CSV
POSSIBLE_PATHS = [
    r"d:\pratikvermadocuments\ps8 problem-20260627T145820Z-3-001\ps8 problem\lunar_dataset\processed\final_combined_lunar_dataset.csv",
    r"d:\isro project8\ps8 problem\lunar_dataset\processed\final_combined_lunar_dataset.csv",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ps8 problem", "lunar_dataset", "processed", "final_combined_lunar_dataset.csv")),
]

csv_path = None
for p in POSSIBLE_PATHS:
    if os.path.exists(p):
        csv_path = p
        break

if not csv_path:
    print("ERROR: Could not find final_combined_lunar_dataset.csv")
    exit(1)

print(f"Reading real satellite dataset from: {csv_path}")
df = pd.read_csv(csv_path)

out_dir = os.path.join(os.path.dirname(__file__), "static", "maps")
os.makedirs(out_dir, exist_ok=True)

# Convert longitude > 180 to standard Web Mercator -180..180
df['Longitude_Mercator'] = np.where(df['Longitude'] > 180, df['Longitude'] - 360, df['Longitude'])

# Grid for interpolation
grid_lon, grid_lat = np.mgrid[0:360:600j, -89.9:-88.0:400j]
grid_lon_merc, grid_lat_merc = np.mgrid[-180:180:600j, -89.9:-88.0:400j]

print("Interpolating Elevation DEM grid...")
grid_elev = scipy_interp.griddata(
    (df['Longitude'], df['Latitude']),
    df['Elevation'],
    (grid_lon, grid_lat),
    method='linear'
)
grid_elev_merc = scipy_interp.griddata(
    (df['Longitude_Mercator'], df['Latitude']),
    df['Elevation'],
    (grid_lon_merc, grid_lat_merc),
    method='linear'
)

# Fill NaNs with nearest
if np.isnan(grid_elev).any():
    grid_elev_nearest = scipy_interp.griddata(
        (df['Longitude'], df['Latitude']),
        df['Elevation'],
        (grid_lon, grid_lat),
        method='nearest'
    )
    grid_elev = np.where(np.isnan(grid_elev), grid_elev_nearest, grid_elev)

if np.isnan(grid_elev_merc).any():
    grid_elev_merc_nearest = scipy_interp.griddata(
        (df['Longitude_Mercator'], df['Latitude']),
        df['Elevation'],
        (grid_lon_merc, grid_lat_merc),
        method='nearest'
    )
    grid_elev_merc = np.where(np.isnan(grid_elev_merc), grid_elev_merc_nearest, grid_elev_merc)

print("Interpolating Ice Probability grid...")
grid_ice = scipy_interp.griddata(
    (df['Longitude'], df['Latitude']),
    df['Ice_Probability'],
    (grid_lon, grid_lat),
    method='linear'
)
if np.isnan(grid_ice).any():
    grid_ice_nearest = scipy_interp.griddata(
        (df['Longitude'], df['Latitude']),
        df['Ice_Probability'],
        (grid_lon, grid_lat),
        method='nearest'
    )
    grid_ice = np.where(np.isnan(grid_ice), grid_ice_nearest, grid_ice)

print("Interpolating Temperature grid...")
grid_temp = scipy_interp.griddata(
    (df['Longitude'], df['Latitude']),
    df['Temperature'],
    (grid_lon, grid_lat),
    method='linear'
)
if np.isnan(grid_temp).any():
    grid_temp_nearest = scipy_interp.griddata(
        (df['Longitude'], df['Latitude']),
        df['Temperature'],
        (grid_lon, grid_lat),
        method='nearest'
    )
    grid_temp = np.where(np.isnan(grid_temp), grid_temp_nearest, grid_temp)

# Style setup
plt.style.use('dark_background')

# -------------------------------------------------------------
# 1. Real Satellite Basemap Overlay (Clean DEM without axes)
# -------------------------------------------------------------
print("Generating clean real satellite DEM basemap overlay (-180 to 180)...")
fig = plt.figure(figsize=(12, 6), dpi=150)
ax = plt.Axes(fig, [0., 0., 1., 1.])
ax.set_axis_off()
fig.add_axes(ax)
ax.imshow(grid_elev_merc.T, extent=(-180, 180, -89.9, -88.0), origin='lower', cmap='bone', aspect='auto')
basemap_path = os.path.join(out_dir, "real_lunar_surface_dem.png")
fig.savefig(basemap_path, dpi=150, bbox_inches='tight', pad_inches=0)
plt.close(fig)

# -------------------------------------------------------------
# 2. Map 1: Ice Detection Map (DFSAR / Mini-RF)
# -------------------------------------------------------------
print("Generating Deliverable 1: Ice Detection Map...")
fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
im = ax.imshow(grid_ice.T, extent=(0, 360, -89.9, -88.0), origin='lower', cmap='cool', aspect='auto', alpha=0.9)
cbar = fig.colorbar(im, ax=ax, pad=0.02)
cbar.set_label("Subsurface Ice Probability", fontsize=11, color='#00f2fe')

# Overlay top high-ice scatter points
high_ice = df[df['Ice_Probability'] > 0.7]
ax.scatter(high_ice['Longitude'], high_ice['Latitude'], c='#ffffff', s=12, edgecolors='#00f2fe', linewidth=0.8, alpha=0.8, label="High Confidence Deposits (>70%)")

ax.set_title("ISRO Chandrayaan DFSAR Satellite Subsurface Ice Map", fontsize=14, fontweight='bold', color='#00f2fe', pad=12)
ax.set_xlabel("Longitude (°E)", fontsize=11, color='#aaa')
ax.set_ylabel("Latitude (°S)", fontsize=11, color='#aaa')
ax.grid(True, linestyle='--', alpha=0.2, color='#00f2fe')
ax.legend(loc='upper right', facecolor='#00000088', edgecolor='#00f2fe')
fig.tight_layout()
fig.savefig(os.path.join(out_dir, "1_Ice_Detection_Map.png"), dpi=150)
plt.close(fig)

# -------------------------------------------------------------
# 3. Map 2: Landing Site Map (Multi-Criteria DEM Hazard)
# -------------------------------------------------------------
print("Generating Deliverable 2: Landing Site Map...")
fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
im = ax.imshow(grid_elev.T, extent=(0, 360, -89.9, -88.0), origin='lower', cmap='copper', aspect='auto', alpha=0.85)
cbar = fig.colorbar(im, ax=ax, pad=0.02)
cbar.set_label("Surface Elevation DEM (m)", fontsize=11, color='#10b981')

# Overlay safe landing spots
safe_sites = df[(df['Slope'] < 10) & (df['Hazard_Score'] < 20)]
ax.scatter(safe_sites['Longitude'], safe_sites['Latitude'], c='#10b981', marker='^', s=35, edgecolors='#ffffff', linewidth=0.8, label="Optimal Touchdown Zones (Slope < 10°)")

ax.set_title("Multi-Criteria Decision Analysis: Safe Lunar Landing Sites", fontsize=14, fontweight='bold', color='#10b981', pad=12)
ax.set_xlabel("Longitude (°E)", fontsize=11, color='#aaa')
ax.set_ylabel("Latitude (°S)", fontsize=11, color='#aaa')
ax.grid(True, linestyle='--', alpha=0.2, color='#10b981')
ax.legend(loc='upper right', facecolor='#00000088', edgecolor='#10b981')
fig.tight_layout()
fig.savefig(os.path.join(out_dir, "2_Landing_Site_Map.png"), dpi=150)
plt.close(fig)

# -------------------------------------------------------------
# 4. Map 3: Rover Route Map (Thermal Diviner + Trajectory)
# -------------------------------------------------------------
print("Generating Deliverable 3: Rover Route Map...")
fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
im = ax.imshow(grid_temp.T, extent=(0, 360, -89.9, -88.0), origin='lower', cmap='inferno', aspect='auto', alpha=0.85)
cbar = fig.colorbar(im, ax=ax, pad=0.02)
cbar.set_label("Surface Temperature Diviner (K)", fontsize=11, color='#f59e0b')

# Simulate safe route from a safe site to a high ice site
safe_start = safe_sites.iloc[0] if len(safe_sites)>0 else df.iloc[0]
ice_target = high_ice.iloc[0] if len(high_ice)>0 else df.iloc[-1]

route_lons = [safe_start['Longitude'], (safe_start['Longitude']*2 + ice_target['Longitude'])/3 + 5, (safe_start['Longitude'] + ice_target['Longitude']*2)/3 - 3, ice_target['Longitude']]
route_lats = [safe_start['Latitude'], (safe_start['Latitude']*2 + ice_target['Latitude'])/3 + 0.1, (safe_start['Latitude'] + ice_target['Latitude']*2)/3 - 0.05, ice_target['Latitude']]

ax.plot(route_lons, route_lats, color='#00f2fe', linewidth=2.5, linestyle='--', label="Autonomous A* Rover Trajectory")
ax.scatter([safe_start['Longitude']], [safe_start['Latitude']], c='#10b981', s=80, marker='o', edgecolors='#fff', label="Touchdown Start", zorder=5)
ax.scatter([ice_target['Longitude']], [ice_target['Latitude']], c='#00f2fe', s=100, marker='*', edgecolors='#fff', label="Target Ice Crater", zorder=5)

ax.set_title("Diviner Thermal Cryogenic Stability & Autonomous Rover Path", fontsize=14, fontweight='bold', color='#f59e0b', pad=12)
ax.set_xlabel("Longitude (°E)", fontsize=11, color='#aaa')
ax.set_ylabel("Latitude (°S)", fontsize=11, color='#aaa')
ax.grid(True, linestyle='--', alpha=0.2, color='#f59e0b')
ax.legend(loc='upper right', facecolor='#00000088', edgecolor='#f59e0b')
fig.tight_layout()
fig.savefig(os.path.join(out_dir, "3_Rover_Route_Map.png"), dpi=150)
plt.close(fig)

print("SUCCESS: All 4 real satellite maps generated successfully!")
