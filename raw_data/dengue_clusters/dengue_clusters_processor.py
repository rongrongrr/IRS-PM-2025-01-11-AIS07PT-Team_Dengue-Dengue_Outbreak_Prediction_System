import xml.etree.ElementTree as ET
import json
from datetime import datetime
import dengue_data_service as DengueDataService

dataset_id = "d_c00cbf056265738b684e63e890a113d2"

def parse_kml_to_json(kml_data):
    root = ET.fromstring(kml_data)
    namespaces = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    clusters = []
    for placemark in root.findall('.//kml:Placemark', namespaces):
        cluster = {}
        cluster['name'] = placemark.find('kml:name', namespaces).text
        cluster['description'] = placemark.find('kml:description', namespaces).text
        cluster['coordinates'] = placemark.find('.//kml:coordinates', namespaces).text.strip()
        
        extended_data = {}
        for data in placemark.findall('.//kml:SimpleData', namespaces):
            if data.attrib['name'] not in ['NAME', 'HYPERLINK', 'INC_CRC']:
                if data.attrib['name'] == 'FMEL_UPD_D':
                    extended_data['TIMESTAMP'] = datetime.strptime(data.text, '%Y%m%d%H%M%S').isoformat()
                else:
                    extended_data[data.attrib['name']] = data.text
        
        cluster['extended_data'] = extended_data
        clusters.append(cluster)
    
    return json.dumps(clusters, indent=4)

def process_get_dengue_clusters():
    kml_data = DengueDataService.get_request(dataset_id)
    json_output = parse_kml_to_json(kml_data)
    print(json_output)
    return json_output