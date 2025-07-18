#!/bin/bash

echo "🚀 Setting up Multi-Agent Observability Dashboard..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd apps/client
npm install
cd ../..

# Install server dependencies with Bun
echo "📦 Installing server dependencies..."
cd apps/server
bun install
cd ../..

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "🌐 Then open http://localhost:5173 in your browser"
echo "🏗️ Look for the enhanced dashboard toggle button"