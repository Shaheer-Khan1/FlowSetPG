#!/bin/bash
# Start frontend development server

# Add Node.js to PATH
export PATH="$HOME/.local/node/bin:$PATH"

echo "🎨 Starting FlowSet Frontend..."
echo ""
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""
echo "Frontend will start on http://localhost:5173"
echo "Press Ctrl+C to stop"
echo ""

# Clean up any corrupted source maps that might cause issues
rm -f node_modules/jspdf/dist/*.map 2>/dev/null

# Start Vite dev server
npm run dev
