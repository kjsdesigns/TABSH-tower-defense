/**
 * MeleeCombatSystem.js
 * 
 * Kingdom Rush-style melee unit engagement system.
 * Handles proper enemy detection, engagement, and return-to-gather behavior.
 */

import { movementSystem } from "./MovementSystem.js";

export class MeleeCombatSystem {
  constructor() {
    this.meleeUnits = new Set();
    this.engagementRange = 40; // Range to detect enemies
    this.attackRange = 25; // Range to actually attack
  }

  /**
   * Register a melee unit for combat management
   */
  registerMeleeUnit(unit) {
    this.meleeUnits.add(unit);
    
    // Ensure unit has required properties
    if (!unit.gatherX) unit.gatherX = unit.x;
    if (!unit.gatherY) unit.gatherY = unit.y;
    if (!unit.engagementRange) unit.engagementRange = this.engagementRange;
    if (!unit.attackRange) unit.attackRange = this.attackRange;
  }

  /**
   * Unregister a melee unit
   */
  unregisterMeleeUnit(unit) {
    this.meleeUnits.delete(unit);
  }

  /**
   * Update all melee units - Kingdom Rush style behavior
   */
  update(deltaSec, game) {
    for (const unit of this.meleeUnits) {
      if (unit.dead) continue;
      
      this.updateMeleeUnit(unit, deltaSec, game);
    }
  }

  /**
   * Update individual melee unit behavior
   */
  updateMeleeUnit(unit, deltaSec, game) {
    // Kingdom Rush behavior:
    // 1. If not engaged, stay at gather point and scan for enemies
    // 2. If enemy in engagement range, move to engage
    // 3. Fight until enemy dies, then look for next enemy
    // 4. If no enemies in range, return to gather point

    if (!unit.isEngaged) {
      // Scan for enemies in engagement range
      const nearbyEnemy = this.findNearestEnemyInRange(unit, game.enemies, unit.engagementRange);
      
      if (nearbyEnemy) {
        this.engageEnemy(unit, nearbyEnemy);
      } else {
        // Stay at gather point
        this.returnToGatherPoint(unit);
      }
    } else {
      // Currently engaged - continue combat or find new target
      if (!unit.engagedEnemy || unit.engagedEnemy.dead) {
        // Current enemy is gone, look for new one
        this.disengageUnit(unit);
        
        const nextEnemy = this.findNearestEnemyInRange(unit, game.enemies, unit.engagementRange);
        if (nextEnemy) {
          this.engageEnemy(unit, nextEnemy);
        } else {
          this.returnToGatherPoint(unit);
        }
      } else {
        // Continue fighting current enemy
        this.handleCombat(unit, deltaSec);
      }
    }
  }

  /**
   * Find nearest enemy within range
   */
  findNearestEnemyInRange(unit, enemies, range) {
    let nearest = null;
    let nearestDist = range;

    for (const enemy of enemies) {
      if (enemy.dead || enemy.isEngaged) continue;

      const dx = enemy.x - unit.x;
      const dy = enemy.y - unit.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    }

    return nearest;
  }

  /**
   * Engage an enemy
   */
  engageEnemy(unit, enemy) {
    console.log(`${unit.name} engaging ${enemy.name || 'enemy'}`);
    
    unit.isEngaged = true;
    unit.engagedEnemy = enemy;
    enemy.isEngaged = true;
    enemy.engagedBy = unit;

    // Move to attack the enemy
    movementSystem.setTarget(unit, enemy.x, enemy.y, {
      type: 'combat',
      priority: 10, // High priority for combat
      stopDistance: unit.attackRange || this.attackRange
    });
  }

  /**
   * Disengage from current enemy
   */
  disengageUnit(unit) {
    if (unit.engagedEnemy) {
      unit.engagedEnemy.isEngaged = false;
      unit.engagedEnemy.engagedBy = null;
    }
    
    unit.isEngaged = false;
    unit.engagedEnemy = null;
  }

  /**
   * Return unit to gather point
   */
  returnToGatherPoint(unit) {
    const dx = unit.gatherX - unit.x;
    const dy = unit.gatherY - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Only move if not already at gather point
    if (dist > 5) {
      movementSystem.setTarget(unit, unit.gatherX, unit.gatherY, {
        type: 'gather',
        priority: 1,
        stopDistance: 3
      });
    }
  }

  /**
   * Handle combat between unit and enemy
   */
  handleCombat(unit, deltaSec) {
    const enemy = unit.engagedEnemy;
    if (!enemy || enemy.dead) return;

    // Check if still in attack range
    const dx = enemy.x - unit.x;
    const dy = enemy.y - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > unit.attackRange) {
      // Move closer to enemy
      movementSystem.setTarget(unit, enemy.x, enemy.y, {
        type: 'combat',
        priority: 10,
        stopDistance: unit.attackRange
      });
      return;
    }

    // In attack range - handle combat
    if (!unit.attackCooldown) unit.attackCooldown = 0;
    unit.attackCooldown -= deltaSec;

    if (unit.attackCooldown <= 0) {
      // Attack!
      unit.attackCooldown = unit.attackInterval || 1.0;
      
      const damage = unit.damage || 10;
      enemy.hp -= damage;
      
      console.log(`${unit.name} attacks for ${damage} damage, enemy HP: ${enemy.hp}`);

      if (enemy.hp <= 0) {
        enemy.dead = true;
        this.disengageUnit(unit);
        
        // Award gold for kill
        if (unit.game && unit.game.gameState) {
          unit.game.gameState.addGold(10);
        }
      }
    }

    // Enemy counter-attack
    if (!enemy.dead && enemy.damage) {
      if (!enemy.attackCooldown) enemy.attackCooldown = 0;
      enemy.attackCooldown -= deltaSec;

      if (enemy.attackCooldown <= 0) {
        enemy.attackCooldown = enemy.attackInterval || 1.5;
        
        unit.hp -= enemy.damage;
        console.log(`Enemy counter-attacks for ${enemy.damage} damage, unit HP: ${unit.hp}`);

        if (unit.hp <= 0) {
          unit.dead = true;
          this.disengageUnit(unit);
        }
      }
    }
  }

  /**
   * Set gather point for a unit
   */
  setGatherPoint(unit, x, y) {
    unit.gatherX = x;
    unit.gatherY = y;
    
    // If not engaged, immediately move to new gather point
    if (!unit.isEngaged) {
      this.returnToGatherPoint(unit);
    }
  }

  /**
   * Get combat statistics for debugging
   */
  getStats() {
    let engaged = 0;
    let atGatherPoint = 0;
    let moving = 0;

    for (const unit of this.meleeUnits) {
      if (unit.dead) continue;
      
      if (unit.isEngaged) {
        engaged++;
      } else {
        const dx = unit.gatherX - unit.x;
        const dy = unit.gatherY - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= 5) {
          atGatherPoint++;
        } else {
          moving++;
        }
      }
    }

    return {
      totalUnits: this.meleeUnits.size,
      engaged,
      atGatherPoint,
      moving
    };
  }
}

// Create singleton instance
export const meleeCombatSystem = new MeleeCombatSystem();

// Make globally accessible for debugging
window.meleeCombatSystem = meleeCombatSystem;