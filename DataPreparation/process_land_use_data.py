import json
import pandas as pd
import numpy as np
from shapely.geometry import Polygon
from bs4 import BeautifulSoup
from tqdm import tqdm

def extract_table_data(description):
    """Extract all fields from the HTML table in description"""
    try:
        soup = BeautifulSoup(description, 'html.parser')
        data = {}
        for row in soup.find_all('tr'):
            cells = row.find_all(['th', 'td'])
            if len(cells) >= 2:
                header = cells[0].get_text(strip=True)
                value = cells[1].get_text(strip=True)
                data[header] = value
        return data
    except:
        return {}

def calculate_polygon_area(coordinates):
    """Calculate area of polygon in square meters"""
    try:
        # Extract only longitude and latitude from coordinates (ignore z-coordinate)
        coords_2d = [(coord[0], coord[1]) for coord in coordinates[0]]
        polygon = Polygon(coords_2d)
        # Rough conversion from degrees to meters at Singapore's latitude
        # 1 degree = approximately 111,000 meters
        area_in_degrees = polygon.area
        area_in_meters = area_in_degrees * (111000 ** 2)
        return area_in_meters
    except:
        return 0.0

def calculate_center_point(coordinates):
    """Calculate center point of polygon"""
    try:
        # Extract only longitude and latitude from coordinates (ignore z-coordinate)
        coords_2d = [(coord[0], coord[1]) for coord in coordinates[0]]
        polygon = Polygon(coords_2d)
        centroid = polygon.centroid
        return centroid.x, centroid.y
    except:
        return 0.0, 0.0

def process_geojson(file_path):
    """Process GeoJSON file and return DataFrame"""
    print(f"Loading GeoJSON file: {file_path}")
    with open(file_path) as f:
        data = json.load(f)
    
    features = data['features']
    print(f"Number of features in GeoJSON: {len(features)}")
    
    rows = []
    for feature in tqdm(features, desc="Processing features"):
        properties = feature['properties']
        geometry = feature['geometry']
        
        # Get the original name without reindexing
        name = properties.get('Name', '')
        
        # Extract all fields from the description table
        table_data = extract_table_data(properties.get('Description', ''))
        
        # Calculate area and center point
        area = calculate_polygon_area(geometry['coordinates'])
        center_lon, center_lat = calculate_center_point(geometry['coordinates'])
        
        # Create row with all extracted data
        row = {
            'name': name,
            'lu_desc': table_data.get('LU_DESC', ''),
            'lu_text': table_data.get('LU_TEXT', ''),
            'gpr': table_data.get('GPR', ''),
            'whi_q_mx': table_data.get('WHI_Q_MX', ''),
            'gpr_b_mn': table_data.get('GPR_B_MN', ''),
            'inc_crc': table_data.get('INC_CRC', ''),
            'fmel_upd_d': table_data.get('FMEL_UPD_D', ''),
            'area_sqm': area,
            'center_lon': center_lon,
            'center_lat': center_lat,
            'coordinates': geometry['coordinates']  # Store the full coordinates
        }
        
        rows.append(row)
    
    df = pd.DataFrame(rows)
    return df

def main():
    # File paths
    geojson_file = "MasterPlan2019LandUselayer.geojson"
    output_file = "land_use_data.pkl"
    
    # Process GeoJSON and create DataFrame
    df = process_geojson(geojson_file)
    
    # Display DataFrame info and sample
    print("\nDataFrame Info:")
    print(df.info())
    print("\nFirst 5 rows:")
    print(df.head())
    print("\nSummary statistics for area_sqm:")
    print(df['area_sqm'].describe())
    
    # Display unique land use descriptions
    print("\nUnique land use descriptions:")
    print(df['lu_desc'].value_counts().head(10))
    
    # Save DataFrame to pickle file
    print(f"\nSaving DataFrame to {output_file}")
    df.to_pickle(output_file)
    print("Done!")

if __name__ == "__main__":
    main() 