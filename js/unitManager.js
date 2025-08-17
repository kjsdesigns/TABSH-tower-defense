import { MeleeActor } from "./utils/meleeActor.js";
import { gatherController } from "./utils/gatherController.js";

/**
 * A specialized soldier
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
  }

  update(deltaSec, game) {
    if (this.dead) {
      this.respawnTimer -= deltaSec;
      if (this.respawnTimer<=0){
        this.dead=false;
        this.hp=this.maxHp;
      }
    } else {
      super.updateMelee(deltaSec, game);
      
      // Always call our direct movement function to ensure units move
      this.moveDirectlyToGatherPoint(deltaSec);
    }
  }
  
  // CRITICAL FIX: Robust, self-contained movement function that doesn't depend on any external systems
  moveDirectlyToGatherPoint(deltaSec) {
    // Skip if engaged or dead
    if (this.isEngaged || this.dead) return;
    
    // Ensure gather coordinates are valid
    if (isNaN(this.gatherX) || isNaN(this.gatherY)) {
      console.log(`Invalid gather coordinates for unit: ${this.gatherX}, ${this.gatherY}`);
      return;
    }
    
    // Check if we need to move to gather point
    const dx = this.gatherX - this.x;
    const dy = this.gatherY - this.y;
    const distSq = dx*dx + dy*dy;
    
    // Debug log occasionally
    if (!this._moveCounter) this._moveCounter = 0;
    this._moveCounter++;
    
    if (this._moveCounter % 60 === 0) {
      console.log(`Soldier ${this.indexInGroup} movement:`, {
        position: {x: this.x, y: this.y},
        target: {x: this.gatherX, y: this.gatherY},
        distance: Math.sqrt(distSq),
        speed: this.speed
      });
    }
    
    // Move if we're more than 2 units away from gather point
    if (distSq > 4) {
      // Direct movement calculation
      const dist = Math.sqrt(distSq);
      const moveStep = this.speed * deltaSec;
      
      const oldX = this.x;
      const oldY = this.y;
      
      if (moveStep >= dist) {
        this.x = this.gatherX;
        this.y = this.gatherY;
      } else {
        this.x += (dx / dist) * moveStep;
        this.y += (dy / dist) * moveStep;
      }
      
      // Log if significant movement happened
      const movedDistance = Math.sqrt(Math.pow(this.x - oldX, 2) + Math.pow(this.y - oldY, 2));
      if (movedDistance > 1) {
        console.log(`Soldier ${this.indexInGroup || 0} moved ${movedDistance.toFixed(2)} units`);
      }
    } else if (distSq > 0 && distSq <= 4) {
      // Snap to exact gather point when very close
      this.x = this.gatherX;
      this.y = this.gatherY;
      
      // Reset target display once we've reached destination
      this.showTarget = false;
    }
  }

  handleDeath() {
    this.dead=true;
    this.hp=0;
    this.respawnTimer=this.respawnTime;
    this.freeEnemy();
  }

  drawTarget(ctx) {
    if (this.showTarget && this.targetX !== undefined && this.targetY !== undefined) {
      // Draw target indicator
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      
      // Draw line from soldier to target
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

  draw(ctx) {
    // Draw target indicator first so it appears behind the soldier
    this.drawTarget(ctx);
    
    // Then draw the soldier itself
    super.drawMeleeActor(ctx, false);
  }
}

/**
 * For multiple units, we create a triangle/circular formation around the gather point.
 * Units are distributed evenly around a circle with the specified formation radius.
 * This creates a more natural and visually pleasing group layout.
 * 
 * @param {number} count - Number of units to position
 * @param {number} formationRadius - Radius of the formation (default: 15)
 * @returns {Array} Array of {x, y} offsets for each unit
 */
function computeUnitOffsets(count, formationRadius = 15) {
  // If only 1 unit, no offset needed
  if (count <= 1) return [{x: 0, y: 0}];
  
  // For 2 units, position them horizontally
  if (count === 2) {
    return [
      {x: -formationRadius, y: 0},
      {x: formationRadius, y: 0}
    ];
  }
  
  // For 3 or more units, create a triangle/circular formation
  const offsets = [];
  const angleStep = (2 * Math.PI) / count;
  
  for (let i = 0; i < count; i++) {
    // Calculate position on a circle, rotated so first unit is at the bottom
    const angle = i * angleStep - Math.PI/2;
    const x = Math.round(formationRadius * Math.cos(angle));
    const y = Math.round(formationRadius * Math.sin(angle));
    offsets.push({x, y});
  }
  
  return offsets;
}

/**
 * TowerUnitGroup for a Barracks tower: manages soldier units.
 */
export class TowerUnitGroup {
  constructor(game, x, y, soldierConfig, count=3, formationRadius=15){
    this.game = game;
    this.units = [];
    this.x = x;
    this.y = y;
    this.formationRadius = formationRadius;

    this.numUnits = count;
    
    // First calculate offsets for unit positioning
    this.offsets = computeUnitOffsets(count, formationRadius);
    
    // Create soldier units
    for(let i=0; i<count; i++){
      // Use offsets to position units initially spread out around the tower
      const offset = this.offsets[i];
      
      const sData = {
        ...soldierConfig,
        // Position each unit with its offset from the start
        x: x + offset.x,
        y: y + offset.y,
        groupSize: count,
        indexInGroup: i
      };
      const s = new Soldier(sData);
      gatherController.registerUnit(s);
      this.units.push(s);
    }

    // We'll store gatherX,gatherY for the tower. Each soldier's gather point
    // will be computed from that + offset. Then gatherController will move them.
    this.gatherX = x;
    this.gatherY = y;
    
    // Apply offsets right away
    this.applyOffsetsToUnits();
    
    // Log for debugging
    console.log(`Created TowerUnitGroup with ${count} units at (${x},${y})`);
    console.log(`Units initial positions:`, 
      this.units.map(u => ({ x: u.x, y: u.y, gatherX: u.gatherX, gatherY: u.gatherY })));
  }

  setRallyPoint(rx,ry){
    // Validate inputs
    if (isNaN(rx) || isNaN(ry)) {
      console.error(`Invalid rally point coordinates: (${rx}, ${ry})`);
      return;
    }
    
    this.gatherX = rx;
    this.gatherY = ry;
    
    console.log(`Setting rally point to (${rx}, ${ry})`);
    
    // Apply offsets to all units
    this.applyOffsetsToUnits();
    
    // Log updated gather points
    console.log("Updated unit gather points:", 
      this.units.map(u => ({ 
        index: u.indexInGroup,
        gatherX: u.gatherX, 
        gatherY: u.gatherY 
      }))
    );
    
    // CRITICAL FIX: Force significant movement toward the new gather points
    this.units.forEach(unit => {
      // Force direct movement with simulated time
      if (typeof unit.moveDirectlyToGatherPoint === 'function') {
        // Use a large delta to make a significant movement
        unit.moveDirectlyToGatherPoint(0.5);
      }
      
      // Also do a small direct nudge to ensure units start moving
      const dx = unit.gatherX - unit.x;
      const dy = unit.gatherY - unit.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > 0) {
        // Make a more significant movement (about 20% of the way there)
        unit.x += (dx / dist) * Math.min(dist * 0.2, 20);
        unit.y += (dy / dist) * Math.min(dist * 0.2, 20);
        
        console.log(`Unit ${unit.indexInGroup} nudged toward gather point:`, {
          newPosition: {x: unit.x, y: unit.y},
          gatherPoint: {x: unit.gatherX, y: unit.gatherY},
          remainingDistance: Math.sqrt(Math.pow(unit.gatherX - unit.x, 2) + Math.pow(unit.gatherY - unit.y, 2))
        });
      }
    });
  }

  applyOffsetsToUnits(){
    // For each soldier, position them in a triangular/circular formation around the gather point
    // using the x,y offsets calculated by computeUnitOffsets
    for(const soldier of this.units){
      const i = soldier.indexInGroup;
      const offset = this.offsets[i];
      
      // Apply both x and y offsets for the triangular formation
      gatherController.setGatherPoint(
        soldier, 
        this.gatherX + offset.x, 
        this.gatherY + offset.y
      );
      
      // Set target indicator properties for visualization
      soldier.targetX = this.gatherX + offset.x;
      soldier.targetY = this.gatherY + offset.y;
      soldier.showTarget = true;
    }
  }

  update(deltaSec){
    this.units.forEach(u=>u.update(deltaSec,this.game));
  }

  draw(ctx){
    // Draw the units (draw method now handles target drawing internally)
    this.units.forEach(u => u.draw(ctx));
  }
}
