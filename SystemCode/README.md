# Dengue Risk Prediction Web Application

This web application allows users to predict dengue risk based on postal codes in Singapore. It uses a machine learning model to analyze various factors such as land use, nearby dengue clusters, humidity, and rainfall scores.

## Project Structure

<!-- - `backend/`: Python FastAPI backend
- `frontend/`: Next.js frontend -->

## Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

## Quick Installation

1. Unzip /SystemCode/backend/combined_data.pkl.zip to the same folder
For a quick setup, you can use the provided installation script:

```bash
cd dengue-risk-app
./install.sh
```

This script will:
1. Install backend dependencies
2. Copy necessary data files to the backend directory
3. Install frontend dependencies

## Manual Setup and Running

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Make sure the following files are in the backend directory:
   - `combined_data.pkl`: Contains all the dataframes
   - `dengue_RFR_model.pkl`: The trained Random Forest model

4. Run the backend server:
   ```
   uvicorn main:app --reload
   ```

### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter a postal code in the input field
2. Click "Predict Risk" to see the prediction results
3. The application will display:
   - Risk level (Low, Medium, High)
   - Predicted number of cases
   - Land use information
   - Nearby dengue clusters
   - A map showing the postal code location and land use area

## Features

- Interactive map with Folium
- Risk level categorization
- Detailed feature information
- Responsive design

## Troubleshooting

### Installation Issues

If you encounter issues with the installation:

1. Make sure you have the correct Python version (3.8+)
2. If you see errors related to pickle5, the application has been updated to use the built-in pickle module instead
3. Ensure that the data files (`combined_data.pkl` and `dengue_RFR_model.pkl`) are available in the prediction_model directory 

from fastapi.staticfiles import StaticFiles

app.mount("/static", StaticFiles(directory="static"), name="static") 