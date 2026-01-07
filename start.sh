#!/bin/bash

# Start script for Trex Media NFT Tracker
# Runs both backend and frontend concurrently

set -e

echo "🚀 Starting Trex Media NFT Tracker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if backend key exists
if [ ! -f "$SCRIPT_DIR/s_backend/backend-key.pem" ]; then
    echo -e "${RED}❌ Error: Backend key not found at s_backend/backend-key.pem${NC}"
    echo "Please add your backend wallet PEM file."
    exit 1
fi

# Install dependencies if needed
echo -e "${BLUE}📦 Checking dependencies...${NC}"

if [ ! -d "$SCRIPT_DIR/s_backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    (cd "$SCRIPT_DIR/s_backend" && pnpm install)
fi

if [ ! -d "$SCRIPT_DIR/s_frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    (cd "$SCRIPT_DIR/s_frontend" && pnpm install)
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${GREEN}🔧 Starting backend server on http://localhost:3001...${NC}"
(cd "$SCRIPT_DIR/s_backend" && pnpm exec tsc > /dev/null 2>&1 && node dist/index.js) &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend
echo -e "${GREEN}🌐 Starting frontend on http://localhost:5173...${NC}"
(cd "$SCRIPT_DIR/s_frontend" && pnpm dev) &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✅ Both services started!${NC}"
echo ""
echo -e "  Backend:  ${BLUE}http://localhost:3001${NC}"
echo -e "  Frontend: ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
