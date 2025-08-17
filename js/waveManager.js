import { unlockStars } from "./mainScreen.js";

export class WaveManager {
  constructor(game) {
    this.game = game;
    this.waveIndex = 0;
    this.waveActive = false;
    this.timeUntilNextWave = 0;
    this.waves = [];
  }

  clearAllTimers() {
    this.waveIndex = 0;
    this.waveActive = false;
    this.timeUntilNextWave = 0;
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
    if (this.game.gameOver) return;
    if (!this.game.gameStarted) return;

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
      this.timeUntilNextWave -= deltaSec;
      
      // Log countdown every 30 frames
      if (this._debugCounter % 30 === 0) {
        console.log(`Time until wave ${this.waveIndex+1}: ${this.timeUntilNextWave.toFixed(2)}s`);
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
        // Check if wave done: all spawned + no enemies remain
        if (!waveInfo || !waveInfo.enemyGroups) return;
        
        const allSpawned = waveInfo.enemyGroups.every(g => {
          if (!g) return true; // Skip invalid groups
          return (g.spawnedCount >= g.count);
        });
        
        if (allSpawned && this.game.enemies.length === 0) {
          console.log(`Wave ${this.waveIndex+1} completed!`);
          
          // wave finished
          this.waveActive = false;
          this.waveIndex++;
  
          if (this.waveIndex >= this.waves.length) {
            // last wave => victory
            console.log("All waves completed - victory!");
            
            if (this.game.lives > 0 && !this.game.gameOver && this.game.uiManager) {
              this.game.paused = true;
              this.game.uiManager.showWinDialog(this.game.lives, this.game.maxLives);
  
              let starCount = 1;
              if (this.game.lives >= 18) starCount = 3;
              else if (this.game.lives >= 10) starCount = 2;
  
              const chosenLevel = localStorage.getItem("kr_chosenLevel") || "level1";
              unlockStars(chosenLevel, starCount);
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
}
