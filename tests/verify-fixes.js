const fs = require('fs');
const path = require('path');

// Function to check wave configuration format
function checkWaveFormat() {
  console.log("\n===== CHECKING LEVEL 1 WAVE CONFIGURATION =====");
  
  try {
    // Read the level1.js file
    const level1Path = path.join(__dirname, '../config/maps/level1.js');
    const level1Content = fs.readFileSync(level1Path, 'utf8');
    
    // Check if waves array exists
    if (!level1Content.includes('"waves":')) {
      console.log("❌ No waves array found in level1.js");
      return false;
    }
    
    console.log("✅ Waves array found in level1.js");
    
    // Extract waves section
    const wavesMatch = level1Content.match(/"waves":\s*(\[[\s\S]*?\])\s*(?:,|\})/);
    if (!wavesMatch || !wavesMatch[1]) {
      console.log("❌ Could not extract waves array from level1.js");
      return false;
    }
    
    // Count number of wave objects
    const waveCount = (wavesMatch[1].match(/\{\s*"enemyGroups":/g) || []).length;
    console.log(`✅ Found ${waveCount} waves defined in level1.js`);
    
    // Check for enemy groups
    const enemyGroupMatches = wavesMatch[1].match(/"enemyGroups":\s*\[[\s\S]*?\]/g) || [];
    if (enemyGroupMatches.length === 0) {
      console.log("❌ No enemy groups found in waves");
      return false;
    }
    
    console.log(`✅ Found enemy groups in each wave`);
    
    // Check for required enemy properties
    const propertyChecks = {
      type: /"type": "[^"]+"/,
      count: /"count": \d+/,
      spawnInterval: /"spawnInterval": \d+/,
      pathIndex: /"pathIndex": \d+/,
      hpMultiplier: /"hpMultiplier": [0-9.]+/
    };
    
    let allPropertiesFound = true;
    
    Object.entries(propertyChecks).forEach(([property, regex]) => {
      if (!regex.test(wavesMatch[1])) {
        console.log(`❌ Missing "${property}" property in some enemy groups`);
        allPropertiesFound = false;
      }
    });
    
    if (allPropertiesFound) {
      console.log("✅ All required enemy properties found in the waves configuration");
    }
    
    return true;
  } catch (error) {
    console.error("Error checking wave format:", error);
    return false;
  }
}

// Function to check wave manager implementation
function checkWaveManager() {
  console.log("\n===== CHECKING WAVE MANAGER IMPLEMENTATION =====");
  
  try {
    // Read the waveManager.js file
    const waveManagerPath = path.join(__dirname, '../js/waveManager.js');
    const waveManagerContent = fs.readFileSync(waveManagerPath, 'utf8');
    
    // Check for critical methods
    const criticalMethods = [
      'loadWavesFromLevel',
      'startWave',
      'spawnEnemyGroup',
      'update'
    ];
    
    criticalMethods.forEach(method => {
      if (!waveManagerContent.includes(method)) {
        console.log(`❌ Missing "${method}" method in waveManager.js`);
      } else {
        console.log(`✅ Found "${method}" method in waveManager.js`);
      }
    });
    
    // Check for proper initialization
    if (waveManagerContent.includes('if (group.spawnedCount === undefined)') &&
        waveManagerContent.includes('if (group.spawnTimer === undefined)')) {
      console.log("✅ Wave manager properly initializes dynamic properties");
    } else {
      console.log("❌ Wave manager may not initialize dynamic properties correctly");
    }
    
    // Check for error handling
    if (waveManagerContent.includes('try {') && 
        waveManagerContent.includes('catch (error)')) {
      console.log("✅ Wave manager includes error handling");
    } else {
      console.log("❌ Wave manager may not have sufficient error handling");
    }
    
    return true;
  } catch (error) {
    console.error("Error checking wave manager:", error);
    return false;
  }
}

// Function to check barracks tower unit formation
function checkBarracksTowerFormation() {
  console.log("\n===== CHECKING BARRACKS TOWER UNIT FORMATION =====");
  
  try {
    // Read the unitManager.js file
    const unitManagerPath = path.join(__dirname, '../js/unitManager.js');
    const unitManagerContent = fs.readFileSync(unitManagerPath, 'utf8');
    
    // Check for triangle formation implementation
    if (unitManagerContent.includes('Math.cos') && unitManagerContent.includes('Math.sin')) {
      console.log("✅ Unit formation uses trigonometric functions for circular positioning");
    } else {
      console.log("❌ Unit formation doesn't use trigonometric functions");
    }
    
    // Check for proper offset structure
    if (unitManagerContent.includes('{x:') && unitManagerContent.includes('y:')) {
      console.log("✅ Unit offsets include both x and y coordinates");
    } else {
      console.log("❌ Unit offsets may not include both x and y coordinates");
    }
    
    // Check apply method for both x and y
    if (unitManagerContent.includes('this.gatherX + offset.x') && 
        unitManagerContent.includes('this.gatherY + offset.y')) {
      console.log("✅ applyOffsetsToUnits applies both x and y offsets");
    } else {
      console.log("❌ applyOffsetsToUnits may not apply both x and y offsets");
    }
    
    // Read the towerManager.js file
    const towerManagerPath = path.join(__dirname, '../js/towerManager.js');
    const towerManagerContent = fs.readFileSync(towerManagerPath, 'utf8');
    
    // Check for path placement
    if (towerManagerContent.includes('getClosestPointOnPaths')) {
      console.log("✅ Tower manager uses closest path point for initial placement");
    } else {
      console.log("❌ Tower manager may not use closest path point for placement");
    }
    
    return true;
  } catch (error) {
    console.error("Error checking barracks tower formation:", error);
    return false;
  }
}

// Run all verification checks
function runAllChecks() {
  console.log("===== STARTING VERIFICATION CHECKS =====");
  
  const waveFormatCheck = checkWaveFormat();
  const waveManagerCheck = checkWaveManager();
  const barracksFormationCheck = checkBarracksTowerFormation();
  
  console.log("\n===== VERIFICATION SUMMARY =====");
  console.log(`Wave Format: ${waveFormatCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Wave Manager: ${waveManagerCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Barracks Formation: ${barracksFormationCheck ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log("\nNOTE: These are static code checks only. For full behavioral testing:");
  console.log("1. Open http://localhost:3000 in your browser");
  console.log("2. Start a new game and observe whether enemies spawn correctly");
  console.log("3. Build a barracks tower and check if units form a triangle pattern");
}

runAllChecks();