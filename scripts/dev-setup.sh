#!/bin/bash

# HighPay Backend Development Setup Script
# This script sets up the development environment using Docker Compose

set -e

echo "🚀 Setting up HighPay Backend Development Environment..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs uploads temp ssl

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "📋 Copying .env.example to .env..."
        cp .env.example .env
        echo "⚠️  Please edit .env file with your configuration before proceeding."
    else
        echo "⚠️  No .env file found. Creating a basic one..."
        cat > .env << EOF
# HighPay Backend Environment Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=highpay_dev
DB_USER=postgres
DB_PASSWORD=postgres

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Allowed Origins (CORS)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Email Configuration (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Firebase Configuration (Optional)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Monitoring (Optional)
GRAFANA_PASSWORD=admin
EOF
        echo "⚠️  Please edit .env file with your configuration before proceeding."
    fi
fi

# Build and start development services
echo "🔨 Building and starting development services..."
docker-compose --profile development up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Show logs
echo "📋 Showing recent logs..."
docker-compose logs --tail=50

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "🔗 Access points:"
echo "   API: http://localhost:3000"
echo "   API Docs: http://localhost:3000/api-docs"
echo "   Health: http://localhost:3000/health"
echo "   Database: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart API: docker-compose restart api-dev"
echo "   Access database: docker-compose exec postgres psql -U postgres -d highpay_dev"
echo "   Access Redis: docker-compose exec redis redis-cli"
echo ""
echo "🎉 Happy coding!"
