import { MeleeActor } from "./utils/meleeActor.js";
import { validateRequiredConfig } from "./utils/configValidator.js";
import { movementSystem } from "./core/MovementSystem.js";
import { assetManager } from "./core/AssetManager.js";
import { meleeCombatSystem } from "./core/MeleeCombatSystem.js";

export class Hero extends MeleeActor {
  constructor(config) {
    validateRequiredConfig("hero", config, config.name||"UnknownHero");
    super({
      name: config.name,
      x: config.x||0,
      y: config.y||0,
      radius: config.radius||20,
      maxHp: config.maxHp,
      hp: config.maxHp,
      damage: config.damage,
      attackInterval: config.attackInterval,
      isMelee: config.isMelee||false,
      speed: config.speed,
    });
    
    // Asset references
    this.standingImage = null;
    this.runningImage = null;
    this.attackingImage = null;
    this.projectileImage = null;
    this.attackSound = null;
    
    // Load assets
    this.loadAssets(config);
    
    // Register with movement system
    movementSystem.registerEntity(this, {
      speed: this.speed,
      type: 'gather',
      stopDistance: 3
    });
    
    // Register with melee combat system
    meleeCombatSystem.registerMeleeUnit(this);
    
    console.log(`Hero ${this.name} created and registered with movement and combat systems`);
  }
  
  async loadAssets(config) {
    try {
      const heroType = config.isMelee ? 'knight' : 'archer';
      this.standingImage = await assetManager.loadImage(`assets/heroes/${heroType}.png`, 'hero');
      this.runningImage = this.standingImage; // Use same image for now
      this.attackingImage = this.standingImage;
      
      if (!config.isMelee) {
        this.projectileImage = await assetManager.loadImage('assets/projectiles/arrow.png', 'projectile');
      }
      
      if (config.attackSound) {
        this.attackSound = await assetManager.loadAudio(config.attackSound);
      }
    } catch (error) {
      console.warn(`Failed to load hero assets: ${error.message}`);
    }
  }

  update(deltaSec, game) {
    super.updateMelee(deltaSec, game);
    // Movement and combat are handled by MovementSystem and MeleeCombatSystem
  }

  setGatherPoint(x, y) {
    // Validate coordinates
    if (isNaN(x) || isNaN(y)) {
      console.warn(`Invalid gather point coordinates: (${x}, ${y})`);
      return;
    }
    
    console.log(`Hero ${this.name} gather point set to (${x}, ${y})`);
    
    // Use melee combat system for gather point management
    meleeCombatSystem.setGatherPoint(this, x, y);
  }

  drawHero(ctx, isSelected) {
    if (this.dead) {
      ctx.fillStyle = "grey";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      if (isSelected) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      return;
    }

    // Draw hero image if available, otherwise use colored circle
    if (this.standingImage && this.standingImage instanceof HTMLImageElement) {
      ctx.drawImage(
        this.standingImage,
        this.x - this.radius,
        this.y - this.radius,
        this.radius * 2,
        this.radius * 2
      );
    } else {
      // Fallback to colored circle
      ctx.fillStyle = this.isMelee ? "blue" : "darkgreen";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw selection indicator
    if (isSelected) {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw movement target if moving
    if (movementSystem.isMoving(this)) {
      const target = movementSystem.getTarget(this);
      if (target) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        
        // Draw line from hero to target
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        
        // Draw circle at target
        ctx.beginPath();
        ctx.arc(target.x, target.y, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
      }
    }
  }

  // Clean up when hero is removed
  destroy() {
    movementSystem.unregisterEntity(this);
    meleeCombatSystem.unregisterMeleeUnit(this);
  }
}

export class HeroManager {
  constructor(game) {
    this.game = game;
    this.heroes = [];
  }

  addHero(config) {
    const hero = new Hero(config);
    this.heroes.push(hero);
    return hero;
  }

  removeHero(hero) {
    const index = this.heroes.indexOf(hero);
    if (index > -1) {
      hero.destroy();
      this.heroes.splice(index, 1);
    }
  }

  getHeroAt(mx, my) {
    return this.heroes.find(h => {
      const dx = mx - h.x;
      const dy = my - h.y;
      return Math.sqrt(dx * dx + dy * dy) <= h.radius;
    });
  }

  update(deltaSec) {
    this.heroes.forEach(hero => {
      if (!hero.dead) {
        hero.update(deltaSec, this.game);
      }
    });
  }

  draw(ctx) {
    const selectedHero = (this.game.uiManager ? this.game.uiManager.selectedHero : null);
    
    this.heroes.forEach(hero => {
      hero.drawHero(ctx, hero === selectedHero);
    });
  }

  // Clean up all heroes
  destroy() {
    this.heroes.forEach(hero => hero.destroy());
    this.heroes = [];
  }
}