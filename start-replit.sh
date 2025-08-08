#!/bin/bash

# Replit Startup Script for PostgreSQL Database
echo "🚀 Starting PBikeRescue Rails on Replit..."

# Check if this is production environment
if [ "$NODE_ENV" = "production" ]; then
    echo "📦 Production mode detected"
else
    echo "🔧 Setting NODE_ENV to production for Replit"
    export NODE_ENV=production
fi

# Verify PostgreSQL connection
echo "🔍 Verifying PostgreSQL connection..."
node scripts/verify-postgresql.js

if [ $? -ne 0 ]; then
    echo "❌ PostgreSQL verification failed. Please check your database configuration."
    exit 1
fi

echo "✅ PostgreSQL verification successful"

# Build the application
echo "🏗️  Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for compilation errors."
    exit 1
fi

echo "✅ Build completed successfully"

# Start the application
echo "🚀 Starting the application..."
exec npm run start:prod
