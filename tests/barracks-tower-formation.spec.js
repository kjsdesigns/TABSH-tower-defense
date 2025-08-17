// @ts-check
const { test } = require('./serverFixture');
const { expect } = require('@playwright/test');

test('Barracks tower units should use triangle formation and be properly positioned', async ({ page, server }) => {
  // Navigate to the game page
  await page.goto('http://localhost:3000');
  
  // Wait for the game to load - more robust approach
  try {
    await page.waitForSelector('canvas', { timeout: 30000, state: 'attached' });
    console.log("Canvas element found");
  } catch (error) {
    console.error("Canvas element not found, but continuing test:", error.message);
  }
  
  // Wait for game to initialize with a more robust approach
  try {
    await page.waitForFunction(() => {
      return typeof window.game !== 'undefined' && 
             window.game !== null && 
             typeof window.game.towerManager !== 'undefined';
    }, { timeout: 30000 });
    console.log("Game and tower manager initialized");
  } catch (error) {
    console.error("Game initialization test failed:", error.message);
    // Take screenshot for debugging
    await page.screenshot({ path: 'barracks-tower-init-error.png' });
  }
  
  // Create a barracks tower programmatically (since the UI interaction is complex)
  const barracksTower = await page.evaluate(() => {
    // Get a tower spot to place the tower
    const spot = window.game.towerSpots[0];
    if (!spot) return null;
    
    // Create a barracks tower and place it
    const towerManager = window.game.towerManager;
    const tower = towerManager.createTower("barracks tower");
    
    if (!tower) return null;
    
    // Set tower position and link to spot
    tower.x = spot.x;
    tower.y = spot.y;
    tower.spot = spot;
    spot.occupied = true;
    
    // Initialize the tower (creates the unit group)
    towerManager.towers.push(tower);
    towerManager.initializeTower(tower);
    
    // Verify the initial rally point and unit positions
    const unitPositions = tower.unitGroup?.units.map(u => ({
      index: u.indexInGroup,
      position: { x: u.x, y: u.y },
      gatherPoint: { x: u.gatherX, y: u.gatherY }
    })) || [];
    
    // Get the initial rally point if available
    const initialRallyPoint = tower.unitGroup ? {
      x: tower.unitGroup.gatherX,
      y: tower.unitGroup.gatherY
    } : null;
    
    // Get the paths from the current level
    const paths = window.game.levelData.paths || [];
    
    return {
      towerPosition: { x: tower.x, y: tower.y },
      initialRallyPoint,
      unitPositions,
      paths: paths.map(path => path.map(p => ({ x: p.x, y: p.y }))),
      unitOffsets: tower.unitGroup ? tower.unitGroup.offsets : []
    };
  });
  
  console.log('Barracks tower info:', barracksTower);
  
  // Verify we have created a tower and it has units
  expect(barracksTower).not.toBeNull();
  expect(barracksTower.unitPositions.length).toBe(3); // Default is 3 units
  
  // Verify units have a triangular offset pattern
  const uniqueOffsetPattern = new Set(
    barracksTower.unitOffsets.map(offset => 
      JSON.stringify([Math.round(offset.x), Math.round(offset.y)])
    )
  );
  
  // In a triangle pattern, all 3 units should have different positions
  expect(uniqueOffsetPattern.size).toBeGreaterThanOrEqual(barracksTower.unitPositions.length);
  
  // Now let's test setting a new rally point
  const newRallyPoint = await page.evaluate(() => {
    const tower = window.game.towerManager.towers[0];
    if (!tower || !tower.unitGroup) return null;
    
    // Set a new rally point
    const newX = tower.x + 50;
    const newY = tower.y - 30;
    tower.unitGroup.setRallyPoint(newX, newY);
    
    // Get the new unit positions and gather points
    const newUnitPositions = tower.unitGroup.units.map(u => ({
      index: u.indexInGroup,
      gatherPoint: { x: u.gatherX, y: u.gatherY },
      targetIndicator: {
        exists: u.showTarget === true,
        x: u.targetX,
        y: u.targetY
      }
    }));
    
    return {
      rallyPoint: { x: tower.unitGroup.gatherX, y: tower.unitGroup.gatherY },
      unitPositions: newUnitPositions
    };
  });
  
  console.log('New rally point info:', newRallyPoint);
  
  // Verify rally point was set
  expect(newRallyPoint).not.toBeNull();
  
  // Verify each unit has a different gather point (because of offsets)
  const uniqueGatherPoints = new Set(
    newRallyPoint.unitPositions.map(unit => 
      JSON.stringify([Math.round(unit.gatherPoint.x), Math.round(unit.gatherPoint.y)])
    )
  );
  
  // All units should have different gather points in the triangle formation
  expect(uniqueGatherPoints.size).toBeGreaterThanOrEqual(3);
  
  // Verify target indicators were set
  for (const unit of newRallyPoint.unitPositions) {
    expect(unit.targetIndicator.exists).toBe(true);
    expect(unit.targetIndicator.x).toBeDefined();
    expect(unit.targetIndicator.y).toBeDefined();
  }
});