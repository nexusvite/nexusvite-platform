#!/bin/bash

# Database Status Script for NexusVite Platform
# Usage: ./scripts/db-status.sh

set -e

echo "📊 NexusVite Platform Database Status"
echo "====================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Production Services
echo "🏭 Production Services:"
echo "----------------------"
PROD_POSTGRES=$(docker-compose ps -q postgres 2>/dev/null || echo "")
PROD_REDIS=$(docker-compose ps -q redis 2>/dev/null || echo "")
PROD_PGADMIN=$(docker-compose ps -q pgadmin 2>/dev/null || echo "")

if [ ! -z "$PROD_POSTGRES" ]; then
    POSTGRES_STATUS=$(docker inspect --format='{{.State.Status}}' $PROD_POSTGRES)
    echo "📊 PostgreSQL: $POSTGRES_STATUS (Port: 5432)"
    if [ "$POSTGRES_STATUS" = "running" ]; then
        docker-compose exec postgres pg_isready -U postgres -d nexusvite_platform -h localhost > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "   ✅ Database connection: OK"
        else
            echo "   ⚠️  Database connection: Not ready"
        fi
    fi
else
    echo "📊 PostgreSQL: Not running"
fi

if [ ! -z "$PROD_REDIS" ]; then
    REDIS_STATUS=$(docker inspect --format='{{.State.Status}}' $PROD_REDIS)
    echo "🔴 Redis: $REDIS_STATUS (Port: 6379)"
else
    echo "🔴 Redis: Not running"
fi

if [ ! -z "$PROD_PGADMIN" ]; then
    PGADMIN_STATUS=$(docker inspect --format='{{.State.Status}}' $PROD_PGADMIN)
    echo "🌐 pgAdmin: $PGADMIN_STATUS (http://localhost:5050)"
else
    echo "🌐 pgAdmin: Not running"
fi

echo ""

# Development Services
echo "📝 Development Services:"
echo "------------------------"
DEV_POSTGRES=$(docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps -q postgres 2>/dev/null || echo "")
DEV_REDIS=$(docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps -q redis 2>/dev/null || echo "")
DEV_PGADMIN=$(docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps -q pgadmin 2>/dev/null || echo "")

if [ ! -z "$DEV_POSTGRES" ]; then
    DEV_POSTGRES_STATUS=$(docker inspect --format='{{.State.Status}}' $DEV_POSTGRES)
    echo "📊 PostgreSQL Dev: $DEV_POSTGRES_STATUS (Port: 5433)"
else
    echo "📊 PostgreSQL Dev: Not running"
fi

if [ ! -z "$DEV_REDIS" ]; then
    DEV_REDIS_STATUS=$(docker inspect --format='{{.State.Status}}' $DEV_REDIS)
    echo "🔴 Redis Dev: $DEV_REDIS_STATUS (Port: 6380)"
else
    echo "🔴 Redis Dev: Not running"
fi

if [ ! -z "$DEV_PGADMIN" ]; then
    DEV_PGADMIN_STATUS=$(docker inspect --format='{{.State.Status}}' $DEV_PGADMIN)
    echo "🌐 pgAdmin Dev: $DEV_PGADMIN_STATUS (http://localhost:5051)"
else
    echo "🌐 pgAdmin Dev: Not running"
fi

echo ""

# Test Services
echo "🧪 Test Services:"
echo "-----------------"
TEST_POSTGRES=$(docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile testing ps -q postgres-test 2>/dev/null || echo "")

if [ ! -z "$TEST_POSTGRES" ]; then
    TEST_POSTGRES_STATUS=$(docker inspect --format='{{.State.Status}}' $TEST_POSTGRES)
    echo "📊 PostgreSQL Test: $TEST_POSTGRES_STATUS (Port: 5434)"
else
    echo "📊 PostgreSQL Test: Not running"
fi

echo ""

# Volume Information
echo "💾 Volume Information:"
echo "----------------------"
docker volume ls | grep nexusvite || echo "No NexusVite volumes found"

echo ""
echo "🛠️  Management Commands:"
echo "----------------------"
echo "Start production:    ./scripts/db-start.sh prod"
echo "Start development:   ./scripts/db-start.sh dev"
echo "Start testing:       ./scripts/db-start.sh test"
echo "Stop services:       ./scripts/db-stop.sh [env]"
echo "Reset databases:     ./scripts/db-reset.sh [env]"