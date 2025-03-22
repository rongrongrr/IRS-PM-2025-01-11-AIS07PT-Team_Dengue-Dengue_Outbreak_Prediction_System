import json
import random
from datetime import datetime, timedelta
import os
import math
from shapely.geometry import Point, Polygon

# Singapore boundaries (approximate)
SINGAPORE_BOUNDS = {
    'min_lat': 1.2,
    'max_lat': 1.5,
    'min_lng': 103.6,
    'max_lng': 104.0
}

def get_random_point_in_singapore():
    lat = random.uniform(SINGAPORE_BOUNDS['min_lat'], SINGAPORE_BOUNDS['max_lat'])
    lng = random.uniform(SINGAPORE_BOUNDS['min_lng'], SINGAPORE_BOUNDS['max_lng'])
    return lat, lng

def generate_random_polygon(center_lat, center_lng, min_vertices=6, max_vertices=12):
    """Generate a random polygon around a center point."""
    num_points = random.randint(min_vertices, max_vertices)
    
    # Random radius between 200-800 meters (converted to degrees)
    base_radius = random.uniform(0.002, 0.008)  # roughly 200-800 meters
    
    points = []
    for i in range(num_points):
        angle = (i * 2 * math.pi / num_points) + random.uniform(-0.2, 0.2)
        # Vary the radius slightly for each point to make irregular shape
        radius = base_radius * random.uniform(0.8, 1.2)
        
        lat = center_lat + (radius * math.cos(angle))
        lng = center_lng + (radius * math.sin(angle))
        points.append([lng, lat])
    
    # Close the polygon
    points.append(points[0])
    return points

def generate_cluster_id():
    return ''.join(random.choices('0123456789ABCDEF', k=8))

def create_cluster(location, case_size, date_str, coordinates):
    try:
        # Calculate area and length
        polygon = Polygon(coordinates)
        area = polygon.area * 111319.9 * 111319.9  # Convert to square meters
        length = polygon.length * 111319.9  # Convert to meters
        
        cluster = {
            "type": "Feature",
            "properties": {
                "CLUSTER_ID": generate_cluster_id(),
                "LOCALITY": location,
                "CASE_SIZE": case_size,
                "FMEL_UPD_D": date_str,
                "DESCRIPTION": f"Dengue cluster in {location}",
                "CASE_SIZE_DESC": f"{case_size} cases",
                "LOCALITY_DESC": location,
                "DESCRIPTION_DESC": f"Dengue cluster in {location}",
                "CASE_SIZE_DESC_DESC": f"{case_size} cases",
                "LOCALITY_DESC_DESC": location,
                "NAME": "Dengue_Cluster",
                "HYPERLINK": "https://www.nea.gov.sg/dengue-zika/dengue/dengue-clusters",
                "HOMES": "Flower pot, Pail, Ornamental containers, Bowl, Vase, Watering can, Scupper drain, Turtle tank, Overturned chair, Mop pail, Bin",
                "PUBLIC_PLACES": "Gully trap",
                "CONSTRUCTION_SITES": None,
                "SHAPE.AREA": area,
                "SHAPE.LEN": length
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [coordinates]
            }
        }
        print(f"Successfully created cluster for {location} with {case_size} cases")
        return cluster
        
    except Exception as e:
        print(f"Error creating cluster: {e}")
        return None

def generate_weekly_data(start_date, num_weeks):
    print(f"Starting weekly data generation for {num_weeks} weeks from {start_date}")
    
    # Create output directory if it doesn't exist
    os.makedirs("weekly_data", exist_ok=True)
    
    # Track active clusters
    active_clusters = {}
    
    # List of area names to make locations more realistic
    area_names = [
        "Ang Mo Kio", "Bedok", "Clementi", "Hougang", "Jurong East", "Jurong West", 
        "Pasir Ris", "Punggol", "Queenstown", "Sembawang", "Sengkang", "Tampines", 
        "Toa Payoh", "Woodlands", "Yishun"
    ]
    
    # Generate weekly data
    for week in range(num_weeks):
        current_date = start_date + timedelta(weeks=week)
        date_str = current_date.strftime("%Y%m%d%H%M%S")
        print(f"\nGenerating data for week {week+1}, date: {current_date.strftime('%Y-%m-%d')}")
        
        # Update existing clusters
        features = []
        for location, data in list(active_clusters.items()):
            # Update case size based on growth rate
            weeks_active = (current_date - data["start_date"]).days / 7
            growth_factor = 1 + (data["growth_rate"] * weeks_active)
            new_cases = max(1, int(data["cases"] * growth_factor))
            
            # 20% chance to remove a cluster each week if it's been active for at least 2 weeks
            if weeks_active >= 2 and random.random() < 0.2:
                print(f"Removing {location} due to natural resolution")
                del active_clusters[location]
                continue
            
            # Add to features if still active
            cluster = create_cluster(location, new_cases, date_str, data["coordinates"])
            if cluster:
                features.append(cluster)
                data["cases"] = new_cases
        
        # Calculate how many new clusters to add to reach target of ~20 (with variation)
        target_clusters = random.randint(18, 22)
        num_new_clusters = max(0, target_clusters - len(active_clusters))
        
        # Create new clusters
        for i in range(num_new_clusters):
            lat, lng = get_random_point_in_singapore()
            coordinates = generate_random_polygon(lat, lng)
            
            # Generate a realistic location name
            area = random.choice(area_names)
            street_number = random.randint(1, 999)
            location_types = ["Street", "Avenue", "Road", "Lane", "Drive"]
            location = f"{area} {random.choice(location_types)} {street_number}"
            
            # Initial case size between 2 and 10
            initial_cases = random.randint(2, 10)
            
            active_clusters[location] = {
                "coordinates": coordinates,
                "cases": initial_cases,
                "start_date": current_date,
                "growth_rate": random.uniform(-0.1, 0.3)  # Can decrease or increase
            }
            
            cluster = create_cluster(location, initial_cases, date_str, coordinates)
            if cluster:
                features.append(cluster)
                print(f"Created new cluster: {location}")
        
        # Create GeoJSON file
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        # Save to file
        filename = f"weekly_data/dengue_clusters_{current_date.strftime('%Y%m%d')}.geojson"
        with open(filename, 'w') as f:
            json.dump(geojson, f, indent=2)
        print(f"Saved {len(features)} clusters to {filename}")

if __name__ == "__main__":
    print("Starting dengue data generation script")
    start_date = datetime(2025, 3, 12)
    generate_weekly_data(start_date, 52)
    print("Script completed successfully") 