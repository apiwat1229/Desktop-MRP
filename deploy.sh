#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/apiwat1229/Desktop-MRP"

echo "🚀 Deploying Desktop-MRP..."
cd "$PROJECT_DIR"

echo "📦 Building & starting Docker container..."
docker compose -p desktop-mrp up -d --build

echo "✅ Deploy complete!"
echo "   🌐 Portal: https://app.ytrc.co.th"
echo "   🧩 MRP:    https://app.ytrc.co.th/mrp/"
