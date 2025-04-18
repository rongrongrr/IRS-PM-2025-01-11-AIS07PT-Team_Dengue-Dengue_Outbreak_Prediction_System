import requests

def get_request(dataset_id):
    url = "https://api-open.data.gov.sg/v1/public/api/datasets/" + dataset_id + "/poll-download"
    
    response = requests.get(url)
    json_data = response.json()
    if json_data['code'] != 0:
        print(json_data['errMsg'])
        exit(1)
    
    url = json_data['data']['url']
    response = requests.get(url)
    kml_data = response.text
    
    return kml_data