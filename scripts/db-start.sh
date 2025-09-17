#!/bin/bash

# Database Start Script for NexusVite Platform
# Usage: ./scripts/db-start.sh [dev|prod|test]

set -e

# Default to production if no environment specified
ENVIRONMENT=${1:-prod}

echo "🚀 Starting NexusVite Platform databases..."
echo "Environment: $ENVIRONMENT"

case $ENVIRONMENT in
    "dev"|"development")
        echo "📝 Starting development environment..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis pgadmin
        echo "✅ Development databases started!"
        echo "📊 PostgreSQL: localhost:5433 (dev_user/dev_password)"
        echo "🔴 Redis: localhost:6380"
        echo "🌐 pgAdmin: http://localhost:5051 (dev@nexusvite.com/dev_password)"
        ;;
    "test"|"testing")
        echo "🧪 Starting test environment..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile testing up -d postgres-test
        echo "✅ Test database started!"
        echo "📊 PostgreSQL Test: localhost:5434 (test_user/test_password)"
        ;;
    "prod"|"production")
        echo "🏭 Starting production environment..."
        docker-compose up -d postgres redis pgadmin
        echo "✅ Production databases started!"
        echo "📊 PostgreSQL: localhost:5432 (postgres/postgres_password)"
        echo "🔴 Redis: localhost:6379"
        echo "🌐 pgAdmin: http://localhost:5050 (admin@nexusvite.com/admin_password)"
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: dev, prod, test"
        exit 1
        ;;
esac

echo ""
echo "⏳ Waiting for databases to be ready..."
sleep 5

# Check if PostgreSQL is ready
case $ENVIRONMENT in
    "dev"|"development")
        docker-compose exec postgres pg_isready -U dev_user -d nexusvite_platform_dev -h localhost
        ;;
    "test"|"testing")
        docker-compose exec postgres-test pg_isready -U test_user -d nexusvite_platform_test -h localhost
        ;;
    "prod"|"production")
        docker-compose exec postgres pg_isready -U postgres -d nexusvite_platform -h localhost
        ;;
esac

if [ $? -eq 0 ]; then
    echo "✅ Databases are ready!"
else
    echo "⚠️  Databases may still be starting up. Please wait a moment and try connecting."
fi