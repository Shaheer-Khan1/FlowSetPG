#!/bin/bash
# Stop PostgreSQL Docker Container

echo "🛑 Stopping PostgreSQL container..."
docker stop flowset-postgres

echo "✅ PostgreSQL container stopped"
echo ""
echo "Run './docker-start.sh' to start it again"
echo "Run './docker-remove.sh' to remove the container and data"
