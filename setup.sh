#!/bin/bash

# Infoblox UDDI IPAM MCP Server Setup Script
# This script sets up the MCP server with clean dependencies

set -e

echo "🚀 Setting up Infoblox UDDI IPAM MCP Server..."

# Clean up any existing node_modules and package-lock.json
if [ -d "node_modules" ]; then
    echo "🧹 Cleaning existing node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "🧹 Cleaning existing package-lock.json..."
    rm -f package-lock.json
fi

# Check Node.js version
node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 16 ]; then
    echo "❌ Error: Node.js 16 or higher is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for vulnerabilities
echo "🔍 Checking for security vulnerabilities..."
npm audit --audit-level=high

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your INFOBLOX_API_KEY"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your INFOBLOX_API_KEY"
echo "2. Run 'npm start' to start the MCP server"
echo "3. Configure your MCP client to use this server"
echo ""
echo "For more information, see README.md"
