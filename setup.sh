#!/bin/bash

# Quick setup script for development

set -e

echo "🚀 Setting up The Cross Fellowship development environment..."

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your Telegram bot token!"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your Telegram bot token"
echo "2. Set up PostgreSQL database"
echo "3. Run migrations: cd backend && npm run migrate"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
echo "Or use Docker:"
echo "1. Edit .env file with your Telegram bot token"
echo "2. Run: docker-compose up -d"