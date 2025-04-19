import requests
import datetime
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

base_url = "https://api-open.data.gov.sg/v2/real-time/api/"

year = 2017 #change the year to vary the folder name and date for API calls
url = base_url+"relative-humidity"
main_folder = "humidity" #change this according to the API you are using. very caveman, I know. 

def fetch_and_save(date_str):
    params = {"date": date_str}
    sub_folder = str(year)
    all_pages = []  # List to hold all pages of data for this date
    page_number = 1

    while True:
        try:
            response = requests.get(url, params=params)
            if response.status_code == 200:
                resp_json = response.json()
            else:
                print(f"Error {response.status_code} for {date_str} page {page_number}")
                break
        except Exception as e:
            print(f"Exception occurred for {date_str} page {page_number}: {e}")
            break

        all_pages.append(resp_json)
        print(f"Fetched page {page_number} for {date_str}")

        # Extract the pagination token from the nested "data" field
        token = None
        if "data" in resp_json:
            token = resp_json["data"].get("paginationToken")
        if token:
            params["paginationToken"] = token
            page_number += 1
        else:
            # No more pages
            break

    # Create the nested directory if it doesn't exist
    folder_path = os.path.join(main_folder, sub_folder)
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

    # Save all pages to a single JSON file
    filename = os.path.join(folder_path, f"{date_str}.json")
    with open(filename, "w") as f:
        json.dump(all_pages, f, indent=4)
    print(f"Saved data for {date_str} with {page_number} page(s)")
    return date_str


def main():
    start_date = datetime.date(year, 7, 1)
    end_date = datetime.date(year, 8, 31)
    delta = datetime.timedelta(days=1)
    
    # Generate all date strings for the year
    dates = []
    current_date = start_date
    while current_date <= end_date:
        dates.append(current_date.isoformat())
        current_date += delta

    #ThreadPoolExecutor to run up to 10 threads concurrently
    max_workers = 5
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
