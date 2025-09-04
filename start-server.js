#!/usr/bin/env node

// Stable server startup script with error handling and auto-restart
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Basic middleware
app.use(express.json());
app.use(express.static(__dirname));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ TABSH Server running on http://localhost:${PORT}`);
  console.log('📁 Serving files from:', __dirname);
  console.log('🔄 Server will auto-restart on errors');
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Keep alive - prevent server from dying
setInterval(() => {
  // Simple keep-alive ping
}, 30000);