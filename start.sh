#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Creating .env file from example..."
  echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
  echo "Please edit the .env file and add your actual API keys before running again."
  exit 1
fi

# Start docker containers
echo "Starting Docker containers..."
docker-compose up --build

# Exit with docker-compose exit status
exit $? 