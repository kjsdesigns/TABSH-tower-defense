const { execSync } = require('child_process');

// Helper function to run a single test with proper error handling
function runTest(testPath) {
  console.log(`\n\n===== RUNNING TEST: ${testPath} =====\n`);
  
  try {
    const output = execSync(`npx playwright test ${testPath} --reporter=list`, { 
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    console.error(`Test failed: ${testPath}`);
    return false;
  }
}

// Main function to run all tests in sequence
async function runAllTests() {
  console.log("===== STARTING TEST SEQUENCE =====");
  
  // Define tests in order of dependency
  const tests = [
    'tests/level1-waves.spec.js',
    'tests/barracks-tower-formation.spec.js',
    'tests/combined-features.spec.js'
  ];
  
  // Run each test in sequence
  let passCount = 0;
  let failCount = 0;
  
  for (const test of tests) {
    const passed = runTest(test);
    if (passed) {
      passCount++;
    } else {
      failCount++;
    }
  }
  
  // Print summary
  console.log("\n\n===== TEST SUMMARY =====");
  console.log(`Total tests: ${tests.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
}

// Run the tests
runAllTests().catch(err => {
  console.error("Error running tests:", err);
  process.exit(1);
});