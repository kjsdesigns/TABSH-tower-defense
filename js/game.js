import { EnemyManager } from "./enemyManager.js";
import { TowerManager } from "./towerManager.js";
import { WaveManager }  from "./waveManager.js";
import { HeroManager }  from "./heroManager.js";
import { ProjectileManager } from "./utils/projectileManager.js";
import { soundManager } from "./soundManager.js";
import { gatherController } from "./utils/gatherController.js";

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

    this.gold = 200;
    this.lives = 20;
    this.maxLives = 20;

    this.speedOptions = [1, 2, 4, 0.5];
    this.speedIndex = 0;
    this.gameSpeed = this.speedOptions[this.speedIndex];

    this.gameStarted = false;
    this.paused = false;

    this.levelData = null;
    this.backgroundImg = null;
    this.paths = [];
    this.towerSpots = [];
    this.enemies = [];

    this.globalEnemyHpMultiplier = 1.0;

    this.enemyManager = new EnemyManager(this);
    this.towerManager = new TowerManager(this);
    this.waveManager  = new WaveManager(this);
    this.heroManager  = new HeroManager(this);
    this.projectileManager = new ProjectileManager(this); 

    this.lastTime = 0;
    this.debugMode = false;

    // Set up gatherController
    console.log("Initializing gatherController...");
    const gcInstance = gatherController.init(this);
    console.log("gatherController initialized:", !!gcInstance);

    // Speed/pause UI
    const speedBtn = document.getElementById("speedToggleButton");
    if (speedBtn) {
      speedBtn.addEventListener("click", () => {
        this.speedIndex = (this.speedIndex + 1) % this.speedOptions.length;
        this.gameSpeed = this.speedOptions[this.speedIndex];
        speedBtn.textContent = `${this.gameSpeed}x`;
      });
    }
    const gcBtn = document.getElementById("gameControlButton");
    if (gcBtn) {
      gcBtn.addEventListener("click", () => {
        if (!this.gameStarted) {
          this.gameStarted = true;
          this.paused = false;
          gcBtn.textContent = "Pause";
        } else if (!this.paused) {
          this.paused = true;
          gcBtn.textContent = "Resume";
        } else {
          this.paused = false;
          gcBtn.textContent = "Pause";
        }
      });
    }

    this.canvas.addEventListener("click", (e) => this.handleCanvasClick(e));
  }

  setLevelData(data, bgImg) {
    this.levelData = data;
    this.backgroundImg = bgImg;

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
  }

  start() {
    requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  gameLoop(timestamp) {
    const delta = (timestamp - this.lastTime) || 0;
    this.lastTime = timestamp;
    let deltaSec = delta / 1000;
    deltaSec *= this.gameSpeed;

    if (!this.paused) {
      // IMPORTANT: Always update hero movement systems first, regardless of game state
      // Heroes need to be updated first to ensure movement works correctly
      this.heroManager.update(deltaSec);
      
      // Then update gatherController (as a backup movement system)
      // Always update the gatherController
      gatherController.update(deltaSec);
      
      if (this.gameStarted) {
        this.waveManager.update(deltaSec);
        this.enemyManager.update(deltaSec);
      }
      
      // Always update these other systems regardless of game started state
      this.towerManager.update(deltaSec);
      this.projectileManager.update(deltaSec);
      
      // Debug logging
      if (!this._updateCounter) this._updateCounter = 0;
      this._updateCounter++;
      
      // Log every 60 frames
      if (this._updateCounter % 60 === 0) {
        console.log("Game update calling gatherController.update(), gameStarted =", this.gameStarted, "paused =", this.paused);
      }
    }

    this.draw();
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
      if(this.heroStart) {
        this.ctx.fillStyle="red";
        this.ctx.beginPath();
        this.ctx.arc(this.heroStart.x,this.heroStart.y,10,0,Math.PI*2);
        this.ctx.fill();
      }
    }

    // draw enemies
    this.enemies.forEach(e => {
      this.enemyManager.drawEnemy(this.ctx, e);
    });

    this.projectileManager.draw(this.ctx);
    this.towerManager.drawTowers(this.ctx);
    this.heroManager.draw(this.ctx);

    this.ctx.fillStyle = "white";
    this.ctx.fillText(`Gold: ${this.gold}`, 10, 50);
    this.ctx.fillText(`Wave: ${this.waveManager.waveIndex+1}/${this.waveManager.waves.length}`, 10, 70);
    this.ctx.fillText(`Lives: ${this.lives}/${this.maxLives}`, 10, 90);
    if (!this.waveManager.waveActive &&
        this.waveManager.waveIndex < this.waveManager.waves.length &&
        this.gameStarted) {
      this.ctx.fillText("Next wave is ready", 10, 110);
    }
  }
}
