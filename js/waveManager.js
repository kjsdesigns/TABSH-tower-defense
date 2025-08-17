import { unlockStars } from "./mainScreen.js";

export class WaveManager {
  constructor(game) {
    this.game = game;
    this.waveIndex = 0;
    this.waveActive = false;
    this.timeUntilNextWave = 2.0; // Start first wave after 2 seconds
    this.waves = [];
  }

  clearAllTimers() {
    this.waveIndex = 0;
    this.waveActive = false;
    this.timeUntilNextWave = 2.0; // Reset to initial delay
    this.waves.forEach(w => {
      w.enemyGroups.forEach(g => {
        g.spawnedCount = 0;
        g.spawnTimer = 0;
      });
    });
  }

  loadWavesFromLevel(levelData) {
    this.waves = (levelData && levelData.waves) || [];
    
    // Initialize any missing fields in the waves
    this.waves.forEach(wave => {
      if (wave.enemyGroups) {
        wave.enemyGroups.forEach(group => {
          // Ensure critical fields are initialized
          if (group.spawnedCount === undefined) group.spawnedCount = 0;
          if (group.spawnTimer === undefined) group.spawnTimer = 0;
          
          // Ensure other required fields have defaults
          if (group.pathIndex === undefined) group.pathIndex = 0;
          if (group.hpMultiplier === undefined) group.hpMultiplier = 1.0;
          if (group.spawnInterval === undefined) group.spawnInterval = 1000;
        });
      }
    });
    
    console.log("Waves loaded (reloaded):", this.waves);
  }

  update(deltaSec) {
    // Skip updates if game is over or not started
    if (this.game.gameState.get('gameOver')) return;
    if (!this.game.gameState.get('gameStarted')) return;

    // Debug counter to limit log spam
    if (!this._debugCounter) this._debugCounter = 0;
    this._debugCounter++;
    
    // Log state every 60 frames (approximately once per second at 60fps)
    if (this._debugCounter % 60 === 0) {
      console.log("WaveManager update:", {
        waveIndex: this.waveIndex,
        waveCount: this.waves.length,
        waveActive: this.waveActive,
        timeUntilNextWave: this.timeUntilNextWave.toFixed(2),
        enemyCount: this.game.enemies.length
      });
    }

    // Start a new wave if needed  
    if (!this.waveActive && this.waveIndex < this.waves.length) {
      const oldTime = this.timeUntilNextWave;
      this.timeUntilNextWave -= deltaSec;
      
      // Debug the countdown
      if (Math.floor(oldTime) !== Math.floor(this.timeUntilNextWave)) {
        console.log(`Wave countdown: ${Math.ceil(this.timeUntilNextWave)}`);
      }
      
      if (this.timeUntilNextWave <= 0) {
        console.log(`Starting wave ${this.waveIndex+1} of ${this.waves.length}`);
        this.startWave(this.waveIndex);
      }
    }

    // Handle active wave
    if (this.waveActive) {
      try {
        if (this.waveIndex >= this.waves.length) {
          console.error(`Invalid waveIndex: ${this.waveIndex} (only ${this.waves.length} waves defined)`);
          this.waveActive = false;
          return;
        }
        
        const waveInfo = this.waves[this.waveIndex];
        
        if (!waveInfo) {
          console.error(`Invalid wave data for index ${this.waveIndex}`);
          this.waveActive = false;
          return;
        }
        
        if (!waveInfo.enemyGroups || !Array.isArray(waveInfo.enemyGroups)) {
          console.error(`Wave ${this.waveIndex} has no enemyGroups array`);
          this.waveActive = false;
          return;
        }
        
        // Process each enemy group
        waveInfo.enemyGroups.forEach(group => {
          if (!group) return;
          
          // Initialize fields if they're missing
          if (group.spawnedCount === undefined) group.spawnedCount = 0;
          if (group.count === undefined) group.count = 5; // Default
          if (group.spawnTimer === undefined) group.spawnTimer = 0;
          
          // Spawn enemies as needed
          if (group.spawnedCount < group.count) {
            group.spawnTimer -= deltaSec;
            if (group.spawnTimer <= 0) {
              this.spawnEnemyGroup(group);
              group.spawnedCount++;
              const intervalSec = (group.spawnInterval || 1000) / 1000;
              group.spawnTimer = intervalSec;
            }
          }
        });
      } catch (error) {
        console.error("Error in wave update:", error);
      }

      try {
        // Check if wave is complete using the new method
        if (this.checkWaveCompletion()) {
          console.log(`Wave ${this.waveIndex+1} completed!`);
          
          // wave finished
          this.waveActive = false;
          this.waveIndex++;
  
          if (this.waveIndex >= this.waves.length) {
            // last wave => victory
            console.log("All waves completed - victory!");
            
            if (this.game.gameState.get('lives') > 0) {
              // Calculate star rating based on lives remaining
              let starCount = 1;
              const lives = this.game.gameState.get('lives');
              if (lives >= 18) starCount = 3;
              else if (lives >= 10) starCount = 2;
  
              const chosenLevel = localStorage.getItem("kr_chosenLevel") || "level1";
              unlockStars(chosenLevel, starCount);
              
              // End game with victory
              this.game.gameState.endGame(true);
            } else {
              // No lives remaining - this shouldn't happen since loseLife() handles it
              this.game.gameState.endGame(false);
            }
          } else {
            console.log(`Preparing next wave ${this.waveIndex+1}...`);
            this.timeUntilNextWave = 0; // auto-start next wave
          }
        }
      } catch (error) {
        console.error("Error checking wave completion:", error);
      }
    }
  }

  startWave(index) {
    if (index >= this.waves.length) {
      console.error(`Cannot start wave ${index} - only ${this.waves.length} waves defined`);
      return;
    }
    
    this.waveActive = true;
    const waveInfo = this.waves[index];
    
    if (!waveInfo.enemyGroups || !Array.isArray(waveInfo.enemyGroups)) {
      console.error(`Wave ${index} has invalid or missing enemyGroups`);
      waveInfo.enemyGroups = [];
      return;
    }
    
    console.log(`Starting wave ${index} with ${waveInfo.enemyGroups.length} enemy groups`);
    
    waveInfo.enemyGroups.forEach((group, groupIndex) => {
      // Validate enemy group data
      if (!group.type) {
        console.error(`Wave ${index}, group ${groupIndex} missing enemy type!`);
        return;
      }
      
      if (!group.count || typeof group.count !== 'number') {
        console.error(`Wave ${index}, group ${groupIndex} has invalid count:`, group.count);
        group.count = 1; // Set a default
      }
      
      // Reset spawn counters
      group.spawnedCount = 0;
      const intervalSec = (group.spawnInterval || 1000) / 1000;
      group.spawnTimer = intervalSec;
      
      console.log(`Wave ${index}, group ${groupIndex} ready: ${group.count}x ${group.type}`);
    });
  }

  spawnEnemyGroup(group) {
    try {
      if (!group || !group.type) {
        console.error("Cannot spawn enemy group: invalid group data", group);
        return;
      }
      
      let pathIndex = (typeof group.pathIndex === "number") ? group.pathIndex : 0;
      const hpMultiplier = group.hpMultiplier || 1.0;
      
      // Verify path exists
      const paths = this.game.levelData?.paths || [];
      if (paths.length === 0) {
        console.error("Cannot spawn enemy: no paths defined in level data!");
        return;
      }
      
      if (pathIndex >= paths.length) {
        console.error(`Cannot spawn enemy: pathIndex ${pathIndex} exceeds available paths (${paths.length})`);
        // Fall back to first path
        pathIndex = 0;
      }
      
      console.log(`Spawning enemy: type=${group.type}, hp=${hpMultiplier}x, path=${pathIndex}`);
      
      this.game.enemyManager.spawnEnemy(
        group.type,
        hpMultiplier,
        pathIndex
      );
    } catch (error) {
      console.error("Error spawning enemy group:", error);
    }
  }

  sendWaveEarly() {
    if (!this.waveActive && this.waveIndex < this.waves.length) {
      this.startWave(this.waveIndex);
    }
  }
  
  getCurrentWave() {
    if (this.waveIndex < this.waves.length) {
      return this.waves[this.waveIndex];
    }
    return null;
  }
  
  getCurrentWaveEnemyStats() {
    const currentWave = this.getCurrentWave();
    if (!currentWave || !currentWave.enemyGroups) {
      return { total: 0, remaining: 0, spawned: 0 };
    }
    
    let total = 0;
    let spawned = 0;
    
    // Calculate total enemies for this wave
    currentWave.enemyGroups.forEach(group => {
      total += group.count || 0;
      spawned += group.spawnedCount || 0;
    });
    
    // Count remaining enemies on the map from this wave
    // Note: This is an approximation - ideally we'd track which enemies belong to which wave
    const remaining = this.game.enemies.length;
    
    return { total, remaining, spawned };
  }
  
  checkWaveCompletion() {
    if (!this.waveActive) return false;
    
    const currentWave = this.getCurrentWave();
    if (!currentWave || !currentWave.enemyGroups) return true;
    
    // Check if all enemies in this wave have been spawned
    const allSpawned = currentWave.enemyGroups.every(group => {
      return (group.spawnedCount || 0) >= (group.count || 0);
    });
    
    // Check if no enemies remain on the map
    const noEnemiesRemaining = this.game.enemies.length === 0;
    
    return allSpawned && noEnemiesRemaining;
  }
}
