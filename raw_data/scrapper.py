import requests
import datetime
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

base_url = "https://api-open.data.gov.sg/v2/real-time/api/"

year = 2022 #change the year to vary the folder name and date for API calls
url = base_url+"rainfall" #change this according to the API you are using. very caveman, I know. 

def fetch_and_save(date_str):
    
    params = {"date": date_str}
    folder = str(year)
    
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
        else:
            print(f"Error {response.status_code} for {date_str}")
            return None
    except Exception as e:
        print(f"Exception occurred for {date_str}: {e}")
        return None

    if not os.path.exists(folder):
        os.makedirs(folder)
    filename = os.path.join(folder, f"{date_str}.json")
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)
    print(f"Saved data for {date_str}")
    return date_str

def main():
    start_date = datetime.date(year, 1, 1)
    end_date = datetime.date(year, 12, 31)
    delta = datetime.timedelta(days=1)
    
    # Generate all date strings for the year
    dates = []
    current_date = start_date
    while current_date <= end_date:
        dates.append(current_date.isoformat())
        current_date += delta

    #ThreadPoolExecutor to run up to 10 threads concurrently
    max_workers = 10
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all the date tasks
        future_to_date = {executor.submit(fetch_and_save, date): date for date in dates}
        # Process results as they complete
        for future in as_completed(future_to_date):
            date = future_to_date[future]
            try:
                result = future.result()
            except Exception as exc:
                print(f"{date} generated an exception: {exc}")

if __name__ == "__main__":
    main()
