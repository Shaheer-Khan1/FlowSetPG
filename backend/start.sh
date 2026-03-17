#!/bin/bash
# Start FlowSet IoT Platform API Server

# Add Node.js to PATH
export PATH="$HOME/.local/node/bin:$PATH"

# Load environment variables
export $(grep -v '^#' ../.env | xargs)

echo "🚀 Starting FlowSet IoT Platform API Server..."
echo ""
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""
echo "Database: PostgreSQL (flowset_db)"
echo "Auth: Bypassed (development mode)"
echo "Server will start on port ${PORT:-3001}"
echo ""
echo "API Endpoints:"
echo "  - Tenants, Users, Teams"
echo "  - Devices, Installations, Locations"
echo "  - Alerts, Alert Rules"
echo "  - Firmware, FOTA Jobs"
echo "  - Analytics & Dashboard"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the server
npm run dev
