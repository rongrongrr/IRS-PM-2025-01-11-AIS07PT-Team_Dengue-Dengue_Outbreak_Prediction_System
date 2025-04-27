#!/bin/bash

# Activate virtual environment
source .venv/bin/activate

# Run the FastAPI application with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level debug
