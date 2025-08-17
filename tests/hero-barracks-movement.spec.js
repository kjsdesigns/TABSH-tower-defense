// @ts-check
const { test, expect } = require('@playwright/test');

test('Hero moves 40% faster and barracks tower units support set gather point', async ({ page }) => {
  // Navigate to the game page
  await page.goto('http://localhost:3000');
  
  // Wait for the game to load
  await page.waitForFunction(() => {
    return document.querySelector('canvas') && 
           window.game && 
           window.game.heroManager && 
           window.game.heroManager.heroes && 
           window.game.heroManager.heroes.length > 0;
  }, { timeout: 10000 });

  // Test 1: Verify hero speed is 40% faster
  // Get speed from the game object
  const heroSpeed = await page.evaluate(() => {
    return window.game.heroManager.heroes[0].speed;
  });
  
  console.log('Hero speed:', heroSpeed);
  
  // The speed should be 112 (80 * 1.4)
  await expect(heroSpeed).toBe(112);
  
  // Test 2: Test barracks tower unit gather point functionality
  // Create a barracks tower
  await page.evaluate(() => {
    // Simulate creating a barracks tower
    const towerManager = window.game.towerManager;
    const spot = window.game.towerSpots[0];
    
    // Create a barracks tower and place it on the spot
    const tower = towerManager.createTower("barracks tower");
    tower.x = spot.x;
    tower.y = spot.y;
    tower.spot = spot;
    spot.occupied = true;
    
    // Initialize the tower
    towerManager.towers.push(tower);
    towerManager.initializeTower(tower);
    
    // Make it the selected tower
    window.game.uiManager.selectedTower = tower;
    
    // Log some debug information
    console.log('Created barracks tower:', tower);
    console.log('Unit group:', tower.unitGroup);
    
    return tower;
  });
  
  // Wait a bit to make sure the tower is initialized
  await page.waitForTimeout(500);
  
  // Simulate clicking the "Set Gather Point" button
  await page.evaluate(() => {
    window.game.uiManager.gatherBtn.click();
  });
  
  // Verify we're in set rally point mode
  const isSettingRallyPoint = await page.evaluate(() => {
    return window.game.uiManager.isSettingRallyPoint;
  });
  
  await expect(isSettingRallyPoint).toBe(true);
  
  // Get the canvas element and its bounding box
  const canvasBoundingBox = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    };
  });
  
  // Click at a point on the canvas to set the rally point
  const clickX = canvasBoundingBox.x + canvasBoundingBox.width / 2;
  const clickY = canvasBoundingBox.y + canvasBoundingBox.height / 2;
  
  await page.mouse.click(clickX, clickY);
  
  // Check that the rally point was set and that the soldiers have target indicators
  const targetsSet = await page.evaluate(() => {
    const tower = window.game.uiManager.selectedTower || window.game.towerManager.towers[0];
    if (!tower || !tower.unitGroup || !tower.unitGroup.units) {
      return false;
    }
    
    // Check if the gather point was set to the clicked location
    const canvasRect = window.game.canvas.getBoundingClientRect();
    const targetX = tower.unitGroup.gatherX;
    const targetY = tower.unitGroup.gatherY;
    
    // Check if at least one soldier has a target indicator
    const hasTargetIndicators = tower.unitGroup.units.some(soldier => 
      soldier.showTarget && 
      soldier.targetX !== undefined && 
      soldier.targetY !== undefined
    );
    
    return {
      isRallyPointSet: (targetX !== tower.x || targetY !== tower.y),
      hasTargetIndicators,
      unitCount: tower.unitGroup.units.length,
      gatherPoint: { x: targetX, y: targetY }
    };
  });
  
  console.log('Target indicators info:', targetsSet);
  
  // Rally point should be set
  await expect(targetsSet.isRallyPointSet).toBe(true);
  
  // Units should have target indicators
  await expect(targetsSet.hasTargetIndicators).toBe(true);
  
  // Verify we're no longer in rally point setting mode
  const stillSettingRallyPoint = await page.evaluate(() => {
    return window.game.uiManager.isSettingRallyPoint;
  });
  
  await expect(stillSettingRallyPoint).toBe(false);
});