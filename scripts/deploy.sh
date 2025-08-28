#!/bin/bash

echo "🚀 Deploying Case Study Generator..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run setup first."
    exit 1
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Check if build was successful
if [ ! -d "client/build" ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Start production server
echo "🌟 Starting production server..."
NODE_ENV=production npm start
