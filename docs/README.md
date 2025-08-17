# TABSH Tower Defense Game

A comprehensive tower defense game built with vanilla JavaScript and ES6 modules, featuring advanced movement systems, state management, and comprehensive testing.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Game Features](#game-features)
- [Core Systems](#core-systems)
- [Development](#development)
- [Testing](#testing)
- [API Reference](#api-reference)

## Overview

TABSH is a tower defense game that emphasizes clean architecture, robust testing, and maintainable code. The game features multiple levels, hero units, various tower types, and a comprehensive editor system for creating custom content.

### Key Features

- **Multiple Levels**: 4 distinct levels with unique challenges
- **Hero System**: Controllable hero units with different abilities
- **Tower Variety**: Point, Splash, and Barracks towers
- **Enemy Diversity**: 6 different enemy types with unique behaviors
- **State Management**: Centralized game state with validation
- **Asset Management**: Robust asset loading with fallbacks
- **Movement System**: Unified movement system for all entities
- **Editor Tools**: Comprehensive editors for levels, enemies, towers, and heroes
- **Testing**: Extensive unit and integration tests
- **Error Handling**: Graceful error handling and recovery

## Architecture

The game follows a modular architecture with clear separation of concerns:

```
js/
├── core/                    # Core systems
│   ├── GameState.js        # Centralized state management
│   ├── MovementSystem.js   # Unified movement system
│   ├── AssetManager.js     # Asset loading and management
│   └── PlaceholderAssets.js # Fallback asset generation
├── managers/               # Game system managers
│   ├── enemyManager.js     # Enemy management
│   ├── towerManager.js     # Tower management
│   ├── heroManager.js      # Hero management
│   ├── waveManager.js      # Wave spawning
│   └── uiManager.js        # User interface
├── editors/                # Content creation tools
├── utils/                  # Utility functions
└── game.js                 # Main game class
```

### Core Principles

1. **Centralized State**: All game state is managed through the GameState system
2. **Unified Movement**: Single movement system handles all entity movement
3. **Asset Safety**: Graceful fallbacks for missing assets
4. **Error Tolerance**: Comprehensive error handling prevents crashes
5. **Testability**: All systems are designed to be easily testable

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:3000`

### Running Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run specific test file
npx playwright test tests/integration/game-flow.spec.js
```

## Game Features

### Hero System

Heroes are controllable units that can move around the battlefield and engage enemies.

**Hero Types:**
- **Melee Hero (Knight)**: High health, close combat
- **Archer Hero**: Ranged attacks, moderate health

**Hero Controls:**
- Click to move hero to location
- Heroes automatically engage nearby enemies
- Set rally points for strategic positioning

### Tower System

**Tower Types:**
1. **Point Tower**: Single-target, high damage
2. **Splash Tower**: Area-of-effect damage
3. **Barracks Tower**: Spawns soldier units

**Tower Management:**
- Click on tower spots to build
- Upgrade towers for increased effectiveness
- Set rally points for barracks units

### Enemy System

**Enemy Types:**
1. **Drone**: Fast, low health
2. **Leaf Blower**: Moderate stats
3. **Trench Digger**: Slow, high health
4. **Trench Walker**: Balanced stats
5. **Pizza Cooker**: Special abilities
6. **Spike Tail**: Armored enemy

### Level Progression

- **4 Levels**: Each with unique layouts and challenges
- **Star System**: Earn stars based on performance
- **Progressive Difficulty**: Later levels require strategic planning

## Core Systems

### GameState System

Centralized state management with validation and event handling.

```javascript
import { gameState } from './core/GameState.js';

// Get state
const gold = gameState.get('gold');

// Set state with validation
gameState.set('gold', 500);

// Listen to changes
gameState.on('goldChanged', (data) => {
  console.log(`Gold changed: ${data.oldValue} -> ${data.newValue}`);
});
```

### MovementSystem

Unified movement system with priority handling.

```javascript
import { movementSystem } from './core/MovementSystem.js';

// Register entity
movementSystem.registerEntity(hero, {
  speed: 80,
  type: 'gather',
  stopDistance: 3
});

// Set movement target
movementSystem.setTarget(hero, x, y, {
  priority: 1,
  type: 'gather'
});
```

### AssetManager

Robust asset loading with automatic fallbacks.

```javascript
import { assetManager } from './core/AssetManager.js';

// Load image with fallback
const heroImage = await assetManager.loadImage('assets/heroes/knight.png', 'hero');

// Preload level assets
await assetManager.preloadLevel(levelData);
```

## Development

### Code Standards

- **ES6 Modules**: Use import/export syntax
- **Camel Case**: Variables, functions, methods
- **Pascal Case**: Classes
- **Constants**: Use `const` for immutable values
- **Error Handling**: Always use try/catch for async operations
- **Validation**: Validate inputs and state changes

### Adding New Features

1. Create feature branch
2. Implement feature following architecture patterns
3. Add comprehensive tests
4. Update documentation
5. Submit pull request

### Testing Strategy

The project uses a multi-layered testing approach:

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test system interactions
3. **E2E Tests**: Test complete user workflows

### Performance Considerations

- **Object Pooling**: Reuse objects for enemies and projectiles
- **Canvas Optimization**: Efficient rendering techniques
- **Asset Caching**: Cache loaded assets to prevent re-loading
- **State Management**: Minimize unnecessary state updates

## Testing

### Test Structure

```
tests/
├── core/                   # Unit tests for core systems
│   ├── GameState.test.js
│   ├── MovementSystem.test.js
│   └── AssetManager.test.js
├── integration/            # Integration tests
│   ├── game-flow.spec.js
│   └── movement-system.spec.js
└── utils/                  # Test utilities
```

### Writing Tests

#### Unit Tests (Jest)

```javascript
import { GameState } from '../../js/core/GameState.js';

describe('GameState', () => {
  test('should validate gold values', () => {
    const gameState = new GameState();
    expect(() => {
      gameState.set('gold', -100);
    }).toThrow('Gold must be a non-negative number');
  });
});
```

#### Integration Tests (Playwright)

```javascript
test('should move hero when canvas is clicked', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('#level1Btn');
  await page.waitForSelector('#gameCanvas');
  
  const canvas = page.locator('#gameCanvas');
  await canvas.click({ position: { x: 200, y: 200 } });
  
  // Verify movement was triggered
  const isMoving = await page.evaluate(() => {
    const hero = window.game?.heroManager?.heroes[0];
    return window.movementSystem?.isMoving(hero);
  });
  
  expect(isMoving).toBe(true);
});
```

## API Reference

### Core Classes

#### GameState

Centralized state management system.

**Methods:**
- `get(key)`: Get state value
- `set(key, value)`: Set state value with validation
- `update(changes)`: Update multiple values atomically
- `on(event, callback)`: Add event listener
- `startGame()`: Start the game
- `endGame(won)`: End the game

#### MovementSystem

Unified movement system for all entities.

**Methods:**
- `registerEntity(entity, options)`: Register entity for movement
- `setTarget(entity, x, y, options)`: Set movement target
- `stopMovement(entity)`: Stop entity movement
- `isMoving(entity)`: Check if entity is moving
- `update(deltaSec)`: Update all entity movements

#### AssetManager

Asset loading and management system.

**Methods:**
- `loadImage(path, type)`: Load image asset
- `loadAudio(path)`: Load audio asset
- `preloadLevel(levelData)`: Preload level assets
- `getAsset(path)`: Get loaded asset
- `getStats()`: Get loading statistics

### Game Managers

#### HeroManager

Manages hero units and their behavior.

**Methods:**
- `addHero(config)`: Create new hero
- `removeHero(hero)`: Remove hero
- `getHeroAt(x, y)`: Find hero at position
- `update(deltaSec)`: Update all heroes

#### TowerManager

Manages tower placement and behavior.

**Methods:**
- `createTower(type)`: Create new tower
- `getTowerData()`: Get available tower types
- `upgradeTower(tower)`: Upgrade existing tower
- `update(deltaSec)`: Update all towers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the code standards
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation
7. Submit a pull request

## License

ISC License - see LICENSE file for details.