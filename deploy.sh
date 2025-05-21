#!/bin/bash

# Exit on error
set -e

echo "🔄 Pulling latest code..."
git pull origin master

echo "📦 Installing dependencies..."
pnpm install

echo "🧹 Clean up environment..."
npm run clean

echo "🗄️ Run Sequelize Migrations..."
npx sequelize-cli db:migrate

echo "🛠️ Building everything..."
npm run build

echo "🚀 Restarting services with PM2..."
pm2 restart ecosystem.config.js

echo "✅ Deployment complete."
