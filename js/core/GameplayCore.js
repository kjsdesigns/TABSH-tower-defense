/**
 * GameplayCore.js
 * 
 * Kingdom Rush-standard gameplay mechanics implementation.
 * Ensures proper tower defense game flow and player experience.
 */

export class GameplayCore {
  constructor(game) {
    this.game = game;
    this.waveStartDelay = 2.0; // Standard 2-second delay between waves
    this.enemyDeathReward = 10; // Gold per enemy killed
    this.enemyEscapeLifeLoss = 1; // Lives lost per enemy escape
  }

  /**
   * Initialize Kingdom Rush standard gameplay
   */
  initialize() {
    console.log('Initializing Kingdom Rush standard gameplay mechanics');
    
    // Ensure proper wave timing
    this.setupWaveProgression();
    
    // Setup tower build system
    this.setupTowerPlacement();
    
    // Setup enemy progression
    this.setupEnemySystem();
    
    // Setup hero combat
    this.setupHeroCombat();
  }

  setupWaveProgression() {
    // Ensure waves start with proper timing
    if (this.game.waveManager) {
      this.game.waveManager.timeUntilNextWave = this.waveStartDelay;
      
      // Add wave completion listener
      this.game.gameState.on('waveCompleted', (data) => {
        console.log(`Wave ${data.waveNumber} completed!`);
        this.game.waveManager.timeUntilNextWave = this.waveStartDelay;
      });
    }
  }

  setupTowerPlacement() {
    // Ensure proper tower spot detection and build dialog
    this.game.gameState.on('towerSpotClicked', (data) => {
      this.showTowerBuildDialog(data.spot, data.mousePos);
    });
  }

  setupEnemySystem() {
    // Add proper enemy death rewards
    this.game.gameState.on('enemyKilled', (data) => {
      this.game.gameState.addGold(this.enemyDeathReward);
    });
    
    // Add enemy escape penalties
    this.game.gameState.on('enemyEscaped', (data) => {
      this.game.gameState.loseLife();
    });
  }

  setupHeroCombat() {
    // Hero auto-targeting and combat improvements
    this.game.gameState.on('heroNearEnemy', (data) => {
      this.engageHeroInCombat(data.hero, data.enemy);
    });
  }

  showTowerBuildDialog(spot, mousePos) {
    const buildDialog = document.getElementById('towerBuildDialog');
    const buildOptionsDiv = document.getElementById('towerBuildOptions');
    
    if (!buildDialog || !buildOptionsDiv) return;
    
    // Clear previous options
    buildOptionsDiv.innerHTML = '';
    
    // Get available tower types
    const towerTypes = this.game.towerManager.getTowerData();
    
    towerTypes.forEach(towerConfig => {
      const button = document.createElement('button');
      button.textContent = `${towerConfig.name} ($${towerConfig.cost[0]})`;
      button.style.margin = '5px';
      button.style.padding = '8px 12px';
      button.style.border = '2px solid #333';
      button.style.borderRadius = '4px';
      button.style.color = 'white';
      button.style.fontWeight = 'bold';
      
      // Use same colors as tower rendering
      const towerColors = {
        'point tower': '#9013fe',    // Purple for single-target
        'splash tower': '#f5a623',   // Orange for area-of-effect  
        'barracks tower': '#50e3c2'  // Teal for unit-spawning
      };
      
      button.style.backgroundColor = towerColors[towerConfig.name] || '#666666';
      
      // Check if player can afford tower
      const canAfford = this.game.gameState.get('gold') >= towerConfig.cost[0];
      button.disabled = !canAfford;
      
      if (!canAfford) {
        button.style.opacity = '0.5';
        button.style.backgroundColor = '#333';
      }
      
      button.addEventListener('click', () => {
        this.buildTower(towerConfig.name, spot);
        buildDialog.style.display = 'none';
      });
      
      buildOptionsDiv.appendChild(button);
    });
    
    // Position dialog near click
    buildDialog.style.display = 'block';
    buildDialog.style.left = `${mousePos.x}px`;
    buildDialog.style.top = `${mousePos.y}px`;
  }

  buildTower(towerType, spot) {
    const towerConfig = this.game.towerManager.findTowerConfigByName(towerType);
    if (!towerConfig) return;
    
    const cost = towerConfig.cost[0];
    
    try {
      // Spend gold
      this.game.gameState.spendGold(cost);
      
      // Create tower
      const tower = this.game.towerManager.createTower(towerType);
      if (tower) {
        tower.x = spot.x;
        tower.y = spot.y;
        tower.spot = spot;
        spot.occupied = true;
        this.game.towerManager.towers.push(tower);
        
        // Create units for barracks towers
        if (towerType === 'barracks tower') {
          this.game.towerManager.createUnitsForTower(tower);
        }
        
        console.log(`Built ${towerType} at (${spot.x}, ${spot.y}) for $${cost}`);
      }
    } catch (error) {
      console.error('Failed to build tower:', error);
      alert(`Cannot build tower: ${error.message}`);
    }
  }

  engageHeroInCombat(hero, enemy) {
    if (hero.isEngaged || hero.dead) return;
    
    hero.isEngaged = true;
    hero.engagedEnemy = enemy;
    
    console.log(`${hero.name} engaging ${enemy.name}`);
  }

  /**
   * Force wave to start immediately (for testing)
   */
  forceNextWave() {
    if (this.game.waveManager) {
      this.game.waveManager.timeUntilNextWave = 0;
    }
  }

  /**
   * Get gameplay statistics for debugging
   */
  getStats() {
    return {
      waveSystem: {
        currentWave: this.game.waveManager?.waveIndex + 1,
        totalWaves: this.game.waveManager?.waves?.length,
        waveActive: this.game.waveManager?.waveActive,
        timeUntilNext: this.game.waveManager?.timeUntilNextWave
      },
      enemySystem: {
        enemiesOnMap: this.game.enemies?.length || 0,
        totalKilled: 0, // Could track this
        totalEscaped: 0 // Could track this
      },
      towerSystem: {
        towersBuilt: this.game.towerManager?.towers?.length || 0,
        goldSpent: 0 // Could track this
      },
      heroSystem: {
        heroCount: this.game.heroManager?.heroes?.length || 0,
        heroEngaged: this.game.heroManager?.heroes?.some(h => h.isEngaged) || false
      }
    };
  }
}

// Make globally accessible for debugging
export const gameplayCore = new GameplayCore();
window.gameplayCore = gameplayCore;