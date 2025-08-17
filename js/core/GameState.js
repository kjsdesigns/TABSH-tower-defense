/**
 * GameState.js
 * 
 * Centralized state management system for the game.
 * Provides predictable state updates, validation, and event handling.
 * Eliminates global window dependencies and provides type safety.
 */

export class GameState {
  constructor() {
    this.state = {
      // Game flow
      gameStarted: false,
      paused: false,
      gameOver: false,
      
      // Player resources
      gold: 1000,
      lives: 20,
      maxLives: 20,
      
      // Game settings
      gameSpeed: 1.0,
      speedIndex: 0,
      speedOptions: [1, 2, 4, 0.5],
      debugMode: false,
      
      // Current level
      currentLevel: null,
      levelData: null,
      backgroundImg: null,
      
      // Multipliers and difficulty
      globalEnemyHpMultiplier: 1.0,
      
      // UI state
      selectedHero: null,
      activeSlot: 1,
      
      // Audio settings
      musicEnabled: true,
      sfxEnabled: true,
      musicVolume: 1.0,
      sfxVolume: 1.0
    };
    
    this.listeners = new Map();
    this.validators = new Map();
    this.history = [];
    this.maxHistorySize = 50;
    
    this.setupValidators();
  }

  /**
   * Set up state validators
   */
  setupValidators() {
    this.validators.set('gold', (value) => {
      if (typeof value !== 'number' || value < 0) {
        throw new Error('Gold must be a non-negative number');
      }
    });

    this.validators.set('lives', (value) => {
      if (typeof value !== 'number' || value < 0 || value > this.state.maxLives) {
        throw new Error(`Lives must be between 0 and ${this.state.maxLives}`);
      }
    });

    this.validators.set('gameSpeed', (value) => {
      if (typeof value !== 'number' || value <= 0) {
        throw new Error('Game speed must be a positive number');
      }
    });

    this.validators.set('globalEnemyHpMultiplier', (value) => {
      if (typeof value !== 'number' || value <= 0) {
        throw new Error('Enemy HP multiplier must be a positive number');
      }
    });
  }

  /**
   * Get current state (immutable copy)
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Get specific state value
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Set state value with validation and event emission
   */
  set(key, value) {
    const oldValue = this.state[key];
    
    // Validate if validator exists
    const validator = this.validators.get(key);
    if (validator) {
      validator(value);
    }
    
    // Update state
    this.state[key] = value;
    
    // Add to history
    this.addToHistory(key, oldValue, value);
    
    // Emit change event
    this.emit('stateChange', { key, oldValue, newValue: value });
    this.emit(`${key}Changed`, { oldValue, newValue: value });
  }

  /**
   * Update multiple state values atomically
   */
  update(updates) {
    const oldState = { ...this.state };
    const changes = [];
    
    // Validate all updates first
    for (const [key, value] of Object.entries(updates)) {
      const validator = this.validators.get(key);
      if (validator) {
        validator(value);
      }
    }
    
    // Apply all updates
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = this.state[key];
      this.state[key] = value;
      changes.push({ key, oldValue, newValue: value });
    }
    
    // Add to history
    this.addToHistory('batch', oldState, { ...this.state });
    
    // Emit events
    this.emit('stateUpdate', { changes });
    for (const change of changes) {
      this.emit(`${change.key}Changed`, { 
        oldValue: change.oldValue, 
        newValue: change.newValue 
      });
    }
  }

  /**
   * Reset game state to initial values
   */
  resetGame() {
    const gameState = {
      gameStarted: false,
      paused: false,
      gameOver: false,
      gold: 1000,
      lives: this.state.maxLives,
      gameSpeed: 1.0,
      speedIndex: 0
    };
    
    this.update(gameState);
  }

  /**
   * Start the game
   */
  startGame() {
    if (this.state.gameStarted) {
      console.warn('Game is already started');
      return;
    }
    
    this.update({
      gameStarted: true,
      paused: false,
      gameOver: false
    });
  }

  /**
   * Pause/unpause the game
   */
  togglePause() {
    if (!this.state.gameStarted) {
      console.warn('Cannot pause - game not started');
      return;
    }
    
    this.set('paused', !this.state.paused);
  }

  /**
   * End the game (win or lose)
   */
  endGame(won = false) {
    this.update({
      gameOver: true,
      gameStarted: false,
      paused: false
    });
    
    this.emit('gameEnded', { won });
  }

  /**
   * Cycle game speed
   */
  cycleSpeed() {
    const nextIndex = (this.state.speedIndex + 1) % this.state.speedOptions.length;
    this.update({
      speedIndex: nextIndex,
      gameSpeed: this.state.speedOptions[nextIndex]
    });
  }

  /**
   * Spend gold
   */
  spendGold(amount) {
    if (this.state.gold < amount) {
      throw new Error(`Insufficient gold: need ${amount}, have ${this.state.gold}`);
    }
    
    this.set('gold', this.state.gold - amount);
  }

  /**
   * Add gold
   */
  addGold(amount) {
    this.set('gold', this.state.gold + amount);
  }

  /**
   * Lose a life
   */
  loseLife() {
    const newLives = Math.max(0, this.state.lives - 1);
    this.set('lives', newLives);
    
    if (newLives === 0) {
      this.endGame(false);
    }
  }

  /**
   * Set level data
   */
  setLevel(levelName, levelData, backgroundImg) {
    this.update({
      currentLevel: levelName,
      levelData: levelData,
      backgroundImg: backgroundImg
    });
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Add to state history
   */
  addToHistory(key, oldValue, newValue) {
    this.history.push({
      timestamp: Date.now(),
      key,
      oldValue,
      newValue
    });
    
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Get state history
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Validate current state
   */
  validate() {
    const errors = [];
    
    for (const [key, validator] of this.validators) {
      try {
        validator(this.state[key]);
      } catch (error) {
        errors.push(`${key}: ${error.message}`);
      }
    }
    
    return errors;
  }

  /**
   * Subscribe to all state changes (for debugging)
   */
  subscribeToAll(callback) {
    this.on('stateChange', callback);
  }

  /**
   * Export state for persistence
   */
  export() {
    return {
      state: this.getState(),
      timestamp: Date.now()
    };
  }

  /**
   * Import state from persistence
   */
  import(data) {
    if (!data || !data.state) {
      throw new Error('Invalid state data');
    }
    
    // Validate imported state
    for (const [key, value] of Object.entries(data.state)) {
      const validator = this.validators.get(key);
      if (validator) {
        validator(value);
      }
    }
    
    this.state = { ...this.state, ...data.state };
    this.emit('stateImported', data);
  }
}

// Create singleton instance
export const gameState = new GameState();

// Make globally accessible for debugging
window.gameState = gameState;