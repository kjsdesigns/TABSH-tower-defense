/**
 * Debug Test Script for Level 1 Issues
 * 
 * This script contains instructions for testing and debugging Level 1 startup errors.
 * Follow these steps to identify potential issues.
 */

/**
 * TEST 1: Level 1 Startup Errors
 * 
 * Steps:
 * 1. Start the server: node server.js
 * 2. Open your browser's developer console (F12 or right-click > Inspect > Console)
 * 3. Navigate to http://localhost:3000
 * 4. Observe any errors in the console immediately
 * 5. Click the "Start" button
 * 6. Observe any new errors that appear
 * 
 * Record any errors you see for debugging.
 */

/**
 * TEST 2: Check Wave Manager State
 * 
 * Run this in the browser console to inspect the wave manager:
 * 
 * (() => {
 *   if (!window.game || !window.game.waveManager) {
 *     console.error("Game or wave manager not initialized");
 *     return;
 *   }
 *   
 *   console.log("WaveManager state:", {
 *     waves: window.game.waveManager.waves,
 *     waveIndex: window.game.waveManager.waveIndex,
 *     waveActive: window.game.waveManager.waveActive,
 *     timeUntilNextWave: window.game.waveManager.timeUntilNextWave
 *   });
 *   
 *   // Check if waves have the expected structure
 *   if (window.game.waveManager.waves.length === 0) {
 *     console.error("No waves defined!");
 *   } else {
 *     const firstWave = window.game.waveManager.waves[0];
 *     if (!firstWave.enemyGroups || !Array.isArray(firstWave.enemyGroups)) {
 *       console.error("Invalid wave structure - missing enemyGroups array");
 *     } else if (firstWave.enemyGroups.length === 0) {
 *       console.error("First wave has empty enemyGroups array");
 *     } else {
 *       console.log("First wave enemy group:", firstWave.enemyGroups[0]);
 *     }
 *   }
 * })();
 */

/**
 * TEST 3: Check Level Data Loading
 * 
 * Run this in the browser console:
 * 
 * (() => {
 *   // Check stored level choice
 *   console.log("Stored level:", localStorage.getItem("kr_chosenLevel"));
 *   
 *   // Check loaded level data
 *   if (!window.game || !window.game.levelData) {
 *     console.error("Game or level data not initialized");
 *     return;
 *   }
 *   
 *   console.log("Level data:", {
 *     name: window.game.levelData.levelName,
 *     hasWaves: !!window.game.levelData.waves,
 *     waveCount: window.game.levelData.waves ? window.game.levelData.waves.length : 0,
 *     paths: window.game.levelData.paths ? window.game.levelData.paths.length : 0
 *   });
 *   
 *   // Check if waves were properly transferred from level data to wave manager
 *   if (window.game.levelData.waves && window.game.waveManager.waves) {
 *     const levelWaveCount = window.game.levelData.waves.length;
 *     const managerWaveCount = window.game.waveManager.waves.length;
 *     
 *     if (levelWaveCount !== managerWaveCount) {
 *       console.error(`Wave count mismatch: ${levelWaveCount} in level data vs ${managerWaveCount} in wave manager`);
 *     } else {
 *       console.log("Wave counts match between level data and wave manager");
 *     }
 *   }
 * })();
 */

/**
 * TEST 4: Test Enemy Spawning
 * 
 * Run this in the browser console:
 * 
 * (() => {
 *   // Force spawn an enemy to test if spawn mechanism works
 *   if (!window.game || !window.game.enemyManager) {
 *     console.error("Game or enemy manager not initialized");
 *     return;
 *   }
 *   
 *   // Try to spawn a test enemy
 *   try {
 *     window.game.enemyManager.spawnEnemy("drone", 1, 0);
 *     console.log("Test enemy spawned, current enemies:", window.game.enemies);
 *   } catch (err) {
 *     console.error("Error spawning test enemy:", err);
 *     
 *     // Check paths
 *     console.log("Paths available:", window.game.levelData.paths);
 *     if (!window.game.levelData.paths || window.game.levelData.paths.length === 0) {
 *       console.error("No paths defined in level data!");
 *     } else if (!Array.isArray(window.game.levelData.paths[0])) {
 *       console.error("Invalid path structure - path[0] is not an array");
 *     }
 *     
 *     // Check enemy definitions
 *     console.log("Enemy types:", Object.keys(window.game.enemyManager.enemyBaseData));
 *   }
 * })();
 */

/**
 * TEST 5: Check Game State
 * 
 * Run this in the browser console:
 * 
 * (() => {
 *   if (!window.game) {
 *     console.error("Game not initialized");
 *     return;
 *   }
 *   
 *   console.log("Game state:", {
 *     gameStarted: window.game.gameStarted,
 *     paused: window.game.paused,
 *     gameOver: window.game.gameOver,
 *     gold: window.game.gold,
 *     lives: window.game.lives,
 *     gameSpeed: window.game.gameSpeed,
 *     enemyCount: window.game.enemies.length
 *   });
 *   
 *   // Check if game loop is running
 *   const lastTime = window.game.lastTime;
 *   setTimeout(() => {
 *     console.log("Game loop check:", {
 *       initialLastTime: lastTime,
 *       currentLastTime: window.game.lastTime,
 *       loopRunning: window.game.lastTime !== lastTime
 *     });
 *   }, 1000);
 * })();
 */

/**
 * TEST 6: Debug WaveManager Update
 * 
 * Paste this into your code temporarily to debug wave manager updates:
 * 
 * // In waveManager.js, modify the update method to add debugging:
 * update(deltaSec) {
 *   console.log("WaveManager update called:", {
 *     deltaSec,
 *     gameOver: this.game.gameOver,
 *     gameStarted: this.game.gameStarted,
 *     waveActive: this.waveActive,
 *     waveIndex: this.waveIndex,
 *     waveCount: this.waves.length,
 *     timeUntilNextWave: this.timeUntilNextWave
 *   });
 *   
 *   if (this.game.gameOver) return;
 *   if (!this.game.gameStarted) return;
 *
 *   if (!this.waveActive && this.waveIndex < this.waves.length) {
 *     this.timeUntilNextWave -= deltaSec;
 *     console.log("Time until next wave:", this.timeUntilNextWave);
 *     if (this.timeUntilNextWave <= 0) {
 *       console.log("Starting wave", this.waveIndex);
 *       this.startWave(this.waveIndex);
 *     }
 *   }
 *
 *   if (this.waveActive) {
 *     const waveInfo = this.waves[this.waveIndex];
 *     console.log("Active wave info:", waveInfo);
 *     
 *     waveInfo.enemyGroups.forEach(group => {
 *       console.log("Processing enemy group:", {
 *         type: group.type,
 *         spawned: group.spawnedCount,
 *         total: group.count,
 *         timer: group.spawnTimer
 *       });
 *       
 *       if (group.spawnedCount < group.count) {
 *         group.spawnTimer -= deltaSec;
 *         if (group.spawnTimer <= 0) {
 *           console.log("Spawning enemy of type:", group.type);
 *           this.spawnEnemyGroup(group);
 *           group.spawnedCount++;
 *           const intervalSec = (group.spawnInterval || 1000) / 1000;
 *           group.spawnTimer = intervalSec;
 *         }
 *       }
 *     });
 *
 *     // Rest of the update method...
 *   }
 * }
 */

/**
 * POTENTIAL FIXES:
 * 
 * 1. Check if level1.js wave definition is properly formatted
 * 2. Ensure the enemyGroups has spawnedCount and spawnTimer initialized
 * 3. Validate the enemy types used in wave definitions exist
 * 4. Check path validity for enemy spawning
 * 5. Verify the initial wave timing (timeUntilNextWave)
 */