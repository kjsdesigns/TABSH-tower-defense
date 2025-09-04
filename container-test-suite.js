#!/usr/bin/env node

/**
 * TABSH Container Test Suite
 * 
 * This test suite is designed to run INSIDE Docker containers
 * It tests the internal container environment and services
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Container environment - test internal port 3000
const INTERNAL_PORT = process.env.PORT || 3000;

console.log('🧪 TABSH Container Test Suite');
console.log('============================');
console.log(`Testing internal port: ${INTERNAL_PORT}`);
console.log('');

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, status, message = '') {
  const emoji = status === 'PASS' ? '✅' : '❌';
  const line = `${emoji} ${name}`;
  console.log(line + (message ? ` - ${message}` : ''));
  
  results.tests.push({ name, status, message });
  if (status === 'PASS') results.passed++;
  else results.failed++;
}

function logSection(title) {
  console.log(`\n📋 ${title}`);
  console.log('─'.repeat(title.length + 3));
}

async function checkPort(port, service) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 3000);
    
    socket.connect(port, 'localhost', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

async function httpGet(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? require('https') : require('http');
    
    const timeout = setTimeout(() => {
      resolve(null);
    }, 5000);
    
    protocol.get(url, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

function validateContainerEnvironment() {
  let allValid = true;
  
  // Check if we're in a container
  const isContainer = fs.existsSync('/.dockerenv') || 
                     process.env.DOCKER_CONTAINER === 'true';
  
  if (isContainer) {
    logTest('Running in container environment', 'PASS');
  } else {
    logTest('Running in container environment', 'FAIL', 'Not detected as container');
    allValid = false;
  }
  
  // Check working directory
  if (process.cwd() === '/app') {
    logTest('Container working directory', 'PASS');
  } else {
    logTest('Container working directory', 'FAIL', `Expected /app, got ${process.cwd()}`);
    allValid = false;
  }
  
  // Check if Node.js is available
  try {
    const nodeVersion = process.version;
    logTest('Node.js available', 'PASS', nodeVersion);
  } catch (error) {
    logTest('Node.js available', 'FAIL', 'Node.js not found');
    allValid = false;
  }
  
  return allValid;
}

function validateProjectFiles() {
  const requiredFiles = [
    'server.js',
    'package.json',
    'index.html'
  ];
  
  let allValid = true;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      logTest(`File accessible: ${file}`, 'PASS');
    } else {
      logTest(`File accessible: ${file}`, 'FAIL', 'File not found');
      allValid = false;
    }
  }
  
  return allValid;
}

async function runTests() {
  // 1. Container Environment
  logSection('Container Environment');
  validateContainerEnvironment();
  
  // 2. File Access
  logSection('File System Access');
  validateProjectFiles();
  
  // 3. Internal Port Check
  logSection('Internal Service Check');
  
  const internalPortOpen = await checkPort(INTERNAL_PORT, 'Internal');
  if (internalPortOpen) {
    logTest(`Internal port ${INTERNAL_PORT} accessible`, 'PASS');
    
    // Test HTTP endpoints on internal port
    logSection('Internal HTTP Endpoints');
    
    const mainPageResponse = await httpGet(`http://localhost:${INTERNAL_PORT}`);
    if (mainPageResponse && mainPageResponse.status === 200) {
      logTest('Internal service - main page', 'PASS');
    } else {
      logTest('Internal service - main page', 'FAIL', 'HTTP request failed');
    }
    
    const apiResponse = await httpGet(`http://localhost:${INTERNAL_PORT}/api/listFiles?dir=config`);
    if (apiResponse && apiResponse.status === 200) {
      logTest('Internal API - listFiles', 'PASS');
    } else {
      logTest('Internal API - listFiles', 'FAIL', 'API request failed');
    }
  } else {
    logTest(`Internal port ${INTERNAL_PORT} accessible`, 'FAIL', 'Port not accessible');
  }
  
  // 4. Configuration Access
  logSection('Configuration File Access');
  
  const configDirs = ['config/maps', 'config/towers', 'config/enemies', 'config/heroes'];
  for (const dir of configDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
      if (files.length > 0) {
        logTest(`Config directory: ${dir}`, 'PASS', `${files.length} files`);
      } else {
        logTest(`Config directory: ${dir}`, 'FAIL', 'No .js files found');
      }
    } else {
      logTest(`Config directory: ${dir}`, 'FAIL', 'Directory not found');
    }
  }
  
  // Final Results
  logSection('Container Test Results Summary');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(test => test.status === 'FAIL')
      .forEach(test => console.log(`  - ${test.name}: ${test.message}`));
    
    console.log('\n🔧 Fix the failing tests and run again.');
    process.exit(1);
  } else {
    console.log('\n🏁 All container tests passed! 🎉');
    console.log('The TABSH application is working correctly inside the container.');
    process.exit(0);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
TABSH Container Test Suite

Usage: npm run test:container

This script validates the TABSH application inside Docker containers.

Tests include:
  - Container environment validation
  - File system access
  - Internal service accessibility
  - API endpoint validation
  - Configuration file access
`);
  process.exit(0);
}

// Run the container test suite
runTests().catch(error => {
  console.error('Container test suite failed:', error);
  process.exit(1);
});