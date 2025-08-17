import { EnemyManager } from "./enemyManager.js";
import { TowerManager } from "./towerManager.js";
import { WaveManager }  from "./waveManager.js";
import { HeroManager }  from "./heroManager.js";
import { ProjectileManager } from "./utils/projectileManager.js";
import { soundManager } from "./soundManager.js";
import { gameState } from "./core/GameState.js";
import { movementSystem } from "./core/MovementSystem.js";
import { assetManager } from "./core/AssetManager.js";
import { GameplayCore } from "./core/GameplayCore.js";
import { meleeCombatSystem } from "./core/MeleeCombatSystem.js";

export class Game {
  constructor(
    canvas,
    enemyStatsDiv,
    towerSelectPanel,
    debugTableContainer
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;

    // Use centralized state management - SET THIS FIRST!
    this.gameState = gameState;
    
    // Reset game state for new game
    this.gameState.resetGame();
    
    this.levelData = null;
    this.backgroundImg = null;
    this.paths = [];
    this.towerSpots = [];
    this.enemies = [];

    this.enemyManager = new EnemyManager(this);
    this.towerManager = new TowerManager(this);
    this.waveManager  = new WaveManager(this);
    this.heroManager  = new HeroManager(this);
    this.projectileManager = new ProjectileManager(this); 

    this.lastTime = 0;
    
    // Initialize Kingdom Rush gameplay mechanics
    this.gameplayCore = new GameplayCore(this);
    this.gameplayCore.initialize();
    
    // Initialize error handling
    this.errorHandler = this.setupErrorHandling();
    
    console.log("Game initialized with Kingdom Rush mechanics");

    this.setupUI();
    this.canvas.addEventListener("click", (e) => this.handleCanvasClick(e));
  }

  async setLevelData(data, bgImg) {
    this.levelData = data;
    this.backgroundImg = bgImg;
    
    // Use centralized state
    this.gameState.setLevel(data.levelName || 'Unknown Level', data, bgImg);

    if (data && data.music) {
      soundManager.playMusic("assets/sounds/" + data.music);
    }

    if (data.heroStart) {
      this.heroStart = { x: data.heroStart.x, y: data.heroStart.y };
    } else {
      this.heroStart = null;
    }

    if (Array.isArray(data.paths)) {
      this.paths = data.paths.map(arr => arr.map(pt => ({ x: pt.x, y: pt.y })));
    } else {
      this.paths = [];
    }

    if (Array.isArray(data.towerSpots)) {
      this.towerSpots = data.towerSpots.map(s => ({
        x: s.x, y: s.y, occupied: false
      }));
    } else {
      this.towerSpots = [];
    }

    this.waveManager.loadWavesFromLevel(data);
    
    // Preload level assets
    try {
      await assetManager.preloadLevel(data);
      console.log('Level assets preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload some level assets:', error);
    }
  }
  
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Game Error:', event.error);
      this.handleGameError(event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      this.handleGameError(event.reason);
    });
  }
  
  handleGameError(error) {
    // Graceful error handling
    if (this.gameState.get('gameStarted')) {
      this.gameState.set('paused', true);
    }
    
    // Show user-friendly error message
    const errorMsg = `Game Error: ${error.message || 'An unexpected error occurred'}`;
    console.error(errorMsg);
    
    // Could show an error dialog here in the future
  }
  
  setupUI() {
    // Speed/pause UI with state management
    const speedBtn = document.getElementById("speedToggleButton");
    if (speedBtn) {
      speedBtn.addEventListener("click", () => {
        this.gameState.cycleSpeed();
        speedBtn.textContent = `${this.gameState.get('gameSpeed')}x`;
      });
    }
    
    const gcBtn = document.getElementById("gameControlButton");
    if (gcBtn) {
      gcBtn.addEventListener("click", () => {
        if (!this.gameState.get('gameStarted')) {
          this.gameState.startGame();
          gcBtn.textContent = "Pause";
        } else {
          this.gameState.togglePause();
          gcBtn.textContent = this.gameState.get('paused') ? "Resume" : "Pause";
        }
      });
    }
    
    // Listen to game state changes
    this.gameState.on('gameEnded', (data) => {
      if (data.won) {
        this.showWinMessage();
      } else {
        this.showLoseMessage();
      }
    });
  }

  start() {
    console.log('Game.start() called - starting game loop');
    requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  gameLoop(timestamp) {
    try {
      const delta = (timestamp - this.lastTime) || 0;
      this.lastTime = timestamp;
      let deltaSec = delta / 1000;
      deltaSec *= this.gameState.get('gameSpeed');

      if (!this.gameState.get('paused') && !this.gameState.get('gameOver')) {
        // Update movement system first (handles all entity movement)
        movementSystem.update(deltaSec);
        
        // Update melee combat system (Kingdom Rush style engagement)
        meleeCombatSystem.update(deltaSec, this);
        
        // Update heroes
        this.heroManager.update(deltaSec);
        
        // Update game systems based on game state
        if (this.gameState.get('gameStarted')) {
          this.waveManager.update(deltaSec);
          this.enemyManager.update(deltaSec);
        }
        
        // Always update these systems
        this.towerManager.update(deltaSec);
        this.projectileManager.update(deltaSec);
      }

      this.draw();
    } catch (error) {
      this.handleGameError(error);
    }
    
    requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  handleCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (this.uiManager && this.uiManager.handleCanvasClick) {
      this.uiManager.handleCanvasClick(mx, my, rect);
    }
  }

  draw() {
    if (this.backgroundImg) {
      this.ctx.drawImage(this.backgroundImg, 0, 0, this.width, this.height);
    } else {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }

    if (this.debugMode) {
      // draw paths, tower spots, heroStart
      this.ctx.strokeStyle = "yellow";
      this.ctx.lineWidth = 2;
      this.paths.forEach(path => {
        if (!path.length) return;
        this.ctx.beginPath();
        for (let i=0;i<path.length;i++){
          const pt=path[i];
          if(i===0) this.ctx.moveTo(pt.x, pt.y);
          else this.ctx.lineTo(pt.x, pt.y);
        }
        this.ctx.stroke();
      });
      this.ctx.fillStyle = "rgba(0,255,0,0.5)";
      this.towerSpots.forEach((s,i)=>{
        this.ctx.beginPath();
        this.ctx.arc(s.x,s.y,20,0,Math.PI*2);
        this.ctx.fill();
      });
      // heroStart position removed - no longer needed visually
    }

    // draw enemies
    this.enemies.forEach(e => {
      this.enemyManager.drawEnemy(this.ctx, e);
    });

    this.projectileManager.draw(this.ctx);
    this.towerManager.drawTowers(this.ctx);
    this.heroManager.draw(this.ctx);

    this.ctx.fillStyle = "white";
    this.ctx.fillText(`Gold: ${this.gameState.get('gold')}`, 10, 50);
    this.ctx.fillText(`Wave: ${this.waveManager.waveIndex+1}/${this.waveManager.waves.length}`, 10, 70);
    this.ctx.fillText(`Lives: ${this.gameState.get('lives')}/${this.gameState.get('maxLives')}`, 10, 90);
    
    // Show enemy count for current wave
    const currentWave = this.waveManager.getCurrentWave();
    if (currentWave) {
      const enemyStats = this.waveManager.getCurrentWaveEnemyStats();
      this.ctx.fillText(`Enemies: ${enemyStats.remaining}/${enemyStats.total}`, 10, 110);
    }
    
    // Show countdown timer when waiting for next wave
    if (!this.waveManager.waveActive &&
        this.waveManager.waveIndex < this.waveManager.waves.length &&
        this.gameState.get('gameStarted') &&
        this.enemies.length === 0) {
      
      const timeRemaining = this.waveManager.timeUntilNextWave;
      if (timeRemaining > 0) {
        const countdownSeconds = Math.ceil(timeRemaining);
        this.ctx.fillStyle = "yellow";
        this.ctx.font = "16px Arial";
        this.ctx.fillText(`Next wave starts in ${countdownSeconds}`, 10, 130);
        this.ctx.font = "12px Arial"; // Reset font
      }
    }
  }
  
  showWinMessage() {
    const winMessage = document.getElementById('winMessage');
    if (winMessage) {
      winMessage.style.display = 'block';
    }
  }
  
  showLoseMessage() {
    const loseMessage = document.getElementById('loseMessage');
    if (loseMessage) {
      loseMessage.style.display = 'block';
    }
  }
  
  // Expose game state getters for compatibility
  get gameStarted() {
    return this.gameState.get('gameStarted');
  }
  
  get paused() {
    return this.gameState.get('paused');
  }
  
  get gameOver() {
    return this.gameState.get('gameOver');
  }
  
  get gold() {
    return this.gameState.get('gold');
  }
  
  set gold(value) {
    this.gameState.set('gold', value);
  }
  
  get lives() {
    return this.gameState.get('lives');
  }
  
  set lives(value) {
    this.gameState.set('lives', value);
  }
  
  get debugMode() {
    return this.gameState.get('debugMode');
  }
  
  set debugMode(value) {
    this.gameState.set('debugMode', value);
  }
  
  get globalEnemyHpMultiplier() {
    return this.gameState.get('globalEnemyHpMultiplier');
  }
  
  set globalEnemyHpMultiplier(value) {
    this.gameState.set('globalEnemyHpMultiplier', value);
  }
}
