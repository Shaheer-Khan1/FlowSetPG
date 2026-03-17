#!/bin/bash
# Start PostgreSQL Docker Container

echo "🐳 Starting PostgreSQL container..."

# Check if container exists
if docker ps -a --format '{{.Names}}' | grep -q "^flowset-postgres$"; then
    echo "Container exists. Starting..."
    docker start flowset-postgres
else
    echo "Creating new container..."
    docker run -d \
      --name flowset-postgres \
      -e POSTGRES_USER=flowset_user \
      -e POSTGRES_PASSWORD=flowset_password \
      -e POSTGRES_DB=flowset_db \
      -p 5432:5432 \
      -v flowset_postgres_data:/var/lib/postgresql/data \
      -v "$(pwd)/init-db":/docker-entrypoint-initdb.d \
      postgres:16-alpine
fi

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Check if PostgreSQL is ready
if docker exec flowset-postgres pg_isready -U flowset_user -d flowset_db > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready!"
    echo ""
    echo "Connection details:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Database: flowset_db"
    echo "  User: flowset_user"
    echo ""
    echo "Run 'docker logs flowset-postgres' to view logs"
    echo "Run './docker-stop.sh' to stop the container"
else
    echo "❌ PostgreSQL is not ready yet. Check logs with: docker logs flowset-postgres"
    exit 1
fi
