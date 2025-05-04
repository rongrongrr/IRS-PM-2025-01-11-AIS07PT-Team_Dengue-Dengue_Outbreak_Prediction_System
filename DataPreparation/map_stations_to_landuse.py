import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
import logging
from pathlib import Path
import time

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("station_mapping.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("station_mapping")

def load_data():
    """Load rainfall and land use data"""
    try:
        # Load rainfall data
        logger.info("Loading rainfall data...")
        rainfall_df = pd.read_csv('daily_rainfall_2025.csv')
        rainfall_df = rainfall_df[rainfall_df['day'] == '2025-01-01']
        logger.info(f"Loaded {len(rainfall_df)} rainfall stations")
        
        # Load land use data
        logger.info("Loading land use data...")
        landuse_df = pd.read_pickle('land_use_data.pkl')
        logger.info(f"Loaded {len(landuse_df)} land use areas")
        
        # Print sample data for debugging
        logger.info(f"Rainfall data sample:\n{rainfall_df.head()}")
        logger.info(f"Land use data sample:\n{landuse_df.head()}")
        
        return rainfall_df, landuse_df
    
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        raise

def create_station_landuse_mapping(rainfall_df, landuse_df, max_distance_km=1.0):
    """
    Create mapping between stations and land use based on geographical proximity
    max_distance_km: Maximum distance in kilometers to consider for matching
    """
    try:
        start_time = time.time()
        
        # Prepare station coordinates
        station_coords = rainfall_df[['latitude', 'longitude']].values
        logger.info(f"Prepared {len(station_coords)} station coordinates")
        
        # Prepare land use coordinates
        landuse_coords = landuse_df[['center_lat', 'center_lon']].values
        logger.info(f"Prepared {len(landuse_coords)} land use coordinates")
        
        # Convert max_distance from km to degrees (approximate)
        # 1 degree ≈ 111 km at the equator
        max_distance_deg = max_distance_km / 111.0
        
        # Initialize NearestNeighbors
        logger.info("Finding nearest land use areas for each station...")
        nbrs = NearestNeighbors(n_neighbors=1, algorithm='ball_tree')
        nbrs.fit(landuse_coords)
        
        # Find distances and indices of nearest neighbors
        distances, indices = nbrs.kneighbors(station_coords)
        logger.info(f"Found nearest neighbors. Shape of indices: {indices.shape}")
        
        # Convert distances to kilometers
        distances_km = distances * 111.0
        
        # Flatten the arrays to ensure they match the length of rainfall_df
        indices_flat = indices.flatten()
        distances_km_flat = distances_km.flatten()
        
        logger.info(f"Flattened arrays. Length of indices_flat: {len(indices_flat)}")
        
        # Create mapping DataFrame
        logger.info("Creating mapping DataFrame...")
        
        # Get the land use data for the matched indices
        matched_landuse = landuse_df.iloc[indices_flat]
        logger.info(f"Matched land use data shape: {matched_landuse.shape}")
        
        # Create the mapping DataFrame
        mapping_df = pd.DataFrame({
            'station_id': rainfall_df['station_id'].values,
            'station_lat': rainfall_df['latitude'].values,
            'station_lon': rainfall_df['longitude'].values,
            'landuse_name': matched_landuse['name'].values,
            'landuse_lat': matched_landuse['center_lat'].values,
            'landuse_lon': matched_landuse['center_lon'].values,
            'distance_km': distances_km_flat,
            'landuse_type': matched_landuse['lu_desc'].values
        })
        
        # Filter out matches that are too far
        mapping_df = mapping_df[mapping_df['distance_km'] <= max_distance_km]
        
        elapsed_time = time.time() - start_time
        logger.info(f"Created mapping for {len(mapping_df)} stations in {elapsed_time:.2f} seconds")
        return mapping_df
    
    except Exception as e:
        logger.error(f"Error creating mapping: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise

def save_mapping(mapping_df):
    """Save mapping to CSV and pickle files"""
    try:
        # Create output directory if it doesn't exist
        output_dir = Path("station_mappings")
        output_dir.mkdir(exist_ok=True)
        
        # Save to CSV
        csv_path = output_dir / "station_landuse_mapping.csv"
        mapping_df.to_csv(csv_path, index=False)
        logger.info(f"Saved mapping to {csv_path}")
        
        # Save to pickle
        pkl_path = output_dir / "station_landuse_mapping.pkl"
        mapping_df.to_pickle(pkl_path)
        logger.info(f"Saved mapping to {pkl_path}")
        
    except Exception as e:
        logger.error(f"Error saving mapping: {str(e)}")
        raise

def main():
    try:
        # Load data
        rainfall_df, landuse_df = load_data()
        
        # Create mapping
        mapping_df = create_station_landuse_mapping(rainfall_df, landuse_df)
        
        # Save mapping
        save_mapping(mapping_df)
        
        # Print summary
        print("\nMapping Summary:")
        print(f"Total stations mapped: {len(mapping_df)}")
        print("\nDistance statistics (km):")
        print(mapping_df['distance_km'].describe())
        print("\nLand use type distribution:")
        print(mapping_df['landuse_type'].value_counts().head())
        
    except Exception as e:
        logger.error(f"Error in main: {str(e)}")
        raise

if __name__ == "__main__":
    main() 