#!/bin/bash

# Database Stop Script for NexusVite Platform
# Usage: ./scripts/db-stop.sh [dev|prod|test|all]

set -e

# Default to production if no environment specified
ENVIRONMENT=${1:-prod}

echo "🛑 Stopping NexusVite Platform databases..."
echo "Environment: $ENVIRONMENT"

case $ENVIRONMENT in
    "dev"|"development")
        echo "📝 Stopping development environment..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
        echo "✅ Development databases stopped!"
        ;;
    "test"|"testing")
        echo "🧪 Stopping test environment..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile testing down
        echo "✅ Test database stopped!"
        ;;
    "prod"|"production")
        echo "🏭 Stopping production environment..."
        docker-compose down
        echo "✅ Production databases stopped!"
        ;;
    "all")
        echo "🧹 Stopping all environments..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile testing down
        docker-compose down
        echo "✅ All databases stopped!"
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: dev, prod, test, all"
        exit 1
        ;;
esac

echo "🏁 Database services stopped successfully!"