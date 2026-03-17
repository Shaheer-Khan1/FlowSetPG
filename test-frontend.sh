#!/bin/bash
# Quick test to see if frontend starts without errors

# Add Node.js to PATH
export PATH="$HOME/.local/node/bin:$PATH"

echo "🧪 Testing frontend build..."
cd /home/linux/Desktop/FlowSet/FlowSetPG

# Try to start vite and kill it after a few seconds
timeout 10s npm run dev 2>&1 | tee /tmp/vite-test.log &
VITE_PID=$!

sleep 5

# Check if vite is still running (good sign)
if kill -0 $VITE_PID 2>/dev/null; then
    echo "✅ Frontend started successfully!"
    kill $VITE_PID 2>/dev/null
    exit 0
else
    echo "❌ Frontend failed to start"
    cat /tmp/vite-test.log
    exit 1
fi
