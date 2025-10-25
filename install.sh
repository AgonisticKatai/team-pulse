#!/bin/bash

# TeamPulse - Installation Script
# Run this script in your project root: ~/AgonisticKatai/team-pulse

echo "🚀 TeamPulse - Setup Installation"
echo "=================================="
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
else
    echo "✅ pnpm is already installed"
fi

echo ""
echo "📥 Installing dependencies..."
pnpm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎯 Next steps:"
echo "  1. Start development servers: pnpm dev"
echo "  2. Frontend will be at: http://localhost:5173"
echo "  3. API will be at: http://localhost:3000"
echo ""
echo "📝 To test the API:"
echo "  curl http://localhost:3000/api/health"
echo ""
