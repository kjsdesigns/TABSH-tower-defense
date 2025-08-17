const http = require('http');

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      console.log(`Testing ${url} - Status: ${res.statusCode}`);
      
      // Consume response data to free up memory
      res.resume();
      
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    }).on('error', (e) => {
      console.error(`Error accessing ${url}: ${e.message}`);
      resolve(false);
    });
  });
}

async function runTests() {
  console.log("Starting test verification...");
  
  // Check if test pages are accessible
  const waveTest = await checkUrl('http://localhost:3000/tests/wave-test.html');
  const barracksTest = await checkUrl('http://localhost:3000/tests/barracks-tower-test.html');
  
  // Check if core game files are accessible
  const mainJs = await checkUrl('http://localhost:3000/js/main.js');
  const waveManagerJs = await checkUrl('http://localhost:3000/js/waveManager.js');
  const level1Js = await checkUrl('http://localhost:3000/config/maps/level1.js');
  
  console.log("\nTest Summary:");
  console.log("- Wave Test Page: " + (waveTest ? "✅ Accessible" : "❌ Not accessible"));
  console.log("- Barracks Tower Test Page: " + (barracksTest ? "✅ Accessible" : "❌ Not accessible"));
  console.log("- Main JS: " + (mainJs ? "✅ Accessible" : "❌ Not accessible"));
  console.log("- Wave Manager JS: " + (waveManagerJs ? "✅ Accessible" : "❌ Not accessible"));
  console.log("- Level 1 Config: " + (level1Js ? "✅ Accessible" : "❌ Not accessible"));
  
  console.log("\nTo run the tests:");
  console.log("1. Open your browser to http://localhost:3000/tests/wave-test.html");
  console.log("2. Click the 'Run Full Test' button");
  console.log("3. Check the results section for test output");
  console.log("\nThen open http://localhost:3000/tests/barracks-tower-test.html");
  console.log("1. Click the 'Test Triangle Formation' button");
  console.log("2. Click the 'Test Path Placement' button");
  console.log("3. Click the 'Visualize Formation' button");
  console.log("\nFinally, open the actual game at http://localhost:3000 to verify the fixes live");
}

runTests();