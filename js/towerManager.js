import { TowerUnitGroup } from "./unitManager.js";
import { pointTowerConfig } from "../config/towers/pointTower.js";
import { splashTowerConfig } from "../config/towers/splashTower.js";
import { barracksTowerConfig } from "../config/towers/barracksTower.js";
import { validateRequiredConfig } from "./utils/configValidator.js";

export class TowerManager {
  constructor(game) {
    this.game = game;
    this.towers = [];

    this.towerTypes = [
      pointTowerConfig,
      splashTowerConfig,
      barracksTowerConfig
    ];
  }

  getTowerData() {
    return this.towerTypes;
  }

  findTowerConfigByName(name) {
    return this.towerTypes.find(t => t.name === name);
  }

  createTower(towerTypeName) {
    const def = this.findTowerConfigByName(towerTypeName);
    if (!def) {
      console.warn("[TowerManager] Unknown tower type:", towerTypeName);
      return null;
    }
    validateRequiredConfig("tower", def, towerTypeName);

    const tower = {
      type: def.name,
      level: 1,
      range: def.range || 0,
      damage: Array.isArray(def.damage) ? def.damage[0] : (def.damage || 0),
      splashRadius: def.splashRadius,
      fireRate: def.attackRate,
      fireCooldown: 0,
      upgradeCost: Array.isArray(def.cost) ? (def.cost[1] || 0) : 0,
      maxLevel: (def.cost && def.cost.length) || 1,
      x: 0,
      y: 0,
      spot: null,
      goldSpent: Array.isArray(def.cost) ? def.cost[0] : (def.cost || 80),

      fireSound: def.fireSound || null,
      hitSound: def.hitSound || null,

      towerImage: def.towerImage || null,
      projectileImage: def.projectileImage || null,

      unitGroup: null
    };

    return tower;
  }

  initializeTower(tower) {
    // If it's a barracks tower, create soldier group
    if (tower.type === "barracks tower") {
      this.createBarracksUnits(tower);
    }
  }

  update(deltaSec) {
    if (this.game.gameOver) return;
    this.towers.forEach(tower => {
      if (tower.type === "barracks tower") {
        if (tower.unitGroup) tower.unitGroup.update(deltaSec);
        return;
      }
      tower.fireCooldown -= deltaSec;
      if (tower.fireCooldown <= 0) {
        this.fireTower(tower);
        tower.fireCooldown = tower.fireRate;
      }
    });
  }

  fireTower(tower) {
    const enemiesInRange = this.game.enemies.filter(e => {
      const ex = e.x + (e.width ? e.width/2 : 0);
      const ey = e.y + (e.height? e.height/2: 0);
      const dx = ex - tower.x;
      const dy = ey - tower.y;
      return (dx*dx + dy*dy) <= (tower.range*tower.range);
    });
    if (!enemiesInRange.length) return;
    const target = enemiesInRange[0];
    const ex = target.x + (target.width? target.width/2:0);
    const ey = target.y + (target.height?target.height/2:0);

    this.game.projectileManager.spawnProjectile({
      x: tower.x,
      y: tower.y,
      speed: 300,
      damage: tower.damage,
      splashRadius: tower.splashRadius,
      mainTarget: target,
      targetX: ex,
      targetY: ey
    });
  }

  upgradeTower(tower) {
    const def = this.findTowerConfigByName(tower.type);
    if (!def) return;
    const nextLvl = tower.level + 1;
    if (nextLvl > (def.cost?.length||1)) {
      return;
    }
    const nextCost = def.cost[nextLvl - 1] || 9999;
    if (this.game.gold < nextCost) return;

    this.game.gold -= nextCost;
    tower.goldSpent += nextCost;
    tower.level = nextLvl;
    if (Array.isArray(def.damage) && def.damage[tower.level-1]!=null) {
      tower.damage = def.damage[tower.level-1];
    }
    tower.upgradeCost = def.cost[tower.level]||0;
  }

  sellTower(tower) {
    const refund = Math.floor(tower.goldSpent*0.8);
    this.game.gold += refund;
    this.towers = this.towers.filter(t=>t!==tower);
    if(tower.spot) {
      tower.spot.occupied=false;
    }
  }

  drawTowers(ctx) {
    this.towers.forEach(tower=> {
      this.drawSingleTower(ctx,tower);
      if(tower.unitGroup) tower.unitGroup.draw(ctx);
    });
  }

  drawSingleTower(ctx, tower) {
    if(tower.towerImage) {
      ctx.fillStyle="gray";
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 24 + tower.level*4, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle="#fff";
      ctx.stroke();
    } else {
      ctx.fillStyle="darkblue";
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 24 + tower.level*4, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle="#fff";
      ctx.stroke();
    }
    if(this.game.debugMode){
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range,0,Math.PI*2);
      ctx.strokeStyle="rgba(255,255,255,0.3)";
      ctx.stroke();
    }
  }

  createBarracksUnits(tower) {
    const def = this.findTowerConfigByName(tower.type);
    if(!def)return;
    
    console.log('Creating barracks units for tower:', tower.type);
    
    // soldier stats
    const soldierConfig = {
      hp: def.soldierHp||50,
      damage: def.soldierDmg||10,
      speed: 50,
      attackInterval: def.attackRate||1.2,
      numUnits: def.numUnits||3
    };
    
    try {
      tower.unitGroup = new TowerUnitGroup(tower, soldierConfig);
      console.log('Successfully created unit group with', soldierConfig.numUnits, 'soldiers');
      
      // Set default gather point near the tower initially
      tower.unitGroup.setDefaultGatherPoint();
      
      // Then find optimal gather point near enemy paths
      const paths = (this.game.levelData && this.game.levelData.paths) || [];
      if (paths.length > 0) {
        const rallyPt = this.getClosestPointOnPaths(tower.x, tower.y, paths);
        console.log("[TowerManager] Setting rally point =>", rallyPt);
        tower.unitGroup.setGatherPoint(rallyPt.x, rallyPt.y);
      }
      
    } catch (error) {
      console.error('Error creating barracks units:', error);
      return;
    }
  }

  getClosestPointOnPaths(towerX, towerY, paths){
    let bestPt = {x:towerX, y:towerY};
    let bestDist = Infinity;
    for(const path of paths){
      for(let i=0;i<path.length-1;i++){
        const p1=path[i];
        const p2=path[i+1];
        const candidate=this.getClosestPointOnSegment(towerX,towerY,p1,p2);
        const dx=candidate.x-towerX;
        const dy=candidate.y-towerY;
        const dist = dx*dx+dy*dy;
        if(dist<bestDist){
          bestDist=dist;
          bestPt=candidate;
        }
      }
    }
    return bestPt;
  }

  getClosestPointOnSegment(px,py,p1,p2){
    const vx=p2.x-p1.x;
    const vy=p2.y-p1.y;
    const wx=px-p1.x;
    const wy=py-p1.y;
    const dot= vx*vx + vy*vy;
    if(dot===0)return {x:p1.x, y:p1.y};
    const proj=(wx*vx+wy*vy)/dot;
    if(proj<=0) return {x:p1.x,y:p1.y};
    else if(proj>=1)return {x:p2.x,y:p2.y};
    else {
      return {x:p1.x+proj*vx, y:p1.y+proj*vy};
    }
  }

  /**
   * Create units for a tower (called by GameplayCore)
   */
  createUnitsForTower(tower) {
    if (tower.type === 'barracks tower') {
      console.log('Creating units for barracks tower');
      this.createBarracksUnits(tower);
    }
  }
}
