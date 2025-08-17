import { MeleeActor } from "./utils/meleeActor.js";
import { validateRequiredConfig } from "./utils/configValidator.js";
import { gatherController } from "./utils/gatherController.js";

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
    this.standingImage=config.standingImage||null;
    this.runningImage=config.runningImage||null;
    this.attackingImage=config.attackingImage||null;
    this.projectileImage=config.projectileImage||null;
    this.attackSound=config.attackSound||null;

    // Always initialize gather position
    this.gatherX = this.x;
    this.gatherY = this.y;
    
    // Register with gatherController
    if (window.gatherController) {
      try {
        gatherController.registerUnit(this);
        console.log(`Hero ${this.name} registered with gatherController`);
      } catch (err) {
        console.warn(`Failed to register hero with gatherController: ${err.message}`);
      }
    } else {
      console.warn("gatherController not available, will use direct movement only");
    }
  }

  update(deltaSec, game){
    super.updateMelee(deltaSec,game);
    
    // CRITICAL: Always handle direct movement if not engaged or dead
    // This is the primary movement system - works regardless of game state or gatherController
    if (!this.isEngaged && !this.dead) {
      // Ensure gather coordinates are valid numbers
      if (isNaN(this.gatherX) || isNaN(this.gatherY)) {
        console.log(`Invalid gather coordinates for hero ${this.name}: ${this.gatherX}, ${this.gatherY}. Resetting to current position.`);
        this.gatherX = this.x;
        this.gatherY = this.y;
        return; // Skip movement this frame
      }
      
      // Check if we need to move to gather point
      const dx = this.gatherX - this.x;
      const dy = this.gatherY - this.y;
      const distSq = dx*dx + dy*dy;
      
      // Log movement attempt every 60 frames
      if (!this._moveCounter) this._moveCounter = 0;
      this._moveCounter++;
      
      if (this._moveCounter % 60 === 0 && distSq > 4) {
        console.log(`Hero ${this.name} trying to move: `, {
          currentPos: {x: this.x, y: this.y},
          gatherPoint: {x: this.gatherX, y: this.gatherY},
          distance: Math.sqrt(distSq),
          speed: this.speed,
          delta: deltaSec
        });
      }
      
      // Move if we're more than 2 units away from gather point
      if (distSq > 4) {
        // Direct movement calculation
        const dist = Math.sqrt(distSq);
        const moveStep = this.speed * deltaSec;
        
        // Store previous position for debug
        const oldX = this.x;
        const oldY = this.y;
        
        if (moveStep >= dist) {
          this.x = this.gatherX;
          this.y = this.gatherY;
        } else {
          this.x += (dx / dist) * moveStep;
          this.y += (dy / dist) * moveStep;
        }
        
        // Log significant movements for debugging
        const movedDistance = Math.sqrt(Math.pow(this.x - oldX, 2) + Math.pow(this.y - oldY, 2));
        if (movedDistance > 1) {
          console.log(`Hero ${this.name} moved ${movedDistance.toFixed(2)} units`);
        }
      } else if (distSq > 0 && distSq <= 4) {
        // Snap to exact gather point when very close
        this.x = this.gatherX;
        this.y = this.gatherY;
        
        // Reset target display once we've reached destination
        this.showTarget = false;
      }
    }
  }
  
  // Add a method to draw the target indicator
  drawTarget(ctx) {
    if (this.showTarget && this.targetX !== undefined && this.targetY !== undefined) {
      // Draw target indicator
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      
      // Draw line from hero to target
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.targetX, this.targetY);
      ctx.stroke();
      
      // Draw circle at target
      ctx.beginPath();
      ctx.arc(this.targetX, this.targetY, 5, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.restore();
    }
  }

  drawHero(ctx,isSelected){
    if(this.dead){
      ctx.fillStyle="grey";
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
      ctx.fill();
      if(isSelected){
        ctx.strokeStyle="white";
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius+2,0,Math.PI*2);
        ctx.stroke();
      }
      return;
    }
    ctx.fillStyle=this.standingImage?"darkgreen":"blue";
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
    ctx.fill();

    if(isSelected){
      ctx.strokeStyle="white";
      ctx.lineWidth=3; // a bit thicker
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.radius+2,0,Math.PI*2);
      ctx.stroke();
    }
  }
}

export class HeroManager {
  constructor(game){
    this.game=game;
    this.heroes=[];
  }

  addHero(config){
    const hero=new Hero(config);
    this.heroes.push(hero);
    return hero;
  }

  getHeroAt(mx,my){
    return this.heroes.find(h=>{
      const dx=mx-h.x; const dy=my-h.y;
      return Math.sqrt(dx*dx+dy*dy)<=h.radius;
    });
  }

  update(deltaSec){
    this.heroes.forEach(hero=>{
      if(!hero.dead){
        hero.update(deltaSec,this.game);
      }
    });
  }

  draw(ctx){
    const selectedHero=(this.game.uiManager?this.game.uiManager.selectedHero:null);
    
    // Draw targets first (so they appear behind heroes)
    this.heroes.forEach(hero => {
      if (hero.drawTarget) {
        hero.drawTarget(ctx);
      }
    });
    
    // Then draw the heroes
    this.heroes.forEach(hero=>{
      hero.drawHero(ctx, hero===selectedHero);
    });
  }
}
