#!/bin/bash
# Install Node.js 20.x on Ubuntu/Debian

echo "🚀 Installing Node.js 20.x..."
echo ""
echo "This script requires sudo access."
echo ""

# Download and setup NodeSource repository
echo "📦 Adding NodeSource repository..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
echo ""
echo "📦 Installing Node.js..."
sudo apt-get install -y nodejs

# Verify installation
echo ""
echo "✅ Verifying installation..."
node --version
npm --version

echo ""
echo "✅ Node.js installation complete!"
echo ""
echo "Next steps:"
echo "  1. cd backend"
echo "  2. npm install"
echo "  3. npm run test:db"
