#!/bin/bash

# Set up the backend
echo "Setting up the backend..."
cd backend
pip install -r requirements.txt

# Run the setup script to copy data files
cd ..
./setup.sh

# Set up the frontend
echo "Setting up the frontend..."
cd frontend
npm install

echo "Installation complete!"
echo "To run the application:"
echo "1. Start the backend: cd backend && uvicorn main:app --reload"
echo "2. Start the frontend: cd frontend && npm run dev"
echo "3. Open your browser and navigate to http://localhost:3000" 