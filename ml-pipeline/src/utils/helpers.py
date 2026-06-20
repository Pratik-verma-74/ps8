def calculate_distance(point1, point2):
    \"\"\"Demo helper to calculate Euclidean distance between two lunar coordinates.\"\"\"
    import math
    return math.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)

def load_telemetry_data():
    \"\"\"Mock function to load telemetry data.\"\"\"
    return {"status": "nominal", "battery": 95}
