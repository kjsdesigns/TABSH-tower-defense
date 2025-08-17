/**
 * Unit tests for MovementSystem
 */

import { MovementSystem } from '../../js/core/MovementSystem.js';

// Mock entity for testing
class MockEntity {
  constructor(x = 0, y = 0, name = 'test') {
    this.x = x;
    this.y = y;
    this.name = name;
    this.speed = 100;
    this.dead = false;
    this.isEngaged = false;
  }
}

describe('MovementSystem', () => {
  let movementSystem;
  let entity;

  beforeEach(() => {
    movementSystem = new MovementSystem();
    entity = new MockEntity(0, 0, 'testEntity');
  });

  afterEach(() => {
    movementSystem.clear();
  });

  describe('Entity Registration', () => {
    test('should register entity successfully', () => {
      movementSystem.registerEntity(entity);
      expect(movementSystem.entities.has(entity)).toBe(true);
    });

    test('should throw error for invalid entity', () => {
      expect(() => {
        movementSystem.registerEntity({ invalid: true });
      }).toThrow('Entity must have valid x and y coordinates');
    });

    test('should unregister entity successfully', () => {
      movementSystem.registerEntity(entity);
      movementSystem.unregisterEntity(entity);
      expect(movementSystem.entities.has(entity)).toBe(false);
    });
  });

  describe('Movement Targeting', () => {
    beforeEach(() => {
      movementSystem.registerEntity(entity);
    });

    test('should set movement target', () => {
      movementSystem.setTarget(entity, 100, 100);
      const target = movementSystem.getTarget(entity);
      
      expect(target.x).toBe(100);
      expect(target.y).toBe(100);
      expect(target.isMoving).toBe(true);
    });

    test('should respect movement priority', () => {
      // Set low priority target
      movementSystem.setTarget(entity, 50, 50, { priority: 1 });
      
      // Try to override with lower priority (should fail)
      movementSystem.setTarget(entity, 100, 100, { priority: 0 });
      
      const target = movementSystem.getTarget(entity);
      expect(target.x).toBe(50);
      expect(target.y).toBe(50);
    });

    test('should allow higher priority to override', () => {
      // Set low priority target
      movementSystem.setTarget(entity, 50, 50, { priority: 1 });
      
      // Override with higher priority
      movementSystem.setTarget(entity, 100, 100, { priority: 2 });
      
      const target = movementSystem.getTarget(entity);
      expect(target.x).toBe(100);
      expect(target.y).toBe(100);
    });

    test('should stop movement', () => {
      movementSystem.setTarget(entity, 100, 100);
      movementSystem.stopMovement(entity);
      
      expect(movementSystem.isMoving(entity)).toBe(false);
    });
  });

  describe('Movement Updates', () => {
    beforeEach(() => {
      movementSystem.registerEntity(entity);
    });

    test('should move entity toward target', () => {
      movementSystem.setTarget(entity, 100, 0);
      movementSystem.update(0.1); // 0.1 seconds
      
      expect(entity.x).toBeGreaterThan(0);
      expect(entity.x).toBeLessThan(100);
      expect(entity.y).toBe(0);
    });

    test('should reach target exactly', () => {
      entity.x = 95;
      entity.y = 0;
      movementSystem.setTarget(entity, 100, 0);
      movementSystem.update(1.0); // Long enough to reach
      
      expect(entity.x).toBe(100);
      expect(entity.y).toBe(0);
      expect(movementSystem.isMoving(entity)).toBe(false);
    });

    test('should not move dead entities', () => {
      entity.dead = true;
      movementSystem.setTarget(entity, 100, 100);
      movementSystem.update(0.1);
      
      expect(entity.x).toBe(0);
      expect(entity.y).toBe(0);
    });

    test('should not move engaged entities', () => {
      entity.isEngaged = true;
      movementSystem.setTarget(entity, 100, 100);
      movementSystem.update(0.1);
      
      expect(entity.x).toBe(0);
      expect(entity.y).toBe(0);
    });
  });

  describe('System State', () => {
    test('should provide status information', () => {
      movementSystem.registerEntity(entity);
      movementSystem.setTarget(entity, 100, 100);
      
      const status = movementSystem.getStatus();
      expect(status).toHaveLength(1);
      expect(status[0].name).toBe('testEntity');
      expect(status[0].isMoving).toBe(true);
    });

    test('should clear all entities', () => {
      movementSystem.registerEntity(entity);
      movementSystem.registerEntity(new MockEntity(10, 10, 'entity2'));
      
      movementSystem.clear();
      expect(movementSystem.entities.size).toBe(0);
    });
  });
});