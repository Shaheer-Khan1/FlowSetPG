#!/bin/bash
# Start FlowSet IoT Platform - Complete Stack

# Add Node.js to PATH
export PATH="$HOME/.local/node/bin:$PATH"

echo "╔════════════════════════════════════════════════╗"
echo "║   FlowSet IoT Platform - Complete Stack       ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check PostgreSQL
echo "🔍 Checking PostgreSQL..."
if ! docker ps | grep -q flowset-postgres; then
    echo "⚠️  PostgreSQL not running. Starting it..."
    ./docker-start.sh
    sleep 3
fi
echo "✅ PostgreSQL is running"
echo ""

# Create logs directory
mkdir -p logs

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "👋 FlowSet Platform stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "📡 Starting Backend API Server..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start frontend
echo "🎨 Starting Frontend Server..."
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   FlowSet Platform is Running!                ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "🗄️  Database:  PostgreSQL (flowset_db)"
echo "📡 Backend:   http://localhost:3001 (PID: $BACKEND_PID)"
echo "🌐 Frontend:  http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "📚 Documentation:"
echo "   - Backend API:  backend/README.md"
echo "   - Complete:     BACKEND_API_COMPLETE.md"
echo "   - Frontend:     FRONTEND_INTEGRATION_GUIDE.md"
echo ""
echo "📊 View logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "🔓 Development Mode - Auth Bypassed"
echo "🔄 Hot Reload Enabled"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Keep script running
wait
