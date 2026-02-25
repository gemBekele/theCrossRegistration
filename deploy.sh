#!/bin/bash

# The Cross Fellowship Deployment Script

set -e

echo "🚀 Starting deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please create one from .env.example"
    exit 1
fi

# Cleanup .env (remove Windows line endings if they exist)
sed -i 's/\r//' .env

# Load environment variables
echo "📝 Loading environment variables..."
set -a
source .env
set +a

# Verify DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set! Check your .env file."
    exit 1
else
    # Mask password for safety in logs
    MASKED_URL=$(echo $DATABASE_URL | sed 's/:[^@:]*@/:****@/')
    echo "✅ DATABASE_URL is set: $MASKED_URL"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Run migrations
echo "🗄️ Running database migrations..."
npm run migrate

# Build backend
echo "🔨 Building backend..."
npm run build

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Copy frontend build to backend public folder
echo "📋 Copying frontend build..."
rm -rf ../backend/public
mkdir -p ../backend/public
cp -r dist/* ../backend/public/

cd ..

# Start with PM2 or Docker
echo "🚀 Starting application..."

if command -v pm2 &> /dev/null; then
    echo "Using PM2..."
    cd backend
    pm2 delete thecross 2>/dev/null || true
    pm2 start dist/index.js --name thecross
    pm2 save
else
    echo "Using Docker..."
    docker-compose down
    docker-compose up -d
fi

echo "✅ Deployment complete!"
echo ""
echo "📊 API: http://localhost:5000/api"
echo "🌐 Dashboard: http://localhost:5000"
echo "🤖 Telegram Bot is running"
echo ""
echo "Default credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "⚠️  Please change the default password after first login!"