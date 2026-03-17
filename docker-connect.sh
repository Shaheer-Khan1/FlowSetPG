#!/bin/bash
# Connect to PostgreSQL using psql

echo "🔌 Connecting to PostgreSQL..."
echo ""
docker exec -it flowset-postgres psql -U flowset_user -d flowset_db
