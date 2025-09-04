#!/usr/bin/env node

/**
 * TABSH Docker Test Suite Runner
 * 
 * This script runs the complete test suite using docker-compose
 * It orchestrates tests across all services from the host machine
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Docker environment detection - this should run from host
function isRunningInDocker() {
  const dockerIndicators = [
    () => fs.existsSync('/.dockerenv'),
    () => {
      try {
        const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
        return cgroup.includes('docker') || cgroup.includes('containerd');
      } catch {
        return false;
      }
    },
    () => process.env.DOCKER_CONTAINER === 'true'
  ];

  return dockerIndicators.some(check => check());
}

function runCommand(command, options = {}) {
  console.log(`\n🔄 Running: ${command}`);
  try {
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options
    });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    return false;
  }
}

async function runDockerTestSuite() {
  if (isRunningInDocker()) {
    console.error(`
❌ This script should run from the HOST machine, not inside Docker.
Run this script from your local terminal with: npm run test:docker
`);
    process.exit(1);
  }

  console.log(`
🧪 TABSH DOCKER Test Suite
═══════════════════════════
Running complete test suite via Docker orchestration.
`);

  let totalTests = 0;
  let passedTests = 0;
  let failedSuites = [];

  // Ensure services are running
  console.log(`\n📋 0. Service Health Check`);
  console.log(`─────────────────────────`);
  if (runCommand('docker-compose ps')) {
    console.log(`✅ Docker services are running`);
  } else {
    console.log(`❌ Docker services not running - starting them...`);
    if (!runCommand('docker-compose up -d')) {
      console.error('Failed to start Docker services');
      process.exit(1);
    }
    // Wait for services to be ready
    console.log('Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // 1. Infrastructure Tests (from host)
  console.log(`\n📋 1. Infrastructure & Service Health Tests`);
  console.log(`────────────────────────────────────────────`);
  if (runCommand('npm run test:infrastructure')) {
    console.log(`✅ Infrastructure tests passed`);
    passedTests++;
  } else {
    console.log(`❌ Infrastructure tests failed`);
    failedSuites.push('Infrastructure');
  }
  totalTests++;

  // 2. Web Service Container Tests
  console.log(`\n📋 2. Web Service Container Tests`);
  console.log(`─────────────────────────────────`);
  if (runCommand('docker-compose exec -T web npm run test:container')) {
    console.log(`✅ Web service container tests passed`);
    passedTests++;
  } else {
    console.log(`❌ Web service container tests failed`);
    failedSuites.push('Web Service Container');
  }
  totalTests++;

  // 3. API Service Container Tests
  console.log(`\n📋 3. API Service Container Tests`);
  console.log(`─────────────────────────────────`);
  if (runCommand('docker-compose exec -T api npm run test:container')) {
    console.log(`✅ API service container tests passed`);
    passedTests++;
  } else {
    console.log(`❌ API service container tests failed`);
    failedSuites.push('API Service Container');
  }
  totalTests++;

  // 4. Docker Integration Tests
  console.log(`\n📋 4. Docker Integration Tests`);
  console.log(`──────────────────────────────`);
  if (runCommand('npm run test:integration:docker')) {
    console.log(`✅ Docker integration tests passed`);
    passedTests++;
  } else {
    console.log(`❌ Docker integration tests failed`);
    failedSuites.push('Docker Integration');
  }
  totalTests++;

  // Test Summary
  console.log(`\n📋 Docker Test Suite Summary`);
  console.log(`════════════════════════════`);
  console.log(`Total Test Suites: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedSuites.length > 0) {
    console.log(`\n❌ Failed Test Suites:`);
    failedSuites.forEach(suite => console.log(`  - ${suite}`));
    console.log(`\n🔧 Fix the failing tests and run again.`);
    process.exit(1);
  } else {
    console.log(`\n🏁 All test suites passed! 🎉`);
    console.log(`The application is ready and all working tests are passing.`);
    
    console.log(`\n🏆 COMPLETE TEST SUITE SUCCESS!`);
    console.log(`All critical test categories are now passing:`);
    console.log(`✅ Infrastructure & Service Health`);
    console.log(`✅ Web Service Container Tests`);
    console.log(`✅ API Service Container Tests`);
    console.log(`✅ Docker Integration Tests`);
    console.log(`\n🚀 Ready for deployment!`);
    
    process.exit(0);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Docker Test Suite for TABSH

Usage: npm run test:docker

This script runs all working tests via Docker orchestration.

Requirements:
  - Must run from host machine (not inside Docker)
  - Docker services should be running (docker-compose up)

Commands:
  npm run test:docker           # Run this comprehensive suite
  npm run test:infrastructure   # Infrastructure tests only
  npm run test                  # Full suite
`);
  process.exit(0);
}

// Run the Docker test suite
runDockerTestSuite().catch(error => {
  console.error('Docker test suite failed:', error);
  process.exit(1);
});