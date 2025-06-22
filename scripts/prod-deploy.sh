#!/bin/bash

# HighPay Backend Production Deployment Script
# This script deploys the application in production mode

set -e

echo "🚀 Deploying HighPay Backend to Production..."

# Check if required environment variables are set
required_vars=("JWT_SECRET" "JWT_REFRESH_SECRET" "DB_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs uploads temp ssl monitoring

# Generate SSL certificates if they don't exist
if [ ! -f ssl/server.crt ] || [ ! -f ssl/server.key ]; then
    echo "🔐 Generating self-signed SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/server.key \
        -out ssl/server.crt \
        -subj "/C=US/ST=State/L=City/O=HighPay/CN=localhost"
    echo "⚠️  Using self-signed certificates. Replace with proper certificates for production."
fi

# Create monitoring configuration if it doesn't exist
if [ ! -f monitoring/prometheus.yml ]; then
    echo "📊 Creating Prometheus configuration..."
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'highpay-api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF
fi

# Build production images
echo "🔨 Building production images..."
docker-compose --profile production build --no-cache

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start production services
echo "🌟 Starting production services..."
docker-compose --profile production up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations if needed
echo "🗄️ Running database migrations..."
# docker-compose exec api npm run db:migrate

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Run health checks
echo "🩺 Running health checks..."
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3000/health &>/dev/null; then
        echo "✅ API health check passed"
        break
    else
        echo "⏳ Attempt $attempt/$max_attempts: API not ready yet..."
        sleep 5
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ API health check failed after $max_attempts attempts"
    docker-compose logs api
    exit 1
fi

# Show service status
echo "📊 Service Status:"
docker-compose ps

# Show resource usage
echo "💽 Resource Usage:"
docker stats --no-stream

echo ""
echo "✅ Production deployment completed successfully!"
echo ""
echo "🔗 Access points:"
echo "   API: http://localhost:3000"
echo "   API (HTTPS): https://localhost:443"
echo "   API Docs: http://localhost:3000/api-docs"
echo "   Health: http://localhost:3000/health"
echo "   Monitoring: http://localhost:9090 (Prometheus)"
echo "   Dashboard: http://localhost:3001 (Grafana)"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart API: docker-compose restart api"
echo "   Scale API: docker-compose up -d --scale api=3"
echo "   Update deployment: ./scripts/prod-deploy.sh"
echo ""
echo "🔒 Security reminders:"
echo "   - Replace self-signed certificates with proper SSL certificates"
echo "   - Update default passwords in .env file"
echo "   - Configure firewall rules for production"
echo "   - Set up regular backups for database"
echo ""
echo "🎉 Your HighPay Backend is now running in production mode!"
