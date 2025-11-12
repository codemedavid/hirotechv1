#!/bin/bash

# Hiro Campaign System Starter Script
# For Mac/Linux/WSL

echo ""
echo "========================================"
echo "  STARTING HIRO CAMPAIGN SYSTEM"
echo "========================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "[WARNING] .env.local not found"
    echo "Please create .env.local with REDIS_URL"
    exit 1
fi

echo "[OK] .env.local file found"
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm not found"
    echo "Please install Node.js and npm"
    exit 1
fi

echo "Starting services..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $WORKER_PID $DEV_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start worker in background
echo "[1/2] Starting Campaign Worker..."
npm run worker &
WORKER_PID=$!

# Wait a moment
sleep 2

# Start dev server in background
echo "[2/2] Starting Dev Server..."
npm run dev &
DEV_PID=$!

# Wait for dev server to start
sleep 5

echo ""
echo "========================================"
echo "  SYSTEM STARTED SUCCESSFULLY!"
echo "========================================"
echo ""
echo "Services running:"
echo "  - Campaign Worker (PID: $WORKER_PID)"
echo "  - Dev Server (PID: $DEV_PID)"
echo ""
echo "Your app is now running at:"
echo "  http://localhost:3000"
echo ""
echo "To send campaign messages:"
echo "  1. Go to Campaigns page"
echo "  2. Create or select a campaign"
echo "  3. Click 'Start Campaign'"
echo "  4. Watch this terminal for progress"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Open browser (works on Mac)
if command -v open &> /dev/null; then
    open http://localhost:3000
# Or Linux with xdg-open
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi

# Wait for processes
wait $WORKER_PID $DEV_PID

