// @ts-check
const { test } = require('./serverFixture');
const { expect } = require('@playwright/test');

test('Barracks tower units should move when rally point is set', async ({ page, server }) => {
  // Navigate to the game page
  await page.goto('http://localhost:3000');
  
  // Wait for the game to load
  try {
    await page.waitForSelector('canvas', { timeout: 30000, state: 'attached' });
    console.log("Canvas element found");
  } catch (error) {
    console.error("Canvas element not found, but continuing test:", error.message);
  }
  
  // Wait for game to initialize
  try {
    await page.waitForFunction(() => {
      return typeof window.game !== 'undefined' && 
             window.game !== null && 
             typeof window.game.towerManager !== 'undefined';
    }, { timeout: 30000 });
    console.log("Game object initialized");
  } catch (error) {
    console.error("Game initialization test failed:", error.message);
    await page.screenshot({ path: 'barracks-init-error.png' });
  }
  
  // Create a barracks tower programmatically
  const initialState = await page.evaluate(() => {
    // Get a tower spot to place the tower
    const spot = window.game.towerSpots[0];
    if (!spot) return { error: "No tower spot found" };
    
    // Create a barracks tower and place it
    const towerManager = window.game.towerManager;
    const tower = towerManager.createTower("barracks tower");
    
    if (!tower) return { error: "Failed to create barracks tower" };
    
    // Set tower position and link to spot
    tower.x = spot.x;
    tower.y = spot.y;
    tower.spot = spot;
    spot.occupied = true;
    
    // Initialize the tower (creates the unit group)
    towerManager.towers.push(tower);
    towerManager.initializeTower(tower);
    
    // Ensure the game is running to allow movement
    window.game.gameStarted = true;
    
    // Return initial state for verification
    if (!tower.unitGroup) return { error: "No unit group created" };
    
    return {
      towerPosition: { x: tower.x, y: tower.y },
      unitCount: tower.unitGroup.units.length,
      initialPositions: tower.unitGroup.units.map(unit => ({ 
        x: unit.x, 
        y: unit.y,
        gatherX: unit.gatherX,
        gatherY: unit.gatherY
      })),
      rallyPoint: { 
        x: tower.unitGroup.gatherX, 
        y: tower.unitGroup.gatherY 
      }
    };
  });
  
  console.log("Initial tower state:", initialState);
  
  // Verify tower was created correctly
  expect(initialState.error).toBeUndefined();
  expect(initialState.unitCount).toBeGreaterThan(0);
  
  // Take screenshot of initial state
  await page.screenshot({ path: 'barracks-initial.png' });
  
  // Wait a moment to allow units to move to initial positions
  await page.waitForTimeout(2000);
  
  // Check if units have moved from their initial positions
  const afterInitialWait = await page.evaluate(() => {
    const tower = window.game.towerManager.towers[0];
    if (!tower || !tower.unitGroup) return { error: "Tower or unit group not found" };
    
    return {
      units: tower.unitGroup.units.map(unit => ({ 
        x: unit.x, 
        y: unit.y,
        gatherX: unit.gatherX,
        gatherY: unit.gatherY,
        // Distance from current position to tower
        distanceToTower: Math.sqrt(
          Math.pow(unit.x - tower.x, 2) + 
          Math.pow(unit.y - tower.y, 2)
        )
      }))
    };
  });
  
  console.log("After initial wait:", afterInitialWait);
  
  // Set a new rally point far from the tower
  const newRallyPoint = await page.evaluate(() => {
    const tower = window.game.towerManager.towers[0];
    if (!tower || !tower.unitGroup) return { error: "Tower or unit group not found" };
    
    // Set rally point to a position far from the tower
    const newX = tower.x + 100;
    const newY = tower.y + 100;
    
    // Log the current unit positions before setting rally point
    const beforePositions = tower.unitGroup.units.map(unit => ({ 
      x: unit.x, 
      y: unit.y,
      gatherX: unit.gatherX,
      gatherY: unit.gatherY
    }));
    
    // Set the new rally point
    console.log(`Setting rally point to ${newX},${newY}`);
    tower.unitGroup.setRallyPoint(newX, newY);
    
    // Return information for verification
    return {
      newRallyPoint: { x: newX, y: newY },
      beforePositions,
      currentRallyPoint: { 
        x: tower.unitGroup.gatherX, 
        y: tower.unitGroup.gatherY 
      },
      // Check if gather points were updated for units
      unitGatherPoints: tower.unitGroup.units.map(unit => ({ 
        gatherX: unit.gatherX, 
        gatherY: unit.gatherY 
      }))
    };
  });
  
  console.log("New rally point set:", newRallyPoint);
  
  // Verify rally point was set correctly
  expect(newRallyPoint.error).toBeUndefined();
  expect(newRallyPoint.currentRallyPoint).toEqual(newRallyPoint.newRallyPoint);
  
  // Wait a longer time to give units chance to move to new positions
  await page.waitForTimeout(5000);
  
  // Take screenshot after setting rally point
  await page.screenshot({ path: 'barracks-after-rally.png' });
  
  // Check if units have moved toward the new rally point
  const afterRallySet = await page.evaluate(() => {
    const tower = window.game.towerManager.towers[0];
    if (!tower || !tower.unitGroup) return { error: "Tower or unit group not found" };
    
    // Get gather controller instance for debugging
    const gatherControllerInstance = window.gatherController ? 
      window.gatherController.instance : null;
    
    return {
      units: tower.unitGroup.units.map(unit => ({ 
        x: unit.x, 
        y: unit.y,
        gatherX: unit.gatherX,
        gatherY: unit.gatherY,
        // Distance from current position to new rally point
        distanceToRallyPoint: Math.sqrt(
          Math.pow(unit.x - unit.gatherX, 2) + 
          Math.pow(unit.y - unit.gatherY, 2)
        ),
        // Distance from current position to tower
        distanceToTower: Math.sqrt(
          Math.pow(unit.x - tower.x, 2) + 
          Math.pow(unit.y - tower.y, 2)
        )
      })),
      // Debug info about gather controller
      gatherControllerInfo: gatherControllerInstance ? {
        unitCount: gatherControllerInstance.units.size,
        initialized: !!gatherControllerInstance
      } : 'not available',
      // Get game update status
      gameStatus: {
        gameStarted: window.game.gameStarted,
        paused: window.game.paused,
        gameOver: window.game.gameOver
      },
      // Check moveHelper functionality
      moveHelperLoaded: typeof window.moveEntityToward === 'function'
    };
  });
  
  console.log("After waiting for movement:", afterRallySet);
  
  // Check game state
  expect(afterRallySet.gameStatus.gameStarted).toBe(true);
  expect(afterRallySet.gameStatus.paused).toBe(false);
  
  // Check if units have moved away from the tower
  const unitsMovedFromTower = afterRallySet.units.some(unit => unit.distanceToTower > 20);
  // This will fail if the units are stuck at the tower
  expect(unitsMovedFromTower).toBe(true);
  
  // Direct test - manually move a unit and see if it works
  const manualMoveTest = await page.evaluate(() => {
    const tower = window.game.towerManager.towers[0];
    if (!tower || !tower.unitGroup) return { error: "Tower or unit group not found" };
    
    // Get the first unit
    const unit = tower.unitGroup.units[0];
    if (!unit) return { error: "No units found" };
    
    const oldX = unit.x;
    const oldY = unit.y;
    
    // Try to directly update the unit's position
    unit.x += 20;
    unit.y += 20;
    
    // Check if the update worked
    return {
      before: { x: oldX, y: oldY },
      after: { x: unit.x, y: unit.y },
      positionChanged: (unit.x !== oldX || unit.y !== oldY)
    };
  });
  
  console.log("Manual movement test:", manualMoveTest);
  
  // If we can manually move the unit, then the issue is with the automatic movement
  expect(manualMoveTest.positionChanged).toBe(true);
  
  // Force a gameLoop update explicitly
  await page.evaluate(() => {
    // Force update game loop
    if (window.game && typeof window.game.gameLoop === 'function') {
      window.game.gameLoop(performance.now());
    }
  });
  
  // Take final screenshot
  await page.screenshot({ path: 'barracks-final.png' });
});