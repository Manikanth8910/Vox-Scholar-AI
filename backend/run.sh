#!/bin/bash

# VoxScholar AI Backend Startup Script

# Navigate to backend directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env with your API keys!"
fi

# Run database migrations (for production)
# alembic upgrade head

# Start the server
echo "Starting VoxScholar AI Backend..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

