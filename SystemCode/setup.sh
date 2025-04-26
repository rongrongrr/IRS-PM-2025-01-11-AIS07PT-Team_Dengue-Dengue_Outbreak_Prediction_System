#!/bin/bash

# Create static directory in backend if it doesn't exist
mkdir -p backend/static

# Copy data files to backend directory
echo "Copying data files to backend directory..."

# Check if the source files exist
if [ ! -f "prediction_model/combined_data.pkl" ]; then
  echo "Error: combined_data.pkl not found in prediction_model directory"
  exit 1
fi

if [ ! -f "prediction_model/dengue_RFR_model.pkl" ]; then
  echo "Error: dengue_RFR_model.pkl not found in prediction_model directory"
  exit 1
fi

# Copy the files
cp prediction_model/combined_data.pkl backend/
cp prediction_model/dengue_RFR_model.pkl backend/

echo "Setup complete!" 