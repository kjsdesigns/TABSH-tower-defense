#!/usr/bin/env node

/**
 * TABSH Comprehensive Test Suite
 * 
 * This test suite validates:
 * - Service health checks
 * - Port accessibility 
 * - API endpoint validation
 * - Frontend accessibility
 * - Environment configuration
 * - File system access
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment configuration
function loadEnvConfig() {
  const envConfig = {};
  
  // Load .env file
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
      if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        envConfig[key.trim()] = value.trim();
      }
    });
  }
  
  return envConfig;
}

const envConfig = loadEnvConfig();
const WEB_PORT = envConfig.WEB_PORT || 4444;
const API_PORT = envConfig.API_PORT || 4445;

console.log('🧪 TABSH Test Suite');
console.log('==================');
console.log(`Web Port: ${WEB_PORT}`);
console.log(`API Port: ${API_PORT}`);
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

function validatePackageJson() {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredFields = ['name', 'version', 'scripts'];
    
    for (const field of requiredFields) {
      if (!pkg[field]) {
        logTest(`package.json - ${field}`, 'FAIL', `Missing ${field}`);
        return false;
      }
    }
    
    if (!pkg.scripts.start) {
      logTest(`package.json - start script`, 'FAIL', 'Missing start script');
      return false;
    }
    
    logTest('package.json validation', 'PASS');
    return true;
  } catch (error) {
    logTest('package.json validation', 'FAIL', error.message);
    return false;
  }
}

function validateProjectStructure() {
  const requiredFiles = [
    'server.js',
    'package.json',
    'index.html',
    'js/main.js',
    'css/style.css',
    'Dockerfile',
    'docker-compose.yml',
    '.env.example'
  ];
  
  const requiredDirs = [
    'js',
    'css',
    'assets',
    'config'
  ];
  
  let allValid = true;
  
  // Check files
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      logTest(`File exists: ${file}`, 'PASS');
    } else {
      logTest(`File exists: ${file}`, 'FAIL', 'File missing');
      allValid = false;
    }
  }
  
  // Check directories
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      logTest(`Directory exists: ${dir}`, 'PASS');
    } else {
      logTest(`Directory exists: ${dir}`, 'FAIL', 'Directory missing');
      allValid = false;
    }
  }
  
  return allValid;
}

function validateEnvironmentConfig() {
  let allValid = true;
  
  // Check .env.example exists
  if (fs.existsSync('.env.example')) {
    logTest('.env.example exists', 'PASS');
  } else {
    logTest('.env.example exists', 'FAIL', 'Template file missing');
    allValid = false;
  }
  
  // Check .env exists
  if (fs.existsSync('.env')) {
    logTest('.env exists', 'PASS');
    
    // Validate required environment variables
    const requiredVars = ['WEB_PORT', 'API_PORT', 'NODE_ENV'];
    for (const envVar of requiredVars) {
      if (envConfig[envVar]) {
        logTest(`Environment variable: ${envVar}`, 'PASS');
      } else {
        logTest(`Environment variable: ${envVar}`, 'FAIL', 'Missing required variable');
        allValid = false;
      }
    }
  } else {
    logTest('.env exists', 'FAIL', 'Environment file missing');
    allValid = false;
  }
  
  return allValid;
}

function validateDockerConfig() {
  let allValid = true;
  
  // Check Dockerfile
  if (fs.existsSync('Dockerfile')) {
    logTest('Dockerfile exists', 'PASS');
    
    const dockerfileContent = fs.readFileSync('Dockerfile', 'utf8');
    if (dockerfileContent.includes('FROM node')) {
      logTest('Dockerfile - Node.js base image', 'PASS');
    } else {
      logTest('Dockerfile - Node.js base image', 'FAIL', 'Not using Node.js base');
      allValid = false;
    }
  } else {
    logTest('Dockerfile exists', 'FAIL', 'Dockerfile missing');
    allValid = false;
  }
  
  // Check docker-compose.yml
  if (fs.existsSync('docker-compose.yml')) {
    logTest('docker-compose.yml exists', 'PASS');
  } else {
    logTest('docker-compose.yml exists', 'FAIL', 'docker-compose.yml missing');
    allValid = false;
  }
  
  return allValid;
}

async function runTests() {
  // 1. Project Structure
  logSection('Project Structure');
  validateProjectStructure();
  
  // 2. Package Validation
  logSection('Package Configuration');
  validatePackageJson();
  
  // 3. Environment Configuration
  logSection('Environment Configuration');
  validateEnvironmentConfig();
  
  // 4. Docker Configuration
  logSection('Docker Configuration');
  validateDockerConfig();
  
  // 5. Port Availability Tests
  logSection('Port Availability');
  
  const webPortOpen = await checkPort(WEB_PORT, 'Web');
  if (webPortOpen) {
    logTest(`Web port ${WEB_PORT} accessible`, 'PASS');
  } else {
    logTest(`Web port ${WEB_PORT} accessible`, 'FAIL', 'Port not accessible');
  }
  
  const apiPortOpen = await checkPort(API_PORT, 'API');
  if (apiPortOpen) {
    logTest(`API port ${API_PORT} accessible`, 'PASS');
  } else {
    logTest(`API port ${API_PORT} accessible`, 'FAIL', 'Port not accessible');
  }
  
  // 6. HTTP Endpoint Tests (if services are running)
  if (webPortOpen || apiPortOpen) {
    logSection('HTTP Endpoint Tests');
    
    // Test main page (if web port is accessible)
    if (webPortOpen) {
      const webResponse = await httpGet(`http://localhost:${WEB_PORT}`);
      if (webResponse && webResponse.status === 200) {
        logTest('Web service - main page', 'PASS');
      } else {
        logTest('Web service - main page', 'FAIL', 'HTTP request failed');
      }
    }
    
    // Test API endpoints (if any port is accessible)
    const testPort = webPortOpen ? WEB_PORT : API_PORT;
    const apiResponse = await httpGet(`http://localhost:${testPort}/api/listFiles?dir=config`);
    if (apiResponse && apiResponse.status === 200) {
      logTest('API endpoint - listFiles', 'PASS');
    } else {
      logTest('API endpoint - listFiles', 'FAIL', 'API request failed');
    }
  }
  
  // 7. Configuration File Access Tests
  logSection('Configuration File Tests');
  
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
  logSection('Test Results Summary');
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
    console.log('\n🏁 All tests passed! 🎉');
    console.log('The TABSH application is properly configured and ready for development.');
    process.exit(0);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
TABSH Test Suite

Usage: npm test

This script validates the TABSH application configuration and services.

Tests include:
  - Project structure validation
  - Package configuration
  - Environment setup
  - Docker configuration
  - Service accessibility
  - API endpoint validation
  - Configuration file access
`);
  process.exit(0);
}

// Run the test suite
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});