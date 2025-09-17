#!/bin/bash

# Database Reset Script for NexusVite Platform
# Usage: ./scripts/db-reset.sh [dev|prod|test|all]
# WARNING: This will delete all data!

set -e

# Default to development for safety
ENVIRONMENT=${1:-dev}

echo "⚠️  WARNING: This will delete all database data!"
echo "Environment: $ENVIRONMENT"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "❌ Reset cancelled."
    exit 1
fi

echo "🗑️  Resetting NexusVite Platform databases..."

case $ENVIRONMENT in
    "dev"|"development")
        echo "📝 Resetting development environment..."
        # Stop services
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
        # Remove volumes
        docker volume rm -f nexusvite_postgres_dev_data || true
        docker volume rm -f nexusvite_redis_dev_data || true
        docker volume rm -f nexusvite_pgadmin_dev_data || true
        # Restart services
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis pgadmin
        echo "✅ Development environment reset complete!"
        ;;
    "test"|"testing")
        echo "🧪 Resetting test environment..."
        # Stop services
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile testing down -v
        # Restart test database
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile testing up -d postgres-test
        echo "✅ Test environment reset complete!"
        ;;
    "prod"|"production")
        echo "🏭 Resetting production environment..."
        read -p "⚠️  DANGER: This will delete PRODUCTION data! Type 'DELETE PRODUCTION DATA' to confirm: " -r
        echo
        if [[ ! $REPLY == "DELETE PRODUCTION DATA" ]]; then
            echo "❌ Production reset cancelled."
            exit 1
        fi
        # Stop services
        docker-compose down -v
        # Remove volumes
        docker volume rm -f nexusvite_postgres_data || true
        docker volume rm -f nexusvite_redis_data || true
        docker volume rm -f nexusvite_pgadmin_data || true
        # Restart services
        docker-compose up -d postgres redis pgadmin
        echo "✅ Production environment reset complete!"
        ;;
    "all")
        echo "🧹 Resetting all environments..."
        read -p "⚠️  EXTREME DANGER: This will delete ALL data including PRODUCTION! Type 'DELETE ALL DATA' to confirm: " -r
        echo
        if [[ ! $REPLY == "DELETE ALL DATA" ]]; then
            echo "❌ Full reset cancelled."
            exit 1
        fi
        # Stop all services
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile testing down -v
        docker-compose down -v
        # Remove all volumes
        docker volume rm -f nexusvite_postgres_data || true
        docker volume rm -f nexusvite_redis_data || true
        docker volume rm -f nexusvite_pgadmin_data || true
        docker volume rm -f nexusvite_postgres_dev_data || true
        docker volume rm -f nexusvite_redis_dev_data || true
        docker volume rm -f nexusvite_pgadmin_dev_data || true
        echo "✅ All environments reset complete!"
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: dev, prod, test, all"
        exit 1
        ;;
esac

echo ""
echo "⏳ Waiting for databases to initialize..."
sleep 10

echo "🎉 Database reset completed successfully!"
echo "💡 Don't forget to run your migrations and seed data:"
echo "   npm run db:migrate"
echo "   npm run db:seed"