import folium
from folium.plugins import HeatMapWithTime
import geopandas as gpd
import os
import json
from datetime import datetime
import numpy as np

def create_timeline_map():
    # Create a Folium map centered on Singapore
    singapore_map = folium.Map(location=[1.3521, 103.8198], zoom_start=11)
    
    # Get all GeoJSON files in the weekly_data folder
    weekly_data_folder = "weekly_data"
    if not os.path.exists(weekly_data_folder):
        print("weekly_data folder not found!")
        return
    
    weekly_files = [f for f in os.listdir(weekly_data_folder) if f.endswith('.geojson')]
    weekly_files.sort()  # Sort files by name (date)
    
    # Create lists to store data for each timestamp
    data_by_week = []
    timestamps = []
    
    # Process each file
    for file in weekly_files:
        try:
            # Extract date from filename
            date_str = file.split('_')[-1].replace('.geojson', '')
            date_formatted = datetime.strptime(date_str, "%Y%m%d").strftime('%Y-%m-%d')
            timestamps.append(date_formatted)
            
            # Load the GeoJSON data
            file_path = os.path.join(weekly_data_folder, file)
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            # Create feature group for this week's clusters
            week_group = folium.FeatureGroup(name=f'Week {date_formatted}')
            
            # Process features
            week_data = []
            for feature in data['features']:
                case_size = feature['properties']['CASE_SIZE']
                locality = feature['properties']['LOCALITY']
                
                # Get the centroid of the polygon
                coords = feature['geometry']['coordinates'][0]  # First ring of the polygon
                centroid_lat = sum(coord[1] for coord in coords) / len(coords)
                centroid_lng = sum(coord[0] for coord in coords) / len(coords)
                
                # Add to week's data with weight based on case size
                week_data.append([centroid_lat, centroid_lng, case_size])
                
                # Add polygon to the map
                folium.GeoJson(
                    feature,
                    style_function=lambda x, case_size=case_size: {
                        'fillColor': '#ff0000',
                        'color': '#800000',
                        'weight': 2,
                        'fillOpacity': min(0.8, max(0.3, case_size / 50))
                    },
                    popup=folium.Popup(
                        f"""<div style='font-family: Arial, sans-serif;'>
                            <h4>{locality}</h4>
                            <b>Cases:</b> {case_size}<br>
                            <b>Date:</b> {date_formatted}
                        </div>""",
                        max_width=300
                    )
                ).add_to(week_group)
            
            data_by_week.append(week_data)
            week_group.add_to(singapore_map)
            
        except Exception as e:
            print(f"Error processing file {file}: {e}")
    
    # Add the time slider with heat map
    HeatMapWithTime(
        data_by_week,
        index=timestamps,
        auto_play=True,
        max_opacity=0.8,
        min_opacity=0.3,
        radius=25,
        name='Dengue Cases Heatmap'
    ).add_to(singapore_map)
    
    # Add a title to the map
    title_html = '''
        <div style="position: fixed; 
                    top: 10px; 
                    left: 50px; 
                    width: 300px; 
                    height: 90px; 
                    z-index:9999; 
                    background-color: rgba(255, 255, 255, 0.8);
                    border-radius: 10px;
                    padding: 10px;
                    font-family: Arial, sans-serif;">
            <h3>Singapore Dengue Clusters</h3>
            <p>Weekly evolution from Mar 2025 to Mar 2026</p>
        </div>
    '''
    singapore_map.get_root().html.add_child(folium.Element(title_html))
    
    # Add a legend
    legend_html = '''
        <div style="position: fixed; 
                    bottom: 50px; 
                    right: 50px; 
                    width: 200px; 
                    height: 120px; 
                    z-index:9999; 
                    background-color: rgba(255, 255, 255, 0.8);
                    border-radius: 10px;
                    padding: 10px;
                    font-family: Arial, sans-serif;">
            <h4>Case Size</h4>
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; background-color: #ff0000; opacity: 0.8; margin-right: 10px;"></div>
                <span>50+ cases</span>
            </div>
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; background-color: #ff0000; opacity: 0.6; margin-right: 10px;"></div>
                <span>30-49 cases</span>
            </div>
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; background-color: #ff0000; opacity: 0.4; margin-right: 10px;"></div>
                <span>10-29 cases</span>
            </div>
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; background-color: #ff0000; opacity: 0.3; margin-right: 10px;"></div>
                <span>1-9 cases</span>
            </div>
        </div>
    '''
    singapore_map.get_root().html.add_child(folium.Element(legend_html))
    
    # Add instructions
    instructions_html = '''
        <div style="position: fixed; 
                    top: 110px; 
                    left: 50px; 
                    width: 300px; 
                    height: 100px; 
                    z-index:9999; 
                    background-color: rgba(255, 255, 255, 0.8);
                    border-radius: 10px;
                    padding: 10px;
                    font-family: Arial, sans-serif;">
            <h4>How to Use</h4>
            <p>1. Use the play/pause button and slider at the bottom<br>
               2. Click on clusters to see details<br>
               3. Toggle layers using the control panel<br>
               4. The heatmap shows case density</p>
        </div>
    '''
    singapore_map.get_root().html.add_child(folium.Element(instructions_html))
    
    # Add Layer Control
    folium.LayerControl().add_to(singapore_map)
    
    # Save the map
    output_file = "dengue_clusters_timeline.html"
    singapore_map.save(output_file)
    print(f"Map saved to {output_file}")

if __name__ == "__main__":
    create_timeline_map() 