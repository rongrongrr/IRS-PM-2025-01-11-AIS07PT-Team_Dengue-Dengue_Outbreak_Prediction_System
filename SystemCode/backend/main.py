from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import pickle
import folium
from pydantic import BaseModel
from typing import Dict, Any
import os
import traceback
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Dengue Outbreak Prediction API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load data and model
def load_data():
    try:
        with open("combined_data.pkl", "rb") as f:
            all_data = pickle.load(f)
        with open("processed_dengue_data_combined_all.pkl", "rb") as f:
            data = pickle.load(f)
        with open("dengue_RFR_model.pkl", "rb") as f:
            model = pickle.load(f)

        # Log the structure of loaded data
        for key, value in data.items():
            if isinstance(value, pd.DataFrame):
                logger.debug(f"{key} columns: {value.columns.tolist()}")
                logger.debug(f"{key} shape: {value.shape}")

        return all_data, data, model
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        logger.error(traceback.format_exc())
        raise


try:
    all_data, data, model = load_data()
    logger.info(f"Available keys in data: {list(all_data.keys())}")
    logger.info(f"Available keys in data: {list(data.keys())}")

except Exception as e:
    logger.error(f"Failed to load data: {str(e)}")
    logger.error(traceback.format_exc())
    raise HTTPException(status_code=500, detail="Failed to load model data")


class PostalCodeRequest(BaseModel):
    postal_code: str

    class Config:
        schema_extra = {"postal_code": "520234"}


class PredictionResponse(BaseModel):
    status: str
    postal_code: int
    risk_level: str
    prediction_value: float
    features: Dict[str, Any]
    map_file: str
    location_info: Dict[str, Any]

    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "postal_code": 520234,
                "risk_level": "High",
                "prediction_value": 12.5,
                "features": {
                    "AGRICULTURE": 0,
                    "RESIDENTIAL": 1,
                    "num_clusters": 3,
                    "total_cases": 15,
                    "humidity_score": 8.5,
                    "rainfall_score": 7.2,
                },
                "map_file": "static/risk_map_123456.html",
                "location_info": {
                    "latitude": 1.3521,
                    "longitude": 103.8198,
                    "landuse_name": "Residential Area",
                    "landuse_type": "RESIDENTIAL",
                    "nearby_clusters": 3,
                    "total_cases": 15,
                    "humidity_score": 8.5,
                    "rainfall_score": 7.2,
                },
            }
        }


def get_risk_level(prediction: float) -> str:
    """Determine risk level based on prediction value thresholds"""
    if prediction < 1.044:
        return "Low"
    elif prediction < 3.273:
        return "Medium"
    else:
        return "High"


@app.post("/predict", response_model=PredictionResponse)
async def predict_risk(request: PostalCodeRequest):
    try:
        postal_code = str(request.postal_code).strip()
        logger.info(f"Processing prediction request for postal code: {postal_code}")

        # Search for record in the postal_landuse_mapping
        postal_records = all_data['postal_landuse_mapping'][
            all_data['postal_landuse_mapping']['postal_code'] == int(postal_code)
        ]

        if postal_records.empty:
            raise HTTPException(
                status_code=404, 
                detail=f"Postal code {postal_code} is not valid"
            )

        postal_info = postal_records.iloc[0]
        landuse_type = postal_info['landuse_type']

        # Get corresponding record from data using landuse type
        landuse_columns = data.columns.intersection([landuse_type])
        if not landuse_columns.empty:
            matching_data = data[data[landuse_columns[0]] == 1]
        else:
            matching_data = pd.DataFrame()  # Empty DataFrame for unknown landuse types

        if matching_data.empty:
            raise HTTPException(
            status_code=404,
            detail=f"No matching data found for landuse type: {landuse_type}"
            )

        # Get features for prediction using the first matching record
        features = matching_data.drop(['total_cases', 'postal_code'], axis=1).iloc[0].to_dict()
        input_features = pd.DataFrame([features])

        # Make prediction
        try:
            prediction = model.predict(input_features)[0]
            risk_level = get_risk_level(prediction)
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            prediction = 0.0
            risk_level = "Low"

        # Create map
        m = folium.Map(
            location=[postal_info['postal_lat'], postal_info['postal_lon']], 
            zoom_start=15
        )

        # Add marker
        folium.Marker(
            [postal_info['postal_lat'], postal_info['postal_lon']],
            popup=f"Postal Code: {postal_code}<br>Risk Level: {risk_level}",
            icon=folium.Icon(
                color='red' if risk_level == 'High' 
                else 'orange' if risk_level == 'Medium' 
                else 'green'
            )
        ).add_to(m)

        # Save map
        map_file = f"static/risk_map_{postal_code}.html"
        m.save(map_file)

        # Prepare response
        location_info = {
            "latitude": float(postal_info['postal_lat']),
            "longitude": float(postal_info['postal_lon']),
            "landuse_name": str(postal_info['landuse_name']),
            "landuse_type": str(postal_info['landuse_type']),
            "area_sqm": float(features.get('area_sqm', 0)),
            "humidity_score": float(features.get('overall_humidity_score', 0)),
            "rainfall_score": float(features.get('overall_rain_score', 0))
        }

        return {
            "status": "success",
            "postal_code": int(postal_code),
            "risk_level": risk_level,
            "prediction_value": float(prediction),
            "features": features,
            "map_file": map_file,
            "location_info": location_info
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error processing prediction: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
