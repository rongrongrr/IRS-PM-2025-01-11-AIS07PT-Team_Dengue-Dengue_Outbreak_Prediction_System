import pandas as pd
import numpy as np
from pathlib import Path
import glob
from sklearn.neighbors import NearestNeighbors
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("process_dengue_data.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('process_dengue_data')

def load_dengue_data():
    """Load and combine all dengue cluster CSV files"""
    logger.info("Loading dengue cluster data...")
    
    # Column names for the dengue data
    columns = [
        'Number Of Cases',
        'Street Address',
        'Latitude',
        'Longitude',
        'Cluster Number',
        'Recent Cases In Cluster',
        'Total Cases In Cluster',
        'Date',
        'Month Number'
    ]
    
    # Get all CSV files in the csv directory
    csv_files = glob.glob('csv/*.csv')
    logger.info(f"Found {len(csv_files)} CSV files")
    
    # Read and combine all CSV files
    dfs = []
    for file in csv_files:
        df = pd.read_csv(file, names=columns)
        dfs.append(df)
    
    # Combine all dataframes
    dengue_cluster = pd.concat(dfs, ignore_index=True)
    
    # Convert Date to datetime
    dengue_cluster['Date'] = pd.to_datetime(dengue_cluster['Date'], format='%y%m%d')
    
    # Sort the dataframe
    dengue_cluster = dengue_cluster.sort_values(
        by=['Date', 'Cluster Number', 'Street Address']
    ).reset_index(drop=True)
    
    logger.info(f"Combined data has {len(dengue_cluster)} rows")
    return dengue_cluster

def create_address_mapping(dengue_cluster, postal_df):
    """Create mapping between street addresses and postal codes"""
    logger.info("Creating address to postal code mapping...")
    
    # Get unique addresses with their coordinates
    unique_addresses = dengue_cluster[['Street Address', 'Latitude', 'Longitude']].drop_duplicates()
    logger.info(f"Found {len(unique_addresses)} unique addresses")
    
    # Prepare coordinates for nearest neighbor search
    address_coords = unique_addresses[['Latitude', 'Longitude']].values
    postal_coords = postal_df[['lat', 'lon']].values
    
    # Find nearest postal code for each address
    logger.info("Finding nearest postal codes...")
    nbrs = NearestNeighbors(n_neighbors=1, metric='haversine')
    nbrs.fit(np.radians(postal_coords))
    distances, indices = nbrs.kneighbors(np.radians(address_coords))
    
    # Convert distances from radians to meters
    distances_meters = distances * 6371000  # Earth's radius in meters
    
    # Create mapping dataframe
    address_postal_code_mapping = pd.DataFrame({
        'Street Address': unique_addresses['Street Address'],
        'Address Latitude': unique_addresses['Latitude'],
        'Address Longitude': unique_addresses['Longitude'],
        'postal_code': postal_df.iloc[indices.flatten()]['postal_code'].values,
        'postal_street_name': postal_df.iloc[indices.flatten()]['street_name'].values,
        'postal_lat': postal_df.iloc[indices.flatten()]['lat'].values,
        'postal_lon': postal_df.iloc[indices.flatten()]['lon'].values,
        'distance_meters': distances_meters.flatten()
    })
    
    logger.info("Address mapping created")
    return address_postal_code_mapping

def main():
    try:
        # Load dengue cluster data
        dengue_cluster = load_dengue_data()
        
        # Load postal code data
        logger.info("Loading postal code data...")
        postal_df = pd.read_csv('SG_postal.csv')
        logger.info(f"Loaded {len(postal_df)} postal codes")
        
        # Create address to postal code mapping
        address_postal_code_mapping = create_address_mapping(dengue_cluster, postal_df)
        
        # Add postal code to dengue cluster data
        logger.info("Adding postal codes to dengue cluster data...")
        dengue_cluster = dengue_cluster.merge(
            address_postal_code_mapping[['Street Address', 'postal_code']],
            on='Street Address',
            how='left'
        )
        
        # Create output directory if it doesn't exist
        output_dir = Path('dengue_data')
        output_dir.mkdir(exist_ok=True)
        
        # Save dengue cluster data
        logger.info("Saving dengue cluster data...")
        dengue_cluster.to_csv(output_dir / 'dengue_cluster.csv', index=False)
        dengue_cluster.to_pickle(output_dir / 'dengue_cluster.pkl')
        
        # Save address mapping
        logger.info("Saving address mapping...")
        address_postal_code_mapping.to_csv(output_dir / 'address_postal_code_mapping.csv', index=False)
        address_postal_code_mapping.to_pickle(output_dir / 'address_postal_code_mapping.pkl')
        
        # Print summary statistics
        logger.info("\nSummary Statistics:")
        logger.info(f"Total dengue cluster records: {len(dengue_cluster)}")
        logger.info(f"Unique addresses mapped: {len(address_postal_code_mapping)}")
        logger.info(f"Average distance to nearest postal code: {address_postal_code_mapping['distance_meters'].mean():.2f} meters")
        logger.info(f"Maximum distance to nearest postal code: {address_postal_code_mapping['distance_meters'].max():.2f} meters")
        logger.info(f"Files saved to {output_dir}/")
        
    except Exception as e:
        logger.error(f"Error in main: {str(e)}")
        raise

if __name__ == '__main__':
    main() 