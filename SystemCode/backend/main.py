from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import pickle
import folium
from pydantic import BaseModel
import json
from typing import Dict, Any
import os
import traceback
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data and model
def load_data():
    try:
        with open('combined_data.pkl', 'rb') as f:
            data = pickle.load(f)
        with open('dengue_RFR_model.pkl', 'rb') as f:
            model = pickle.load(f)
            
        # Log the structure of loaded data
        for key, value in data.items():
            if isinstance(value, pd.DataFrame):
                logger.info(f"{key} columns: {value.columns.tolist()}")
                logger.info(f"{key} shape: {value.shape}")
            
        return data, model
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        logger.error(traceback.format_exc())
        raise

try:
    data, model = load_data()
    logger.info("Data and model loaded successfully")
    logger.info(f"Available keys in data: {list(data.keys())}")
except Exception as e:
    logger.error(f"Failed to load data: {str(e)}")
    logger.error(traceback.format_exc())
    raise HTTPException(status_code=500, detail="Failed to load model data")

class PostalCodeRequest(BaseModel):
    postal_code: str

def get_risk_level(prediction: float) -> str:
    if prediction >= 10:
        return "High"
    elif prediction >= 5:
        return "Medium"
    else:
        return "Low"

def get_risk_color(risk_level: str) -> str:
    if risk_level == "High":
        return "red"
    elif risk_level == "Medium":
        return "orange"
    else:
        return "green"

def normalize_column_names(df: pd.DataFrame, expected_columns: Dict[str, str]) -> pd.DataFrame:
    """
    Normalize column names in the dataframe based on expected columns mapping
    expected_columns: Dict mapping expected column names to possible alternatives
    """
    df_columns = df.columns.tolist()
    for expected, alternatives in expected_columns.items():
        if expected not in df_columns:
            for alt in alternatives:
                if alt in df_columns:
                    df = df.rename(columns={alt: expected})
                    break
    return df

@app.post("/predict")
async def predict_risk(request: PostalCodeRequest):
    try:
        postal_code = int(request.postal_code)
        logger.info(f"Processing postal code: {postal_code}")
        
        # Find postal code in mapping
        postal_matches = data['postal_landuse_mapping'][data['postal_landuse_mapping']['postal_code'] == postal_code]
        
        if len(postal_matches) == 0:
            logger.warning(f"Postal code {postal_code} not found in mapping")
            raise HTTPException(
                status_code=404,
                detail=f"Postal code {postal_code} was not found in our database"
            )
            
        postal_match = postal_matches.iloc[0]
        logger.info(f"Found postal match: {postal_match.to_dict()}")
        
        # Get postal code location
        try:
            postal_lat = postal_match['postal_lat']
            postal_lon = postal_match['postal_lon']
            landuse_name = postal_match['landuse_name']
        except KeyError as e:
            logger.error(f"Missing required column in postal_landuse_mapping: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Data structure error: missing column {e}"
            )
        
        logger.info(f"Postal code location: {postal_lat}, {postal_lon}")
        logger.info(f"Land use name: {landuse_name}")
        
        # Find land use area
        land_use = data['land_use_data']
        logger.info(f"Land use data columns: {land_use.columns.tolist()}")
        
        landuse_area_matches = land_use[land_use['name'] == landuse_name]
        
        if len(landuse_area_matches) == 0:
            logger.warning(f"Land use area '{landuse_name}' not found in land use data")
            landuse_area = None
        else:
            landuse_area = landuse_area_matches.iloc[0]
            logger.info(f"Found land use area: {landuse_area.to_dict()}")
        
        # Find station
        landuse_station_mapping = data['landuse_station_mapping']
        logger.info(f"Landuse station mapping columns: {landuse_station_mapping.columns.tolist()}")
        
        station_matches = landuse_station_mapping[landuse_station_mapping['landuse_name'] == landuse_name]
        
        # Get humidity and rainfall scores
        humidity_score = 0
        rainfall_score = 0
        
        if len(station_matches) > 0:
            station_id = station_matches.iloc[0]['station_id']
            logger.info(f"Found station ID: {station_id}")
            
            humidity_scores = data['station_humidity_scores']
            rainfall_scores = data['station_rainfall_scores']
            
            logger.info(f"Humidity scores columns: {humidity_scores.columns.tolist()}")
            logger.info(f"Rainfall scores columns: {rainfall_scores.columns.tolist()}")
            
            # Handle potential column name variations
            humidity_scores = normalize_column_names(
                humidity_scores,
                {'overall_humidity_score': ['humidity_score', 'score']}
            )
            rainfall_scores = normalize_column_names(
                rainfall_scores,
                {'overall_rain_score': ['rainfall_score', 'score']}
            )
            
            humidity_matches = humidity_scores[humidity_scores['station_id'] == station_id]
            if len(humidity_matches) > 0:
                humidity_score = humidity_matches['overall_humidity_score'].values[0]
            
            rainfall_matches = rainfall_scores[rainfall_scores['station_id'] == station_id]
            if len(rainfall_matches) > 0:
                rainfall_score = rainfall_matches['overall_rain_score'].values[0]
        
        # Find nearby clusters
        dengue_cluster = data['dengue_cluster']
        logger.info(f"Dengue cluster columns: {dengue_cluster.columns.tolist()}")
        
        # Normalize dengue cluster column names
        dengue_cluster = normalize_column_names(
            dengue_cluster,
            {
                'Latitude': ['lat', 'latitude'],
                'Longitude': ['lon', 'longitude'],
                'Total Cases In Cluster': ['total_cases', 'cases']
            }
        )
        
        try:
            nearby_clusters = dengue_cluster[
                (dengue_cluster['Latitude'].between(postal_lat - 0.01, postal_lat + 0.01)) &
                (dengue_cluster['Longitude'].between(postal_lon - 0.01, postal_lon + 0.01))
            ]
        except KeyError as e:
            logger.error(f"Missing required column in dengue_cluster: {e}")
            nearby_clusters = pd.DataFrame()  # Empty DataFrame if columns not found
        
        logger.info(f"Found {len(nearby_clusters)} nearby clusters")
        
        # Create map
        m = folium.Map(location=[postal_lat, postal_lon], zoom_start=15)
        
        # Add postal code marker
        folium.Marker(
            [postal_lat, postal_lon],
            popup=f'Postal Code: {postal_code}<br>Land Use: {landuse_name}',
            icon=folium.Icon(color='red', icon='info-sign')
        ).add_to(m)
        
        # Add land use polygon
        if landuse_area is not None:
            try:
                coords = landuse_area['coordinates']
                
                if coords is not None:
                    if isinstance(coords, str):
                        coords = eval(coords)
                    
                    # Fix coordinate format - extract only lat and lon
                    fixed_coords = []
                    for point in coords[0]:  # Access the first polygon
                        if len(point) >= 2:
                            fixed_coords.append([point[1], point[0]])  # Swap lat/lon order
                    
                    folium.Polygon(
                        locations=fixed_coords,
                        popup=f'''
                        Land Use Area: {landuse_name}<br>
                        Type: {landuse_area.get('lu_desc', 'Unknown')}<br>
                        <br>
                        Features:<br>
                        - Number of Clusters: {len(nearby_clusters)}<br>
                        - Total Cases: {nearby_clusters['Total Cases In Cluster'].sum() if len(nearby_clusters) > 0 else 0}<br>
                        - Humidity Score: {humidity_score:.2f}<br>
                        - Rainfall Score: {rainfall_score:.2f}
                        ''',
                        color='blue',
                        fill=True,
                        fill_color='blue',
                        fill_opacity=0.3
                    ).add_to(m)
            except Exception as e:
                logger.error(f"Could not add land use polygon: {str(e)}")
                logger.error(traceback.format_exc())
        
        # Add nearby clusters
        if len(nearby_clusters) > 0:
            for _, cluster in nearby_clusters.iterrows():
                try:
                    folium.CircleMarker(
                        [cluster['Latitude'], cluster['Longitude']],
                        radius=10,
                        popup=f'Cluster Cases: {cluster["Total Cases In Cluster"]}',
                        color='purple',
                        fill=True
                    ).add_to(m)
                except Exception as e:
                    logger.error(f"Could not add cluster marker: {str(e)}")
                    continue
        
        # Save map to static file
        map_file = f'static/risk_map_{postal_code}.html'
        m.save(map_file)
        
        # Try to make prediction, but don't fail if it doesn't work
        prediction_result = None
        risk_level = "Unknown"
        features = {}
        
        try:
            # Prepare features for prediction
            if landuse_area is not None:
                landuse_type = landuse_area['lu_desc']
            else:
                landuse_type = "Unknown"
            
            # Create a dictionary with all possible land use types set to 0
            landuse_features = {
                'AGRICULTURE': 0,
                'BUSINESS 1': 0,
                'BUSINESS 2': 0,
                'BUSINESS PARK': 0,
                'CEMETERY': 0,
                'COMMERCIAL': 0,
                'EDUCATIONAL': 0,
                'GOVERNMENT': 0,
                'INDUSTRIAL': 0,
                'INSTITUTION': 0,
                'MIXED': 0,
                'OPEN SPACE': 0,
                'PARK': 0,
                'PLACE OF WORSHIP': 0,
                'RESIDENTIAL': 0,
                'SPORTS': 0,
                'TRANSPORT': 0,
                'UTILITY': 0,
                'WATERBODY': 0
            }
            
            # Set the actual land use type to 1
            if landuse_type in landuse_features:
                landuse_features[landuse_type] = 1
            
            # Calculate cluster statistics
            num_clusters = len(nearby_clusters)
            total_cases = nearby_clusters['Total Cases In Cluster'].sum() if num_clusters > 0 else 0
            
            # Combine all features
            features = {
                **landuse_features,
                'num_clusters': num_clusters,
                'total_cases': total_cases,
                'humidity_score': humidity_score,
                'rainfall_score': rainfall_score
            }
            
            # Make prediction
            feature_df = pd.DataFrame([features])
            prediction = model.predict(feature_df)[0]
            risk_level = get_risk_level(prediction)
            prediction_result = float(prediction)
            
            logger.info(f"Prediction: {prediction}, Risk Level: {risk_level}")
            
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            logger.error(traceback.format_exc())
            # Don't raise an exception, just log the error
        
        # Convert numpy types to Python native types for JSON serialization
        def convert_numpy_types(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, dict):
                return {k: convert_numpy_types(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_numpy_types(item) for item in obj]
            else:
                return obj
        
        # Convert features to JSON-serializable format
        features_json = convert_numpy_types(features)
        
        return {
            "status": "success",
            "postal_code": postal_code,
            "risk_level": risk_level,
            "prediction_value": prediction_result,
            "features": features_json,
            "map_file": map_file,
            "location_info": {
                "latitude": float(postal_lat),
                "longitude": float(postal_lon),
                "landuse_name": landuse_name,
                "landuse_type": landuse_type if landuse_area is not None else "Unknown",
                "nearby_clusters": int(len(nearby_clusters)),
                "total_cases": float(total_cases) if 'total_cases' in locals() else 0,
                "humidity_score": float(humidity_score),
                "rainfall_score": float(rainfall_score)
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 