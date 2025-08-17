import { MeleeActor } from "./utils/meleeActor.js";
import { movementSystem } from "./core/MovementSystem.js";
import { assetManager } from "./core/AssetManager.js";
import { meleeCombatSystem } from "./core/MeleeCombatSystem.js";

/**
 * A specialized soldier for barracks towers
 */
class Soldier extends MeleeActor {
  constructor(config) {
    super({
      name: config.name || "Barracks Soldier",
      x: config.x || 0,
      y: config.y || 0,
      radius: config.radius || 7,
      maxHp: config.maxHp,
      hp: config.hp || config.maxHp,
      damage: config.damage,
      attackInterval: config.attackInterval,
      isMelee: true,
      speed: config.speed || 50,
    });
    this.respawnTime = config.respawnTime || 10;
    this.respawnTimer = 0;

    // We'll store an index for soldier's position inside the group
    this.indexInGroup = config.indexInGroup || 0;
    this.groupSize = config.groupSize || 1;
    
    // Register with movement system
    movementSystem.registerEntity(this, {
      speed: this.speed,
      type: 'gather',
      stopDistance: 2
    });
    
    // Register with melee combat system
    meleeCombatSystem.registerMeleeUnit(this);
    
    // Load soldier asset
    this.loadAssets();
  }
  
  async loadAssets() {
    try {
      this.image = await assetManager.loadImage('assets/units/soldier.png', 'hero');
    } catch (error) {
      console.warn(`Failed to load soldier assets: ${error.message}`);
    }
  }

  update(deltaSec, game) {
    if (this.dead) {
      this.respawnTimer -= deltaSec;
      if (this.respawnTimer <= 0) {
        this.dead = false;
        this.hp = this.maxHp;
        console.log(`Soldier ${this.name} respawned`);
      }
    } else {
      super.updateMelee(deltaSec, game);
      // Movement is now handled by MovementSystem
    }
  }

  drawSoldier(ctx) {
    if (this.dead) {
      ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
    } else {
      ctx.fillStyle = "darkred";
    }
    
    // Draw soldier image if available, otherwise use colored circle
    if (this.image && this.image instanceof HTMLImageElement) {
      const alpha = this.dead ? 0.5 : 1.0;
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        this.image,
        this.x - this.radius,
        this.y - this.radius,
        this.radius * 2,
        this.radius * 2
      );
      ctx.globalAlpha = 1.0;
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  setGatherPoint(x, y) {
    console.log(`Soldier ${this.name} gather point set to (${x}, ${y})`);
    
    // Use melee combat system for gather point management
    meleeCombatSystem.setGatherPoint(this, x, y);
  }
  
  // Clean up when soldier is removed
  destroy() {
    movementSystem.unregisterEntity(this);
    meleeCombatSystem.unregisterMeleeUnit(this);
  }
}

/**
 * TowerUnitGroup manages the soldiers spawned by a barracks tower
 */
export class TowerUnitGroup {
  constructor(tower, config) {
    this.tower = tower;
    this.soldiers = [];
    this.config = config;
    
    // Create soldiers based on config
    const numUnits = config.numUnits || 3;
    for (let i = 0; i < numUnits; i++) {
      const soldier = new Soldier({
        name: `${tower.type} Soldier ${i + 1}`,
        x: tower.x + (Math.random() - 0.5) * 20,
        y: tower.y + (Math.random() - 0.5) * 20,
        maxHp: config.hp || 50,
        damage: config.damage || 10,
        attackInterval: config.attackInterval || 1.5,
        speed: config.speed || 50,
        respawnTime: config.respawnTime || 10,
        indexInGroup: i,
        groupSize: numUnits
      });
      this.soldiers.push(soldier);
    }
  }

  update(deltaSec, game) {
    this.soldiers.forEach(soldier => {
      soldier.update(deltaSec, game);
    });
  }

  draw(ctx) {
    this.soldiers.forEach(soldier => {
      soldier.drawSoldier(ctx);
    });
  }

  setGatherPoint(x, y) {
    console.log(`Setting gather point for ${this.soldiers.length} soldiers at (${x}, ${y})`);
    
    // Set gather points in formation around the target point
    this.soldiers.forEach((soldier, index) => {
      const angle = (index / this.soldiers.length) * Math.PI * 2;
      const radius = 20;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      
      soldier.setGatherPoint(x + offsetX, y + offsetY);
    });
  }
  
  // Set default gather point when units are created
  setDefaultGatherPoint() {
    if (!this.tower) return;
    
    // Default gather point is near the tower
    const defaultX = this.tower.x + 30;
    const defaultY = this.tower.y;
    
    this.setGatherPoint(defaultX, defaultY);
  }

  // Get all living soldiers
  getLivingSoldiers() {
    return this.soldiers.filter(soldier => !soldier.dead);
  }

  // Get count of living soldiers
  getLivingCount() {
    return this.getLivingSoldiers().length;
  }

  // Clean up all soldiers
  destroy() {
    this.soldiers.forEach(soldier => soldier.destroy());
    this.soldiers = [];
  }
}