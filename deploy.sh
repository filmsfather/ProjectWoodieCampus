#!/bin/bash

# Woodie Campus EC2 Deployment Script
# This script automates the deployment process on EC2

set -e  # Exit on any error

echo "🚀 Starting Woodie Campus deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found! Please create it from .env.production template"
    exit 1
fi

print_status "Loading environment variables..."
source .env

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p uploads
mkdir -p ssl
mkdir -p logs

# Set proper permissions
chmod 755 uploads
chmod 755 logs

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Remove old images (optional, saves space)
print_warning "Removing old Docker images..."
docker image prune -f || true

# Build and start services
print_status "Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check backend health
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Check frontend
if curl -f http://localhost > /dev/null 2>&1; then
    print_success "Frontend is accessible"
else
    print_error "Frontend is not accessible"
    docker-compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker-compose -f docker-compose.prod.yml ps

print_success "Deployment completed successfully! 🎉"
print_status "Your application is running at:"
print_status "  Frontend: http://$(curl -s http://checkip.amazonaws.com)"
print_status "  Backend API: http://$(curl -s http://checkip.amazonaws.com)/api"
print_status "  Health Check: http://$(curl -s http://checkip.amazonaws.com)/health"

print_status "To check logs:"
print_status "  docker-compose -f docker-compose.prod.yml logs -f [service_name]"

print_status "To stop services:"
print_status "  docker-compose -f docker-compose.prod.yml down"