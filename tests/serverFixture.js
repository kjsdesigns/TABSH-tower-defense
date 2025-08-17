// @ts-check
const { test: base } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');
const waitPort = require('wait-port');

// Create a custom test fixture with server management
exports.test = base.extend({
  // Server fixture
  server: [async ({}, use) => {
    console.log("Starting server process...");
    
    let serverProcess = null;
    try {
      // Check if server is already running
      try {
        await waitPort({ host: 'localhost', port: 3000, timeout: 1000 });
        console.log("Server already running on port 3000, skipping server start");
      } catch (e) {
        // If waitPort times out, server is not running
        console.log("Starting new server instance...");
        
        // Start the server
        const serverPath = path.resolve(__dirname, '../server.js');
        serverProcess = spawn('node', [serverPath], {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false
        });
        
        // Log server output for debugging
        serverProcess.stdout.on('data', (data) => {
          console.log(`Server stdout: ${data}`);
        });
        
        serverProcess.stderr.on('data', (data) => {
          console.error(`Server stderr: ${data}`);
        });
        
        // Wait for server to start
        try {
          await waitPort({ host: 'localhost', port: 3000, timeout: 10000 });
          console.log("Server started successfully");
        } catch (timeout) {
          console.error("Server failed to start: timeout waiting for port 3000");
          throw new Error("Server failed to start within timeout period");
        }
      }
      
      // Make the server available to the test
      await use({}); 
    } finally {
      // Clean up server if we started it
      if (serverProcess) {
        console.log("Stopping server...");
        if (process.platform === 'win32') {
          // Windows needs special handling
          spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
        } else {
          // Other platforms can just kill process group
          process.kill(-serverProcess.pid, 'SIGINT');
        }
      }
    }
  }, { scope: 'worker' }]
});