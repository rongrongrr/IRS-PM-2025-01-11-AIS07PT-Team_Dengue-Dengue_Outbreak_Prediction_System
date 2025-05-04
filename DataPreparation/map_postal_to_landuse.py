import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
import pickle
import logging
import time
from shapely.geometry import Point, Polygon
from pathlib import Path
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("postal_landuse_mapping.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('postal_landuse_mapping')

def load_data():
    """Load postal codes and land use data"""
    try:
        logger.info("Loading postal code data...")
        postal_df = pd.read_csv('SG_postal.csv')
        logger.info(f"Loaded {len(postal_df)} postal codes")
        
        logger.info("Loading land use data...")
        with open('land_use_data.pkl', 'rb') as f:
            land_use_df = pickle.load(f)
        logger.info(f"Loaded {len(land_use_df)} land use areas")
        
        return postal_df, land_use_df
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        raise

def create_polygon(coordinates):
    """Create a Shapely polygon from coordinates"""
    # The coordinates are in the format [[[lon1, lat1, z1], [lon2, lat2, z2], ...]]
    # We need to extract just the lon/lat pairs
    coords = coordinates[0]  # Get the first (and only) polygon
    # Extract just the lon/lat pairs (ignore the z coordinate)
    coords_2d = [(coord[0], coord[1]) for coord in coords]
    return Polygon(coords_2d)

def find_nearest_landuse(postal_df, land_use_df, k=5):
    """Find the nearest land use area for each postal code"""
    logger.info("Starting nearest land use search...")
    start_time = time.time()
    
    # Prepare the data
    postal_locations = postal_df[['lon', 'lat']].values
    landuse_locations = land_use_df[['center_lon', 'center_lat']].values
    
    # Initialize nearest neighbors model
    nn = NearestNeighbors(n_neighbors=k, metric='haversine', algorithm='ball_tree')
    nn.fit(np.radians(landuse_locations))
    
    # Find k nearest neighbors for each postal code
    distances, indices = nn.kneighbors(np.radians(postal_locations))
    
    # Convert distances to kilometers (haversine returns distances in radians)
    distances = distances * 6371.0  # Earth's radius in kilometers
    
    results = []
    for i, postal_row in enumerate(postal_df.itertuples()):
        point = Point(postal_row.lon, postal_row.lat)
        found_containing = False
        
        # Check each of the k nearest land use areas
        for rank, (idx, dist) in enumerate(zip(indices[i], distances[i]), 1):
            land_use = land_use_df.iloc[idx]
            polygon = create_polygon(land_use.coordinates)
            
            if polygon.contains(point):
                results.append({
                    'postal_code': postal_row.postal,
                    'postal_lat': postal_row.lat,
                    'postal_lon': postal_row.lon,
                    'landuse_name': land_use.name,
                    'landuse_type': land_use.lu_desc,
                    'landuse_lat': land_use.center_lat,
                    'landuse_lon': land_use.center_lon,
                    'distance_km': dist,
                    'is_contained': True,
                    'rank': rank
                })
                found_containing = True
                break
        
        # If no containing polygon found, use the nearest one
        if not found_containing:
            nearest_idx = indices[i][0]
            nearest = land_use_df.iloc[nearest_idx]
            results.append({
                'postal_code': postal_row.postal,
                'postal_lat': postal_row.lat,
                'postal_lon': postal_row.lon,
                'landuse_name': nearest.name,
                'landuse_type': nearest.lu_desc,
                'landuse_lat': nearest.center_lat,
                'landuse_lon': nearest.center_lon,
                'distance_km': distances[i][0],
                'is_contained': False,
                'rank': 1
            })
        
        if (i + 1) % 100 == 0:
            logger.info(f"Processed {i + 1} postal codes...")
    
    logger.info(f"Completed nearest land use search in {time.time() - start_time:.2f} seconds")
    return pd.DataFrame(results)

def save_results(results_df):
    """Save the results to CSV and pickle files"""
    output_dir = Path('postal_landuse_mappings')
    output_dir.mkdir(exist_ok=True)
    
    # Save to CSV
    csv_path = output_dir / 'postal_landuse_mapping.csv'
    results_df.to_csv(csv_path, index=False)
    logger.info(f"Saved results to {csv_path}")
    
    # Save to pickle
    pkl_path = output_dir / 'postal_landuse_mapping.pkl'
    results_df.to_pickle(pkl_path)
    logger.info(f"Saved results to {pkl_path}")

def print_summary(results_df):
    """Print a summary of the mapping results"""
    logger.info("\nMapping Summary:")
    logger.info(f"Total postal codes mapped: {len(results_df)}")
    logger.info(f"Postal codes contained in polygons: {results_df['is_contained'].sum()}")
    logger.info(f"Percentage contained: {(results_df['is_contained'].mean() * 100):.2f}%")
    
    logger.info("\nDistance Statistics (km):")
    logger.info(f"Maximum distance: {results_df['distance_km'].max():.2f}")
    logger.info(f"Minimum distance: {results_df['distance_km'].min():.2f}")
    logger.info(f"Mean distance: {results_df['distance_km'].mean():.2f}")
    logger.info(f"Median distance: {results_df['distance_km'].median():.2f}")
    
    logger.info("\nRank Distribution:")
    rank_dist = results_df['rank'].value_counts().sort_index()
    for rank, count in rank_dist.items():
        logger.info(f"Rank {rank}: {count} postal codes")
    
    logger.info("\nLand Use Type Distribution:")
    type_dist = results_df['landuse_type'].value_counts().head()
    for type_name, count in type_dist.items():
        logger.info(f"{type_name}: {count} postal codes")
    
    logger.info("\nSample Mappings:")
    logger.info(results_df.head().to_string())

def main():
    try:
        # Load data
        postal_df, land_use_df = load_data()
        
        # Find nearest land use areas
        results_df = find_nearest_landuse(postal_df, land_use_df)
        
        # Save results
        save_results(results_df)
        
        # Print summary
        print_summary(results_df)
        
    except Exception as e:
        logger.error(f"Error in main process: {str(e)}")
        raise

if __name__ == "__main__":
    main() 