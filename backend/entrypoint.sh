#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting application..."

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "✅ Starting NestJS application..."
exec "$@"
