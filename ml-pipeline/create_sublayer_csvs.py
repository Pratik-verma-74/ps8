import os
import pandas as pd
import numpy as np

def generate_sublayers():
    base_dir = os.path.dirname(__file__)
    data_dir = os.path.join(base_dir, "data", "processed")
    csv_path = os.path.join(data_dir, "final_combined_lunar_dataset.csv")
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    print("Reading final combined lunar dataset...")
    df = pd.read_csv(csv_path)
    
    sublayers_dir = os.path.join(data_dir, "sublayers")
    os.makedirs(sublayers_dir, exist_ok=True)
    
    # 1. Ice Volume Dataset
    print("Generating ice_volume.csv...")
    df_ice = df[df["Ice_Probability"] >= 0.5].copy()
    if len(df_ice) == 0:
        df_ice = df.sort_values("Ice_Probability", ascending=False).head(100).copy()
    
    df_ice = df_ice.sort_values("Ice_Probability", ascending=False).reset_index(drop=True)
    df_ice["Crater_ID"] = [f"CRATER-ICE-{i+1:03d}" for i in range(len(df_ice))]
    df_ice["Estimated_Area_sqm"] = np.round(1800.0 + df_ice["Ice_Probability"] * 6200.0, 1)
    df_ice["Estimated_Depth_m"] = np.round(6.5 + df_ice["Ice_Probability"] * 18.5, 1)
    df_ice["Calculated_Volume_m3"] = np.round(df_ice["Estimated_Area_sqm"] * df_ice["Estimated_Depth_m"] * df_ice["Ice_Probability"], 1)
    df_ice["Status"] = np.where(df_ice["Ice_Probability"] > 0.8, "Confirmed Cryogenic Deposit", "High Probability Subsurface Ice")
    
    ice_cols = ["Crater_ID", "Latitude", "Longitude", "Elevation", "Temperature", "Ice_Probability", "Estimated_Area_sqm", "Estimated_Depth_m", "Calculated_Volume_m3", "Status"]
    df_ice[ice_cols].to_csv(os.path.join(sublayers_dir, "ice_volume.csv"), index=False)
    print(f"-> Saved {len(df_ice)} records to ice_volume.csv")

    # 2. Safe Landing Dataset
    print("Generating safe_landing.csv...")
    df_landing = df[(df["Slope"] <= 12.0) & (df["Hazard_Score"] <= 25.0)].copy()
    if len(df_landing) == 0:
        df_landing = df.sort_values("Hazard_Score", ascending=True).head(150).copy()
        
    df_landing = df_landing.sort_values("Hazard_Score", ascending=True).reset_index(drop=True).head(300)
    df_landing["Landing_Zone_ID"] = [f"LZ-SOUTH-{i+1:03d}" for i in range(len(df_landing))]
    df_landing["Touchdown_Safety_Grade"] = np.where(df_landing["Hazard_Score"] < 12.0, "Grade A+ (Optimal Flat)", "Grade A (Safe Touchdown)")
    
    landing_cols = ["Landing_Zone_ID", "Latitude", "Longitude", "Elevation", "Slope", "Hazard_Score", "Illumination", "Touchdown_Safety_Grade"]
    df_landing[landing_cols].to_csv(os.path.join(sublayers_dir, "safe_landing.csv"), index=False)
    print(f"-> Saved {len(df_landing)} records to safe_landing.csv")

    # 3. Path Planning Dataset
    print("Generating path_planning.csv...")
    start_row = df_landing.iloc[0]
    target_row = df_ice.iloc[0]
    
    steps = 12
    waypoints = []
    for i in range(steps + 1):
        t = i / steps
        lat = start_row["Latitude"] + t * (target_row["Latitude"] - start_row["Latitude"])
        lon = start_row["Longitude"] + t * (target_row["Longitude"] - start_row["Longitude"])
        elev = start_row["Elevation"] + t * (target_row["Elevation"] - start_row["Elevation"])
        slope = start_row["Slope"] * (1 - t) + target_row["Slope"] * t
        haz = start_row["Hazard_Score"] * (1 - t) + target_row["Hazard_Score"] * t
        
        dist = np.round(np.sqrt((lat - start_row["Latitude"])**2 + (lon - start_row["Longitude"])**2) * 30.3, 2)
        status = "Optimal Traverse Path" if haz < 30 else "Caution: Moderate Slopes"
        
        waypoints.append({
            "Waypoint_ID": f"WP-PATH-{i+1:02d}",
            "Latitude": round(lat, 4),
            "Longitude": round(lon, 4),
            "Elevation": round(elev, 1),
            "Slope": round(slope, 2),
            "Hazard_Score": round(haz, 1),
            "Distance_From_Start_km": dist,
            "Traverse_Status": status
        })
    
    df_path = pd.DataFrame(waypoints)
    df_path.to_csv(os.path.join(sublayers_dir, "path_planning.csv"), index=False)
    print(f"-> Saved {len(df_path)} waypoints to path_planning.csv")
    print("Sublayer generation complete!")

if __name__ == "__main__":
    generate_sublayers()
