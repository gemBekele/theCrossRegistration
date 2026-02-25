#!/bin/bash

# The Cross Fellowship Deployment Script

set -e

echo "🚀 Starting deployment..."

echo "📝 Locating environment variables..."
ENV_FILE=""

if [ -f .env ]; then
    ENV_FILE=".env"
elif [ -f backend/.env ]; then
    ENV_FILE="backend/.env"
fi

if [ -z "$ENV_FILE" ]; then
    echo "❌ .env file not found! Please create one in the root or backend directory."
    exit 1
fi

echo "📂 Found configuration at $ENV_FILE"

# Cleanup .env (remove Windows line endings if they exist)
sed -i 's/\r//' "$ENV_FILE"

# Load environment variables
echo "📝 Loading environment variables..."
export $(grep -v '^#' "$ENV_FILE" | xargs)
echo "🌐 Environment: development (for build stage)"

# Verify DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set in $ENV_FILE!"
    echo "💡 Make sure it's defined like: DATABASE_URL=postgresql://user:password@localhost:5432/thecross"
    exit 1
else
    # Mask password for safety in logs
    MASKED_URL=$(echo $DATABASE_URL | sed 's/:[^@:]*@/:****@/')
    echo "✅ DATABASE_URL is set: $MASKED_URL"
fi

# Verify JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET is not set in $ENV_FILE!"
    echo "💡 Add a random secret like: JWT_SECRET=$(openssl rand -base64 32)"
    exit 1
else
    echo "✅ JWT_SECRET is set"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Run migrations
echo "🗄️ Running database migrations..."
if ! npm run migrate; then
    echo ""
    echo "❌ Migration failed!"
    echo "💡 It looks like the database might not exist on your VPS."
    DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///' | sed 's/?.*//')
    echo "🚀 Run this command on your VPS to create it:"
    echo "   cd /tmp && sudo -u postgres createdb $DB_NAME"
    echo ""
    exit 1
fi

# Seed Admin User
echo "👤 Seeding admin user..."
npm run seed:admin || echo "⚠️  Seeding failed (possibly already seeded)"

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
mkdir -p ../backend/public
rm -rf ../backend/public/*
cp -r dist/* ../backend/public/

cd ..

# Start with PM2 or Docker
echo "🚀 Starting application..."

if command -v pm2 &> /dev/null; then
    echo "Using PM2..."
    cd backend
    pm2 delete thecross 2>/dev/null || true
    NODE_ENV=production pm2 start dist/index.js --name thecross
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