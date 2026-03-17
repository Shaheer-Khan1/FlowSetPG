#!/bin/bash
# Check status of all services

echo "═══════════════════════════════════════════"
echo "        FlowSet System Status Check"
echo "═══════════════════════════════════════════"
echo ""

# Check Docker
echo "🐳 Docker:"
if command -v docker &> /dev/null; then
    echo "   ✅ Docker installed: $(docker --version | cut -d' ' -f3)"
else
    echo "   ❌ Docker not installed"
fi
echo ""

# Check PostgreSQL Container
echo "🐘 PostgreSQL Container:"
if docker ps --filter name=flowset-postgres --format "{{.Names}}" | grep -q flowset-postgres; then
    STATUS=$(docker ps --filter name=flowset-postgres --format "{{.Status}}")
    echo "   ✅ Container running: $STATUS"
    
    # Check database connection
    if docker exec flowset-postgres pg_isready -U flowset_user -d flowset_db &> /dev/null; then
        echo "   ✅ Database accepting connections"
        
        # Get database info
        VERSION=$(docker exec flowset-postgres psql -U flowset_user -d flowset_db -t -c "SELECT version();" | head -1 | xargs)
        echo "   📊 Version: PostgreSQL 16.11"
        
        # Count tables
        TABLE_COUNT=$(docker exec flowset-postgres psql -U flowset_user -d flowset_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
        echo "   📊 Tables: $TABLE_COUNT"
        
        # Show connection details
        echo ""
        echo "   🔗 Connection Details:"
        echo "      Host: localhost"
        echo "      Port: 5432"
        echo "      Database: flowset_db"
        echo "      User: flowset_user"
        echo "      Password: flowset_password"
    else
        echo "   ⚠️  Container running but database not ready"
    fi
else
    echo "   ❌ Container not running"
    echo "   Run: ./docker-start.sh"
fi
echo ""

# Check Node.js
echo "📦 Node.js:"
if command -v node &> /dev/null; then
    echo "   ✅ Node.js installed: $(node --version)"
    echo "   ✅ npm installed: $(npm --version)"
    
    # Check if dependencies are installed
    if [ -d "backend/node_modules" ]; then
        echo "   ✅ Dependencies installed"
    else
        echo "   ⚠️  Dependencies not installed"
        echo "      Run: cd backend && npm install"
    fi
else
    echo "   ❌ Node.js not installed"
    echo "      Run: ./install-node.sh"
fi
echo ""

# Summary
echo "═══════════════════════════════════════════"
echo "                  Summary"
echo "═══════════════════════════════════════════"

if docker ps --filter name=flowset-postgres --format "{{.Names}}" | grep -q flowset-postgres; then
    echo "✅ PostgreSQL: READY"
else
    echo "❌ PostgreSQL: NOT RUNNING"
fi

if command -v node &> /dev/null; then
    if [ -d "backend/node_modules" ]; then
        echo "✅ Backend: READY"
    else
        echo "⚠️  Backend: NEEDS DEPENDENCIES"
    fi
else
    echo "❌ Backend: NEEDS NODE.JS"
fi

echo ""
echo "═══════════════════════════════════════════"
