/**
 * Unit tests for GameState
 */

import { GameState } from '../../js/core/GameState.js';

describe('GameState', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  describe('State Management', () => {
    test('should initialize with default values', () => {
      expect(gameState.get('gameStarted')).toBe(false);
      expect(gameState.get('gold')).toBe(1000);
      expect(gameState.get('lives')).toBe(20);
      expect(gameState.get('gameSpeed')).toBe(1.0);
    });

    test('should update single state value', () => {
      gameState.set('gold', 500);
      expect(gameState.get('gold')).toBe(500);
    });

    test('should update multiple state values atomically', () => {
      gameState.update({
        gold: 800,
        lives: 15,
        gameSpeed: 2.0
      });
      
      expect(gameState.get('gold')).toBe(800);
      expect(gameState.get('lives')).toBe(15);
      expect(gameState.get('gameSpeed')).toBe(2.0);
    });

    test('should emit change events', (done) => {
      gameState.on('goldChanged', (data) => {
        expect(data.oldValue).toBe(1000);
        expect(data.newValue).toBe(750);
        done();
      });
      
      gameState.set('gold', 750);
    });
  });

  describe('State Validation', () => {
    test('should reject negative gold', () => {
      expect(() => {
        gameState.set('gold', -100);
      }).toThrow('Gold must be a non-negative number');
    });

    test('should reject invalid lives', () => {
      expect(() => {
        gameState.set('lives', 25); // More than maxLives
      }).toThrow();
    });

    test('should reject invalid game speed', () => {
      expect(() => {
        gameState.set('gameSpeed', 0);
      }).toThrow('Game speed must be a positive number');
    });
  });

  describe('Game Flow', () => {
    test('should start game correctly', () => {
      gameState.startGame();
      
      expect(gameState.get('gameStarted')).toBe(true);
      expect(gameState.get('paused')).toBe(false);
      expect(gameState.get('gameOver')).toBe(false);
    });

    test('should toggle pause', () => {
      gameState.startGame();
      gameState.togglePause();
      
      expect(gameState.get('paused')).toBe(true);
      
      gameState.togglePause();
      expect(gameState.get('paused')).toBe(false);
    });

    test('should end game and emit event', (done) => {
      gameState.on('gameEnded', (data) => {
        expect(data.won).toBe(true);
        expect(gameState.get('gameOver')).toBe(true);
        expect(gameState.get('gameStarted')).toBe(false);
        done();
      });
      
      gameState.endGame(true);
    });

    test('should cycle game speed', () => {
      const initialSpeed = gameState.get('gameSpeed');
      gameState.cycleSpeed();
      
      expect(gameState.get('gameSpeed')).not.toBe(initialSpeed);
    });
  });

  describe('Resource Management', () => {
    test('should spend gold correctly', () => {
      gameState.spendGold(200);
      expect(gameState.get('gold')).toBe(800);
    });

    test('should reject spending more gold than available', () => {
      expect(() => {
        gameState.spendGold(1500);
      }).toThrow('Insufficient gold');
    });

    test('should add gold correctly', () => {
      gameState.addGold(300);
      expect(gameState.get('gold')).toBe(1300);
    });

    test('should lose life and end game at zero', (done) => {
      gameState.update({ lives: 1 });
      
      gameState.on('gameEnded', (data) => {
        expect(data.won).toBe(false);
        done();
      });
      
      gameState.loseLife();
    });
  });

  describe('State Persistence', () => {
    test('should export state', () => {
      gameState.set('gold', 750);
      const exported = gameState.export();
      
      expect(exported.state.gold).toBe(750);
      expect(exported.timestamp).toBeDefined();
    });

    test('should import state', () => {
      const stateData = {
        state: { gold: 500, lives: 10 },
        timestamp: Date.now()
      };
      
      gameState.import(stateData);
      
      expect(gameState.get('gold')).toBe(500);
      expect(gameState.get('lives')).toBe(10);
    });

    test('should reject invalid import data', () => {
      expect(() => {
        gameState.import({ invalid: true });
      }).toThrow('Invalid state data');
    });
  });

  describe('State History', () => {
    test('should track state changes', () => {
      gameState.set('gold', 800);
      gameState.set('lives', 15);
      
      const history = gameState.getHistory();
      expect(history.length).toBe(2);
      expect(history[0].key).toBe('gold');
      expect(history[1].key).toBe('lives');
    });
  });

  describe('State Validation', () => {
    test('should validate current state', () => {
      // Set invalid state manually to test validation
      gameState.state.gold = -100;
      
      const errors = gameState.validate();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Gold must be a non-negative number');
    });
  });
});