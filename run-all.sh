#!/bin/bash
# Start all services

echo "🚀 Starting FlowSet Services..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "  1. Run: ./install-node.sh"
    echo "  2. Or manually install from: https://nodejs.org/"
    echo ""
    exit 1
fi

# Check if PostgreSQL is running
if ! docker ps --filter name=flowset-postgres --format "{{.Names}}" | grep -q flowset-postgres; then
    echo "🐘 Starting PostgreSQL..."
    ./docker-start.sh
    echo ""
fi

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo ""
fi

# Run status check
echo "📊 System Status:"
./status.sh
echo ""

# Ask what to run
echo "What would you like to run?"
echo "  1. Test database connection (npm run test:db)"
echo "  2. Start backend server (npm run start)"
echo "  3. Start backend in dev mode (npm run dev)"
echo "  4. Both - Start frontend and backend"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🧪 Testing database connection..."
        cd backend
        npm run test:db
        ;;
    2)
        echo ""
        echo "🚀 Starting backend server..."
        cd backend
        npm run start
        ;;
    3)
        echo ""
        echo "🔥 Starting backend in dev mode..."
        cd backend
        npm run dev
        ;;
    4)
        echo ""
        echo "🚀 Starting both frontend and backend..."
        echo "Opening backend in this terminal..."
        cd backend
        npm run dev &
        BACKEND_PID=$!
        cd ..
        
        echo "Starting frontend..."
        npm run dev &
        FRONTEND_PID=$!
        
        echo ""
        echo "✅ Services started!"
        echo "   Backend PID: $BACKEND_PID"
        echo "   Frontend PID: $FRONTEND_PID"
        echo ""
        echo "Press Ctrl+C to stop all services"
        
        trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
        wait
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
