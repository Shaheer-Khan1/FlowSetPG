#!/bin/bash
# Remove PostgreSQL Docker Container and Data

echo "⚠️  WARNING: This will delete the PostgreSQL container and all data!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    echo "🗑️  Stopping and removing container..."
    docker stop flowset-postgres 2>/dev/null
    docker rm flowset-postgres 2>/dev/null
    
    echo "🗑️  Removing data volume..."
    docker volume rm flowset_postgres_data 2>/dev/null
    
    echo "✅ PostgreSQL container and data removed"
    echo ""
    echo "Run './docker-start.sh' to create a new container"
else
    echo "❌ Cancelled"
fi
