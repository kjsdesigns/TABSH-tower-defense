// This is a browser test script - run it in the browser console

// Helper function to log with timestamp
function logWithTime(msg, data) {
  const now = new Date();
  const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
  console.log(`[${timeStr}] ${msg}`, data);
}

// Comprehensive Level 1 Wave Test
function testLevel1Waves() {
  logWithTime("Starting Level 1 Wave Test");
  
  // 1. Check game initialization
  if (!window.game) {
    console.error("ERROR: window.game is not defined!");
    return;
  }
  
  logWithTime("Game object exists", { game: !!window.game });
  
  // 2. Check level data
  const levelData = window.game.levelData;
  if (!levelData) {
    console.error("ERROR: game.levelData is not defined!");
    return;
  }
  
  logWithTime("Level data", {
    levelName: levelData.levelName,
    hasWaves: !!levelData.waves,
    waveCount: levelData.waves ? levelData.waves.length : 0,
    pathCount: levelData.paths ? levelData.paths.length : 0
  });
  
  // 3. Check wave manager
  const waveManager = window.game.waveManager;
  if (!waveManager) {
    console.error("ERROR: game.waveManager is not defined!");
    return;
  }
  
  logWithTime("Wave manager state", {
    waves: waveManager.waves.length,
    waveIndex: waveManager.waveIndex,
    waveActive: waveManager.waveActive,
    timeUntilNextWave: waveManager.timeUntilNextWave
  });
  
  // 4. Check if waves were properly loaded
  if (!waveManager.waves || waveManager.waves.length === 0) {
    console.error("ERROR: No waves loaded in wave manager!");
    
    // Check level data waves
    if (levelData.waves && levelData.waves.length > 0) {
      logWithTime("Level data has waves but they weren't loaded into wave manager", levelData.waves);
    } else {
      logWithTime("Level data has no waves defined", levelData);
    }
    
    return;
  }
  
  // 5. Validate wave structures
  let hasValidWaves = true;
  waveManager.waves.forEach((wave, index) => {
    if (!wave.enemyGroups || !Array.isArray(wave.enemyGroups) || wave.enemyGroups.length === 0) {
      console.error(`ERROR: Wave ${index} has invalid or empty enemyGroups!`);
      hasValidWaves = false;
    }
  });
  
  if (!hasValidWaves) {
    logWithTime("Waves have structural issues", waveManager.waves);
    return;
  }
  
  // 6. Check enemy manager
  const enemyManager = window.game.enemyManager;
  if (!enemyManager) {
    console.error("ERROR: game.enemyManager is not defined!");
    return;
  }
  
  const availableEnemyTypes = Object.keys(enemyManager.enemyBaseData || {});
  logWithTime("Available enemy types", availableEnemyTypes);
  
  // 7. Validate enemy types in waves
  waveManager.waves.forEach((wave, waveIndex) => {
    wave.enemyGroups.forEach((group, groupIndex) => {
      if (!group.type) {
        console.error(`ERROR: Wave ${waveIndex}, group ${groupIndex} has no type!`);
      } else if (!availableEnemyTypes.includes(group.type)) {
        console.error(`ERROR: Wave ${waveIndex}, group ${groupIndex} uses invalid enemy type: ${group.type}`);
      }
    });
  });
  
  // 8. Check paths
  const paths = window.game.paths;
  if (!paths || !Array.isArray(paths) || paths.length === 0) {
    console.error("ERROR: No valid paths defined!");
    return;
  }
  
  logWithTime("Path info", {
    pathCount: paths.length,
    samplePath: paths[0].length
  });
  
  // 9. Test game state
  logWithTime("Game state", {
    gameStarted: window.game.gameStarted,
    paused: window.game.paused,
    gameOver: window.game.gameOver
  });
  
  // 10. Attempt to start game if not started
  if (!window.game.gameStarted) {
    logWithTime("Starting game");
    // Find and click the start button if it exists
    const startButton = document.getElementById('gameControlButton');
    if (startButton) {
      startButton.click();
      logWithTime("Clicked start button");
    } else {
      // Otherwise set gameStarted directly
      window.game.gameStarted = true;
      logWithTime("Set game.gameStarted = true directly");
    }
  }
  
  // 11. Monitor enemy spawning
  logWithTime("Current enemies", window.game.enemies.length);
  
  // Set up monitoring
  const monitorID = setInterval(() => {
    logWithTime("Monitoring", {
      gameStarted: window.game.gameStarted,
      waveActive: window.game.waveManager.waveActive,
      waveIndex: window.game.waveManager.waveIndex,
      timeUntilNextWave: window.game.waveManager.timeUntilNextWave,
      enemyCount: window.game.enemies.length
    });
    
    // If we have enemies, show details about them
    if (window.game.enemies.length > 0) {
      logWithTime("Enemy details", window.game.enemies.map(e => ({
        type: e.name,
        hp: e.hp,
        position: { x: Math.round(e.x), y: Math.round(e.y) },
        path: e.path ? e.path.length : 'no path',
        waypointIndex: e.waypointIndex
      })));
    }
  }, 2000);
  
  // Stop monitoring after 30 seconds
  setTimeout(() => {
    clearInterval(monitorID);
    logWithTime("Monitoring complete");
    
    // Final check
    const enemyCount = window.game.enemies.length;
    if (enemyCount === 0 && window.game.gameStarted && !window.game.paused) {
      console.error("ERROR: No enemies spawned after 30 seconds!");
      
      // Try to force spawn an enemy
      try {
        window.game.enemyManager.spawnEnemy("drone", 1, 0);
        logWithTime("Manually spawned test enemy");
      } catch (err) {
        console.error("ERROR: Failed to manually spawn enemy:", err);
      }
    } else {
      logWithTime("Test completed successfully", { 
        enemiesSpawned: enemyCount,
        wavesCompleted: window.game.waveManager.waveIndex
      });
    }
  }, 30000);
  
  return "Test running - check console for results over the next 30 seconds";
}

// Run the test
testLevel1Waves();