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
    street_address: str
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
                "street_address": "Ang Mo Kio Avenue 3 (Block 234)",
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

        address_postal_code_mapping_data = all_data['address_postal_code_mapping'][
            all_data['address_postal_code_mapping']['postal_code'] == int(postal_code)
        ]

        if address_postal_code_mapping_data.empty:
            street_address = "Unknown"
        else:
            address_postal_code_mapping_data = address_postal_code_mapping_data.iloc[0]
            street_address = address_postal_code_mapping_data.get('Street Address', '').title()

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

        # Determine the color based on the risk level
        risk_color = 'red' if risk_level == 'High' else 'orange' if risk_level == 'Medium' else 'green'

        # Create a custom popup with adjustable width and colored risk level
        popup_content = (
            f"Postal Code: {postal_code}<br>"
            + (f"Street Address: {street_address}<br>" if street_address != "Unknown" else "")
            + f"Land Use Category: {postal_info['landuse_type'].title()}<br>"
            f"Risk Level: <span style='color:{risk_color};'>{risk_level}</span>"
        )
        popup = folium.Popup(popup_content, max_width=300, show=True)  # Adjust max_width as needed

        # Add marker with the custom popup
        folium.Marker(
            [postal_info['postal_lat'], postal_info['postal_lon']],
            popup=popup,
            icon=folium.Icon(
                color=risk_color
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
            "street_address": street_address,
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

@app.get("/clusters/latest", response_model=Dict[str, Any])
async def get_latest_clusters():
    try:
        # Extract the dengue cluster data and work on a copy
        dengue_cluster_data = all_data["dengue_cluster"].copy()

        # Ensure the 'Date' column is in datetime format
        dengue_cluster_data["Date"] = pd.to_datetime(dengue_cluster_data["Date"])

        # Group by 'Cluster Number' and get the latest record for each cluster
        latest_clusters = (
            dengue_cluster_data.sort_values("Date", ascending=False)
            .groupby("Cluster Number")
            .first()
            .reset_index()
        )

        # Sort by 'Total Cases In Cluster' in descending order
        latest_clusters = latest_clusters.sort_values(
            "Total Cases In Cluster", ascending=False
        )

        # Convert 'Date' column to string to avoid serialization issues
        if "Date" in latest_clusters.columns:
            latest_clusters["Date"] = latest_clusters["Date"].astype(str)

        # Convert the result to a list of dictionaries
        latest_clusters_list = latest_clusters.to_dict(orient="records")

        return {"status": "success", "clusters": latest_clusters_list}

    except Exception as e:
        logger.error(f"Error fetching latest clusters: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching the latest cluster data.",
        )

@app.get("/statistics/latest", response_model=Dict[str, Any])
async def get_latest_statistics():
    try:
        # Extract the dengue cluster data
        dengue_cluster_data = all_data["dengue_cluster"]

        # Ensure the 'Date' column is in datetime format
        dengue_cluster_data["Date"] = pd.to_datetime(dengue_cluster_data["Date"])

        # Get the latest date
        latest_date = dengue_cluster_data["Date"].max()

        # Filter data for the latest date
        latest_data = dengue_cluster_data[dengue_cluster_data["Date"] == latest_date]

        # Calculate total cases
        total_cases = int(latest_data["Number Of Cases"].sum())

        # Calculate average incidence rate (cases per 1000 population)
        total_population = 5_700_000  # Assuming total population is 5.7 million
        incidence_rate = round((total_cases / total_population) * 1000, 2)

        # Calculate active clusters (clusters with recent cases > 0)
        active_clusters = int(latest_data[latest_data["Recent Cases In Cluster"] > 0]["Cluster Number"].nunique())

        # Find the cluster with the highest number of cases
        highest_case_cluster = latest_data.loc[latest_data["Number Of Cases"].idxmax()]
        highest_case_cluster_info = {
            "number_of_cases": int(highest_case_cluster["Number Of Cases"]),
            "street_address": highest_case_cluster["Street Address"].title(),
        }

        # Prepare the response
        response = {
            "status": "success",
            "total_cases": total_cases,
            "average_incidence_rate": incidence_rate,  # Already rounded to 2 decimal places
            "active_clusters": active_clusters,
            "highest_case_cluster": highest_case_cluster_info,
        }

        return response

    except Exception as e:
        logger.error(f"Error fetching latest statistics: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching the latest statistics.",
        )

@app.get("/statistics/incidence-rate", response_model=Dict[str, Any])
async def get_monthly_incidence_rate():
    try:
        # Extract the dengue cluster data and work on a copy
        dengue_cluster_data = all_data["dengue_cluster"].copy()

        # Ensure the 'Date' column is in datetime format
        dengue_cluster_data["Date"] = pd.to_datetime(dengue_cluster_data["Date"])

        # Add a 'Month' column for grouping
        dengue_cluster_data["Month"] = dengue_cluster_data["Date"].dt.to_period("M")

        # Group by 'Month' and calculate total cases for each month
        monthly_cases = (
            dengue_cluster_data.groupby("Month")["Number Of Cases"].sum().reset_index()
        )

        # Convert 'Month' column to string format
        monthly_cases["Month"] = monthly_cases["Month"].astype(str)

        # Calculate incidence rate for each month
        total_population = 5_700_000  # Assuming total population is 5.7 million
        monthly_cases["Incidence Rate"] = monthly_cases["Number Of Cases"].apply(
            lambda total_cases: round((total_cases / total_population) * 1000, 2)
        )

        # Convert the result to a list of dictionaries
        monthly_incidence_rate = monthly_cases.to_dict(orient="records")

        # Prepare the response
        response = {
            "status": "success",
            "monthly_incidence_rate": monthly_incidence_rate,
        }

        return response

    except Exception as e:
        logger.error(f"Error calculating monthly incidence rates: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="An error occurred while calculating the monthly incidence rates.",
        )
    
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
