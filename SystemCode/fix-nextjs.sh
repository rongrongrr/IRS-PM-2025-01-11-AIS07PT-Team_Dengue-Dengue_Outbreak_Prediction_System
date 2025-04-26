#!/bin/bash

# Navigate to the frontend directory
cd frontend

# Remove node_modules and package-lock.json
echo "Cleaning up previous installation..."
rm -rf node_modules .next package-lock.json

# Install dependencies
echo "Installing dependencies..."
npm install

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p pages styles

# Run the development server
echo "Starting the development server..."
npm run dev 