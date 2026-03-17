#!/bin/bash
# Start backend server (simple mode, no auto-reload)

# Add Node.js to PATH
export PATH="$HOME/.local/node/bin:$PATH"

# Load environment variables
export $(grep -v '^#' ../.env | xargs)

echo "🚀 Starting FlowSet Backend Server (Simple Mode)..."
echo ""
echo "Node.js version: $(node --version)"
echo "Server will start on port ${PORT:-3001}"
echo "Press Ctrl+C to stop"
echo ""

# Start the server
node server.js
