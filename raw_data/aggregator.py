import os
import json
import csv
from datetime import datetime, timedelta

# ===== Editable Parameters =====
# The year (folder name) to process:
YEAR = 2025

# Specify the date range (inclusive) in YYYY-MM-DD format:
START_DATE_STR = "2025-01-01"
END_DATE_STR   = "2025-03-14"

# Input base folder (assumes folder structure like: BASE_FOLDER/YEAR/2022-01-01.json, etc.)
BASE_FOLDER = "rainfall"

# Output CSV file for aggregated daily data
OUTPUT_CSV = "daily_rainfall_2025.csv"

# ===== Helper: Date Range Generator =====
start_date = datetime.strptime(START_DATE_STR, "%Y-%m-%d").date()
end_date = datetime.strptime(END_DATE_STR, "%Y-%m-%d").date()

def daterange(start_date, end_date):
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)

# ===== Aggregation Dictionary =====
# Key: (file_date, station_id)
# Value: dictionary with file_date, station_id, station_name, latitude, longitude, and aggregated rainfall_value
daily_data = {}

# ===== Process Each File =====
year_folder = os.path.join(BASE_FOLDER, str(YEAR))

for current_date in daterange(start_date, end_date):
    file_date_str = current_date.isoformat()  # e.g., "2022-01-01"
    file_name = file_date_str + ".json"
    file_path = os.path.join(year_folder, file_name)
    
    if not os.path.exists(file_path):
        print(f"File {file_path} does not exist, skipping.")
        continue
    
    try:
        with open(file_path, "r") as f:
            pages = json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        continue
    
    # Extract station info from the first page that contains stations.
    station_info = {}
    for page in pages:
        data = page.get("data", {})
        stations = data.get("stations", [])
        if stations:
            for station in stations:
                sid = station.get("id")
                if sid and sid not in station_info:
                    station_info[sid] = {
                        "name": station.get("name", ""),
                        "latitude": station.get("location", {}).get("latitude", ""),
                        "longitude": station.get("location", {}).get("longitude", "")
                    }
            # Use the first available stations list.
            break
    
    # Process each page to accumulate rainfall values.
    for page in pages:
        data = page.get("data", {})
        readings = data.get("readings", [])
        for reading in readings:
            # We ignore the specific timestamp since we're summing for the whole day.
            measurements = reading.get("data", [])
            for measure in measurements:
                station_id = measure.get("stationId")
                try:
                    value = float(measure.get("value", 0))
                except (TypeError, ValueError):
                    value = 0.0
                key = (file_date_str, station_id)
                
                if key in daily_data:
                    daily_data[key]["total_rainfall"] += value
                else:
                    info = station_info.get(station_id, {"name": "", "latitude": "", "longitude": ""})
                    daily_data[key] = {
                        "day": file_date_str,
                        "station_id": station_id,
                        "station_name": info.get("name", ""),
                        "latitude": info.get("latitude", ""),
                        "longitude": info.get("longitude", ""),
                        "total_rainfall": value
                    }
    
    print(f"Processed {file_path}")

# ===== Write Aggregated Data to CSV =====
# Sort the results by day and station_id
aggregated_rows = sorted(daily_data.values(), key=lambda x: (x["day"], x["station_id"]))

fieldnames = ["day", "station_id", "station_name", "latitude", "longitude", "total_rainfall"]
try:
    with open(OUTPUT_CSV, "w", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(aggregated_rows)
    print(f"Aggregated data successfully written to {OUTPUT_CSV} with {len(aggregated_rows)} rows.")
except Exception as e:
    print(f"Error writing CSV file: {e}")