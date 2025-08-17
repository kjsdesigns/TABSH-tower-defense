import { drawHealthBar } from "./utils/drawHelper.js";
import { moveEntityToward } from "./utils/moveHelper.js";
import { validateRequiredConfig } from "./utils/configValidator.js";

// Import from config files
import { droneConfig }        from "../config/enemies/drone.js";
import { leafBlowerConfig }   from "../config/enemies/leafBlower.js";
import { trenchDiggerConfig } from "../config/enemies/trenchDigger.js";
import { trenchWalkerConfig } from "../config/enemies/trenchWalker.js";

/**
 * We'll build an in-memory enemyBaseData object by mapping type => config.
 * If you want a dynamic approach, you could dynamically load the entire folder,
 * but for now, we do explicit imports.
 */
const enemyConfigs = {
  "drone":         droneConfig,
  "leaf_blower":   leafBlowerConfig,
  "trench_digger": trenchDiggerConfig,
  "trench_walker": trenchWalkerConfig,
};

export class EnemyManager {
  constructor(game) {
    this.game = game;

    // This is now just a reference to the imported objects:
    this.enemyBaseData = enemyConfigs;

    this.loadedEnemyAssets = [];
  }

  setLoadedEnemyAssets(loadedEnemies) {
    this.loadedEnemyAssets = loadedEnemies;
  }

  spawnEnemy(type, hpMultiplier = 1, pathIndex = 0) {
    // 1) Pull config by type
    const baseData = this.enemyBaseData[type] || this.enemyBaseData["drone"];
    if (!baseData) {
      console.warn("[EnemyManager] No config found for type:", type);
      return;
    }

    // 2) Validate required fields
    //    If something is missing (like baseHp, baseSpeed, etc.), throw a helpful error
    validateRequiredConfig("enemy", baseData, type);

    // 3) Find loaded asset (image), fallback to first if none
    const asset = this.loadedEnemyAssets.find(e => e.name === type)
      || this.loadedEnemyAssets[0];

    const finalHp = baseData.baseHp * 0.8 * hpMultiplier * this.game.globalEnemyHpMultiplier;
    const speedFactor = 0.8 + Math.random() * 0.4;
    const finalSpeed = baseData.baseSpeed * speedFactor;

    let chosenPath = [];
    if (Array.isArray(this.game.levelData.paths) && this.game.levelData.paths.length > 0) {
      chosenPath = this.game.levelData.paths[pathIndex] || this.game.levelData.paths[0];
    } else {
      console.warn("[EnemyManager] No valid paths => cannot spawn properly.");
      return;
    }
    if (!chosenPath.length) {
      console.warn(`[EnemyManager] Path index ${pathIndex} is empty; no spawn.`);
      return;
    }

    const firstWP = chosenPath[0];

    const enemy = {
      name: type,
      image: asset?.image, // might be null or undefined if we didn't load an image
      width: asset?.width,
      height: asset?.height,
      x: firstWP.x,
      y: firstWP.y,
      hp: finalHp,
      baseHp: finalHp,
      speed: finalSpeed,
      gold: baseData.gold || 0,
      dead: false,

      waypointIndex: 1,
      path: chosenPath,

      // For melee logic
      isEngaged: false,
      engagedBy: null,
      damage: baseData.damage,
      attackInterval: baseData.attackInterval,
      attackCooldown: 0,
    };
    this.game.enemies.push(enemy);
  }

  update(deltaSec) {
    this.game.enemies.forEach(e => {
      this.updateEnemy(e, deltaSec);
      if (e.hp <= 0) {
        this.game.gold += e.gold || 0;
        e.dead = true;
        if (this.game.uiManager && this.game.uiManager.selectedEnemy === e) {
          this.game.uiManager.selectedEnemy = null;
          this.game.uiManager.hideEnemyStats();
        }
      }
    });

    // Remove dead or off-screen
    this.game.enemies = this.game.enemies.filter(e => {
      if (e.dead) return false;
      if (e.x > this.game.width + e.width) {
        console.log('Enemy escaped - losing life');
        this.game.gameState.loseLife(); // This handles game over automatically
        return false;
      }
      return true;
    });
  }

  updateEnemy(enemy, deltaSec) {
    const path = enemy.path;
    if (!path || enemy.waypointIndex >= path.length) {
      // no next WP => move off-screen
      if (!enemy.isEngaged) {
        enemy.x += enemy.speed * deltaSec;
      }
      return;
    }

    if (enemy.isEngaged) {
      // skip path movement if engaged in melee
      return;
    }

    // follow path
    const nextWP = path[enemy.waypointIndex];
    moveEntityToward(enemy, nextWP.x, nextWP.y, enemy.speed, deltaSec, 0);
    const dx = nextWP.x - enemy.x;
    const dy = nextWP.y - enemy.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 1) {
      enemy.waypointIndex++;
    }
  }

  drawEnemy(ctx, enemy) {
    // If the loaded image is valid, draw it; otherwise draw a placeholder circle
    const canDrawImage = enemy.image && enemy.image.complete && enemy.image.naturalHeight !== 0;
    if (canDrawImage) {
      ctx.drawImage(
        enemy.image,
        enemy.x - enemy.width / 2,
        enemy.y - enemy.height / 2,
        enemy.width,
        enemy.height
      );
    } else {
      // Fallback placeholder: circle
      ctx.fillStyle = "purple"; 
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // HP bar
    if (enemy.hp < enemy.baseHp) {
      const barW = enemy.width || 20;
      const barH = 4;
      const offsetY = (enemy.height ? enemy.height / 2 : 10) + 6;
      drawHealthBar(ctx, enemy.x, enemy.y - offsetY, enemy.hp, enemy.baseHp, barW, barH);
    }
  }
}
