import { moveEntityToward } from "./moveHelper.js";
import { drawHealthBar } from "./drawHelper.js";

/**
 * MeleeActor.js
 * 
 * A simpler base class for hero/soldier units that engage in melee combat,
 * without any built-in "rally" logic. 
 * All "idle" or "gather" movements are handled externally by gatherController.
 */
export class MeleeActor {
  constructor(config) {
    this.name = config.name || "Unnamed";
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.radius = config.radius || 20;

    this.maxHp = config.maxHp || 100;
    this.hp = this.maxHp;
    this.damage = config.damage || 10;
    this.attackInterval = config.attackInterval || 1.0;
    this.attackCooldown = 0;

    this.isMelee = config.isMelee || false;
    this.speed = config.speed || 80;

    this.isEngaged = false;    // if locked in melee
    this.engagedEnemy = null;  // reference to the entity we are fighting
    this.dead = false;

    // We used to store rallyX/rallyY here, but now gatherController 
    // is responsible for setting "gather points" externally.
  }

  /**
   * updateMelee(deltaSec, game)
   * - Basic HP regen 
   * - If engaged, handle approach/fight
   * - If the engaged enemy died, free it.
   * - No rally movement; gatherController drives any idle movement.
   */
  updateMelee(deltaSec, game) {
    if (this.dead) return;

    // Simple HP regen
    if (this.hp < this.maxHp) {
      // For demonstration, we do a very light regen approach
      this.hp += (this.maxHp * 0.02 * deltaSec); 
      if (this.hp > this.maxHp) {
        this.hp = this.maxHp;
      }
    }

    // If engaged and the enemy is alive, approach/fight
    if (this.isEngaged && this.engagedEnemy && !this.engagedEnemy.dead) {
      this.handleApproachAndFight(deltaSec, game);
    } else {
      // If the engaged enemy is gone, free it
      if (this.isEngaged && (!this.engagedEnemy || this.engagedEnemy.dead)) {
        this.freeEnemy();
      }
      // Otherwise, do nothing: gatherController handles idle movement
    }
  }

  /**
   * handleApproachAndFight
   * - Move into adjacency range, exchange hits
   */
  handleApproachAndFight(deltaSec, game) {
    const dx = this.engagedEnemy.x - this.x;
    const dy = this.engagedEnemy.y - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // how close we must be to exchange hits
    const adjacency = 2; 
    if (dist > adjacency) {
      moveEntityToward(this, this.engagedEnemy.x, this.engagedEnemy.y, this.speed, deltaSec, adjacency);
    } else {
      // We can strike
      this.attackCooldown -= deltaSec;
      if (this.attackCooldown <= 0) {
        this.attackCooldown = this.attackInterval;
        this.engagedEnemy.hp -= this.damage;
        if (this.engagedEnemy.hp <= 0) {
          this.engagedEnemy.hp = 0;
          this.engagedEnemy.dead = true;
          this.freeEnemy();
          return;
        }
      }

      // Enemy hits back
      if (!this.engagedEnemy.dead) {
        if (!this.engagedEnemy.attackCooldown) {
          this.engagedEnemy.attackCooldown = this.engagedEnemy.attackInterval || 1.0;
        }
        this.engagedEnemy.attackCooldown -= deltaSec;
        if (this.engagedEnemy.attackCooldown <= 0) {
          this.engagedEnemy.attackCooldown = this.engagedEnemy.attackInterval;
          this.hp -= this.engagedEnemy.damage || 5;
          if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
            this.freeEnemy();
          }
        }
      }
    }
  }

  /**
   * freeEnemy
   * - Release the enemy from engagement
   */
  freeEnemy() {
    if (this.engagedEnemy) {
      this.engagedEnemy.isEngaged = false;
      this.engagedEnemy.engagedBy = null;
    }
    this.engagedEnemy = null;
    this.isEngaged = false;
  }

  /**
   * drawMeleeActor
   * - Simple circle + HP bar
   */
  drawMeleeActor(ctx, isSelected = false) {
    if (this.dead) {
      ctx.fillStyle = "gray";
    } else {
      ctx.fillStyle = "darkslateblue";
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // HP bar if not at max
    if (!this.dead && this.hp < this.maxHp) {
      const barW = this.radius * 2;
      const barH = 5;
      const offsetY = this.radius + 8;
      drawHealthBar(ctx, this.x, this.y - offsetY, this.hp, this.maxHp, barW, barH);
    }
  }
}
