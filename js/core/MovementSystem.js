/**
 * MovementSystem.js
 * 
 * Unified movement system for all game entities.
 * Eliminates conflicts between gatherController and direct movement.
 * Provides centralized, predictable movement with proper state management.
 */

export class MovementSystem {
  constructor() {
    this.entities = new Map();
    this.debug = false;
  }

  /**
   * Register an entity for movement management
   * @param {Object} entity - Entity with x, y, speed properties
   * @param {Object} options - Movement options
   */
  registerEntity(entity, options = {}) {
    if (!entity || typeof entity.x !== 'number' || typeof entity.y !== 'number') {
      throw new Error('Entity must have valid x and y coordinates');
    }

    const movementData = {
      entity,
      targetX: entity.x,
      targetY: entity.y,
      speed: options.speed || entity.speed || 80,
      stopDistance: options.stopDistance || 2,
      isMoving: false,
      movementType: options.type || 'gather', // 'gather', 'engage', 'patrol'
      priority: options.priority || 0, // Higher priority overrides lower
      callback: options.onReachTarget || null
    };

    this.entities.set(entity, movementData);
    
    if (this.debug) {
      console.log(`MovementSystem: Registered ${entity.name || 'entity'} at (${entity.x}, ${entity.y})`);
    }
  }

  /**
   * Unregister an entity from movement management
   */
  unregisterEntity(entity) {
    this.entities.delete(entity);
    if (this.debug) {
      console.log(`MovementSystem: Unregistered ${entity.name || 'entity'}`);
    }
  }

  /**
   * Set movement target for an entity
   * @param {Object} entity - The entity to move
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   * @param {Object} options - Movement options
   */
  setTarget(entity, x, y, options = {}) {
    const movementData = this.entities.get(entity);
    if (!movementData) {
      console.warn(`MovementSystem: Entity not registered for movement`);
      return;
    }

    // Only allow movement override if new priority is higher or equal
    const newPriority = options.priority || 0;
    if (newPriority < movementData.priority && movementData.isMoving) {
      if (this.debug) {
        console.log(`MovementSystem: Movement blocked - priority ${newPriority} < ${movementData.priority}`);
      }
      return;
    }

    movementData.targetX = x;
    movementData.targetY = y;
    movementData.priority = newPriority;
    movementData.movementType = options.type || movementData.movementType;
    movementData.callback = options.onReachTarget || null;
    movementData.isMoving = true;

    if (this.debug) {
      console.log(`MovementSystem: ${entity.name || 'entity'} moving to (${x}, ${y}) with priority ${newPriority}`);
    }
  }

  /**
   * Stop movement for an entity
   */
  stopMovement(entity, resetPriority = true) {
    const movementData = this.entities.get(entity);
    if (!movementData) return;

    movementData.isMoving = false;
    if (resetPriority) {
      movementData.priority = 0;
    }

    if (this.debug) {
      console.log(`MovementSystem: Stopped movement for ${entity.name || 'entity'}`);
    }
  }

  /**
   * Check if entity is currently moving
   */
  isMoving(entity) {
    const movementData = this.entities.get(entity);
    return movementData ? movementData.isMoving : false;
  }

  /**
   * Get current movement target
   */
  getTarget(entity) {
    const movementData = this.entities.get(entity);
    if (!movementData) return null;
    
    return {
      x: movementData.targetX,
      y: movementData.targetY,
      isMoving: movementData.isMoving
    };
  }

  /**
   * Update movement for all entities
   * @param {number} deltaSec - Time delta in seconds
   */
  update(deltaSec) {
    for (const [entity, movementData] of this.entities) {
      if (!movementData.isMoving) continue;
      if (entity.dead || entity.isEngaged) {
        // Don't move dead or engaged entities
        continue;
      }

      const dx = movementData.targetX - entity.x;
      const dy = movementData.targetY - entity.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= movementData.stopDistance) {
        // Reached target
        entity.x = movementData.targetX;
        entity.y = movementData.targetY;
        movementData.isMoving = false;
        movementData.priority = 0;

        if (movementData.callback) {
          movementData.callback(entity);
        }

        if (this.debug) {
          console.log(`MovementSystem: ${entity.name || 'entity'} reached target (${entity.x}, ${entity.y})`);
        }
      } else {
        // Move toward target
        const step = movementData.speed * deltaSec;
        if (step >= distance) {
          entity.x = movementData.targetX;
          entity.y = movementData.targetY;
        } else {
          entity.x += (dx / distance) * step;
          entity.y += (dy / distance) * step;
        }
      }
    }
  }

  /**
   * Get movement status for debugging
   */
  getStatus() {
    const status = [];
    for (const [entity, movementData] of this.entities) {
      status.push({
        name: entity.name || 'unnamed',
        position: { x: entity.x, y: entity.y },
        target: { x: movementData.targetX, y: movementData.targetY },
        isMoving: movementData.isMoving,
        priority: movementData.priority,
        type: movementData.movementType
      });
    }
    return status;
  }

  /**
   * Enable/disable debug logging
   */
  setDebug(enabled) {
    this.debug = enabled;
  }

  /**
   * Clear all entities (for testing/cleanup)
   */
  clear() {
    this.entities.clear();
  }
}

// Create singleton instance
export const movementSystem = new MovementSystem();

// Make globally accessible for debugging
window.movementSystem = movementSystem;