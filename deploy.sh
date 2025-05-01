#!/bin/bash

# Exit on error
set -e

echo "🔄 Pulling latest code..."
git pull origin master

echo "📦 Installing dependencies..."
npm ci

echo "🗄️ Run Sequelize Migrations..."
npx sequelize-cli db:migrate

echo "🛠️ Building everything..."
npm run build:all

echo "🚀 Restarting services with PM2..."
sudo pm2 restart ecosystem.config.js

echo "✅ Deployment complete."
