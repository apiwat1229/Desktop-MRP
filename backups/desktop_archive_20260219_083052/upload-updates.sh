#!/bin/bash

# Upload Desktop App Updates to Server
# Usage: ./scripts/upload-updates.sh [version]
#
# This script uploads built desktop app installers to the update server
# for Windows, macOS, and Linux platforms.

set -e  # Exit on error

# Configuration
SERVER="admin@app.ytrc.co.th"
UPDATE_DIR="/var/www/ytrc-updates"

# If the desktop app is not present, exit cleanly (repo is backend-only)
if [ ! -d "apps/desktop" ]; then
  echo "apps/desktop not found — desktop app removed. Skipping upload-updates."
  exit 0
fi

VERSION=${1:-$(node -p "require('./apps/desktop/package.json').version")}
RELEASE_DIR="apps/desktop/release/${VERSION}"

echo "========================================="
echo "Uploading Desktop App Updates"
echo "========================================="
echo "Version: ${VERSION}"
echo "Server: ${SERVER}"
echo "Update Directory: ${UPDATE_DIR}"
echo "========================================="

# Check if release directory exists
if [ ! -d "${RELEASE_DIR}" ]; then
  echo "❌ Error: Release directory not found: ${RELEASE_DIR}"
  echo "Please build the app first using:"
  echo "  npm run build:win --workspace=apps/desktop"
  echo "  npm run build:mac --workspace=apps/desktop"
  echo "  npm run build:linux --workspace=apps/desktop"
  exit 1
fi

# Upload Windows installer
if [ -f "${RELEASE_DIR}/YTRC-Desktop-Windows-${VERSION}-Setup.exe" ]; then
  echo "📦 Uploading Windows installer..."
  scp "${RELEASE_DIR}/YTRC-Desktop-Windows-${VERSION}-Setup.exe" "${SERVER}:${UPDATE_DIR}/"
  scp "${RELEASE_DIR}/latest.yml" "${SERVER}:${UPDATE_DIR}/"
  echo "✅ Windows installer uploaded"
else
  echo "⚠️  Windows installer not found, skipping..."
fi

# Upload macOS installer
if [ -f "${RELEASE_DIR}/YTRC-Desktop-Mac-${VERSION}-Installer.dmg" ]; then
  echo "📦 Uploading macOS installer..."
  scp "${RELEASE_DIR}/YTRC-Desktop-Mac-${VERSION}-Installer.dmg" "${SERVER}:${UPDATE_DIR}/"
  scp "${RELEASE_DIR}/latest-mac.yml" "${SERVER}:${UPDATE_DIR}/"
  echo "✅ macOS installer uploaded"
else
  echo "⚠️  macOS installer not found, skipping..."
fi

# Upload Linux AppImage
if [ -f "${RELEASE_DIR}/YTRC-Desktop-Linux-${VERSION}.AppImage" ]; then
  echo "📦 Uploading Linux AppImage..."
  scp "${RELEASE_DIR}/YTRC-Desktop-Linux-${VERSION}.AppImage" "${SERVER}:${UPDATE_DIR}/"
  scp "${RELEASE_DIR}/latest-linux.yml" "${SERVER}:${UPDATE_DIR}/"
  echo "✅ Linux AppImage uploaded"
else
  echo "⚠️  Linux AppImage not found, skipping..."
fi

# Set proper permissions on server
echo "🔒 Setting permissions on server..."
ssh "${SERVER}" "chmod 644 ${UPDATE_DIR}/* 2>/dev/null || true"

echo ""
echo "========================================="
echo "✅ Upload Complete!"
echo "========================================="
echo "Update URL: https://app.ytrc.co.th/updates/"
echo ""
echo "Verify uploads:"
echo "  curl -I https://app.ytrc.co.th/updates/latest.yml"
echo "  curl -I https://app.ytrc.co.th/updates/latest-linux.yml"
echo "  curl -I https://app.ytrc.co.th/updates/latest-mac.yml"
echo "========================================="
