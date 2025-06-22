@echo off
REM HighPay Backend Development Setup Script (Windows)
REM This script sets up the development environment using Docker Compose

echo 🚀 Setting up HighPay Backend Development Environment...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not available. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "temp" mkdir temp
if not exist "ssl" mkdir ssl

REM Copy environment file if it doesn't exist
if not exist ".env" (
    if exist ".env.example" (
        echo 📋 Copying .env.example to .env...
        copy .env.example .env
        echo ⚠️  Please edit .env file with your configuration before proceeding.
    ) else (
        echo ⚠️  No .env file found. Creating a basic one...
        (
            echo # HighPay Backend Environment Configuration
            echo NODE_ENV=development
            echo PORT=3000
            echo.
            echo # Database Configuration
            echo DB_HOST=localhost
            echo DB_PORT=5432
            echo DB_NAME=highpay_dev
            echo DB_USER=postgres
            echo DB_PASSWORD=postgres
            echo.
            echo # Redis Configuration
            echo REDIS_HOST=localhost
            echo REDIS_PORT=6379
            echo.
            echo # JWT Configuration
            echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
            echo JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
            echo.
            echo # Allowed Origins ^(CORS^)
            echo ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
            echo.
            echo # Email Configuration ^(Optional^)
            echo SMTP_HOST=
            echo SMTP_PORT=587
            echo SMTP_USER=
            echo SMTP_PASS=
            echo.
            echo # Firebase Configuration ^(Optional^)
            echo FIREBASE_PROJECT_ID=
            echo FIREBASE_CLIENT_EMAIL=
            echo FIREBASE_PRIVATE_KEY=
            echo.
            echo # Monitoring ^(Optional^)
            echo GRAFANA_PASSWORD=admin
        ) > .env
        echo ⚠️  Please edit .env file with your configuration before proceeding.
    )
)

REM Build and start development services
echo 🔨 Building and starting development services...
docker-compose --profile development up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service health
echo 🏥 Checking service health...
docker-compose ps

REM Show logs
echo 📋 Showing recent logs...
docker-compose logs --tail=50

echo.
echo ✅ Development environment is ready!
echo.
echo 🔗 Access points:
echo    API: http://localhost:3000
echo    API Docs: http://localhost:3000/api-docs
echo    Health: http://localhost:3000/health
echo    Database: localhost:5432
echo    Redis: localhost:6379
echo.
echo 📝 Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart API: docker-compose restart api-dev
echo    Access database: docker-compose exec postgres psql -U postgres -d highpay_dev
echo    Access Redis: docker-compose exec redis redis-cli
echo.
echo 🎉 Happy coding!
pause
