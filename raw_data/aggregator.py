import os
import json
import csv
from datetime import datetime, timedelta

# ===== Editable Parameters =====
# The year (folder name) to process:
YEAR = 2025

# Specify the date range (inclusive) in YYYY-MM-DD format:
START_DATE_STR = "2025-01-01"
END_DATE_STR   = "2025-03-31"

# Aggregation type: set to "sum" for rainfall, "avg" for humidity
AGGREGATION_TYPE = "avg"  # change to "sum" if needed

# Input base folder (e.g., "humidity" or "rainfall")
BASE_FOLDER = "humidity"

# Output CSV file for aggregated daily data
OUTPUT_CSV = "daily_humidity_2025.csv"

# ===== Helper: Date Range Generator =====
start_date = datetime.strptime(START_DATE_STR, "%Y-%m-%d").date()
end_date = datetime.strptime(END_DATE_STR, "%Y-%m-%d").date()

def daterange(start_date, end_date):
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)

# ===== Aggregation Dictionary =====
# Key: (day, station_id)
# Value: dictionary with day, station_id, station_name, latitude, longitude,
#        total (sum of values) and count (number of measurements, used for average)
daily_data = {}

for current_date in daterange(start_date, end_date):
    file_date_str = current_date.isoformat()  # e.g., "2023-01-01"
    file_name = file_date_str + ".json"
    file_path = os.path.join(BASE_FOLDER, str(YEAR), file_name)
    
    if not os.path.exists(file_path):
        print(f"File {file_path} does not exist, skipping.")
        continue
    
    try:
        with open(file_path, "r") as f:
            pages = json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        continue

    # ===== Merge Station Info from All Pages =====
    station_info = {}
    for page in pages:
        data = page.get("data", {})
        stations = data.get("stations", [])
        for station in stations:
            sid = station.get("id")
            if sid:
                # Try to get name and location details
                name = station.get("name", "")
                # Some endpoints use "location" and some use "labelLocation"
                loc = station.get("location") or station.get("labelLocation") or {}
                latitude = loc.get("latitude", "")
                longitude = loc.get("longitude", "")
                # Merge: update only if new info is available
                if sid in station_info:
                    if not station_info[sid].get("name") and name:
                        station_info[sid]["name"] = name
                    if not station_info[sid].get("latitude") and latitude:
                        station_info[sid]["latitude"] = latitude
                    if not station_info[sid].get("longitude") and longitude:
                        station_info[sid]["longitude"] = longitude
                else:
                    station_info[sid] = {
                        "name": name,
                        "latitude": latitude,
                        "longitude": longitude
                    }

    # Process each page and aggregate measurements.
    for page in pages:
        data = page.get("data", {})
        readings = data.get("readings", [])
        for reading in readings:
            measurements = reading.get("data", [])
            for measure in measurements:
                station_id = measure.get("stationId")
                try:
                    value = float(measure.get("value", 0))
                except (TypeError, ValueError):
                    value = 0.0
                key = (file_date_str, station_id)
                if key in daily_data:
                    daily_data[key]["total"] += value
                    if AGGREGATION_TYPE == "avg":
                        daily_data[key]["count"] += 1
                else:
                    info = station_info.get(station_id, {"name": "", "latitude": "", "longitude": ""})
                    daily_data[key] = {
                        "day": file_date_str,
                        "station_id": station_id,
                        "station_name": info.get("name", ""),
                        "latitude": info.get("latitude", ""),
                        "longitude": info.get("longitude", ""),
                        "total": value,
                        "count": 1  # used only for averaging
                    }
    print(f"Processed {file_path}")

# ===== Prepare Final Aggregated Data =====
final_rows = []
for key, data_entry in daily_data.items():
    if AGGREGATION_TYPE == "avg":
        aggregated_value = data_entry["total"] / data_entry["count"] if data_entry["count"] > 0 else 0
    else:
        aggregated_value = data_entry["total"]
    final_rows.append({
        "day": data_entry["day"],
        "station_id": data_entry["station_id"],
        "station_name": data_entry["station_name"],
        "latitude": data_entry["latitude"],
        "longitude": data_entry["longitude"],
        "aggregated_value": aggregated_value
    })

# ===== Write Aggregated Data to CSV =====
fieldnames = ["day", "station_id", "station_name", "latitude", "longitude", "aggregated_value"]
try:
    with open(OUTPUT_CSV, "w", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(final_rows)
    print(f"Aggregated data successfully written to {OUTPUT_CSV} with {len(final_rows)} rows.")
except Exception as e:
    print(f"Error writing CSV file: {e}")