#!/bin/bash
# Development server startup script

echo "🚀 Starting TABSH Development Server..."

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No existing process on port 3000"

# Start the server
echo "📡 Starting server on http://localhost:3000"
npm start

echo "🛑 Server stopped"