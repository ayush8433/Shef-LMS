#!/bin/bash

# Frontend Deployment Script for learnwithshef.com
# This script deploys the React frontend to Vercel

set -e

echo "🚀 SHEF LMS - Frontend Deployment Script"
echo "=========================================="
echo ""

# Check if in correct directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to frontend
cd frontend

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: .env.production not found!"
    echo "Creating template from .env.example..."
    cp .env.example .env.production
    echo ""
    echo "❗ IMPORTANT: Please edit frontend/.env.production with your Firebase credentials"
    echo "Then run this script again."
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run build test
echo "🔨 Testing production build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo ""
echo "🚀 Deploying to Vercel..."
echo "You will be prompted to login if not already authenticated."
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Add custom domain: learnwithshef.com"
echo "3. Configure DNS records as shown in Vercel"
echo "4. Wait for SSL certificate provisioning (1-2 minutes)"
echo ""
echo "🎉 Your LMS will be live at https://learnwithshef.com"
