/**
 * Comprehensive Playwright test to debug barracks gather point system
 */

const { test, expect } = require('@playwright/test');

test.describe('Barracks Gather Point Debug', () => {
  test('should debug complete barracks gather point workflow', async ({ page }) => {
    console.log('🔍 Starting comprehensive barracks gather point debug...');
    
    // Monitor all console output
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      if (msg.text().includes('gather') || 
          msg.text().includes('Setting') ||
          msg.text().includes('soldier') ||
          msg.text().includes('rally') ||
          msg.text().includes('Range check')) {
        console.log(`🎯 ${msg.text()}`);
      }
    });
    
    // Setup game
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#mainScreen', { state: 'visible' });
    
    await page.evaluate(() => {
      localStorage.setItem('kr_activeSlot', '1');
      localStorage.setItem('kr_slot1', JSON.stringify({
        currentStars: { level1: 0 },
        selectedHero: 'melee'
      }));
    });
    
    await page.click('#level1Btn');
    await page.waitForSelector('#gameCanvas');
    
    await page.click('#gameControlButton');
    console.log('✅ Game started');
    
    // Step 1: Place barracks tower
    console.log('🏰 Step 1: Placing barracks tower...');
    const canvas = page.locator('#gameCanvas');
    
    // Click on first tower spot
    await canvas.click({ position: { x: 231, y: 170 } });
    await expect(page.locator('#towerBuildDialog')).toBeVisible();
    
    // Find and click barracks tower (teal button)
    const buildButtons = await page.locator('#towerBuildOptions button').all();
    let barracksButton = null;
    
    for (const button of buildButtons) {
      const text = await button.textContent();
      if (text.includes('barracks')) {
        barracksButton = button;
        break;
      }
    }
    
    expect(barracksButton).toBeTruthy();
    await barracksButton.click();
    await page.waitForTimeout(1000);
    
    // Step 2: Get initial soldier positions
    console.log('📍 Step 2: Recording initial soldier positions...');
    const initialPositions = await page.evaluate(() => {
      const tower = window.game?.towerManager?.towers[0];
      const soldiers = tower?.unitGroup?.soldiers || [];
      
      return {
        towerExists: !!tower,
        unitGroupExists: !!tower?.unitGroup,
        soldierCount: soldiers.length,
        soldiers: soldiers.map(s => ({
          name: s.name,
          currentPos: { x: Math.round(s.x), y: Math.round(s.y) },
          gatherPoint: { x: Math.round(s.gatherX), y: Math.round(s.gatherY) },
          isMoving: window.movementSystem?.isMoving(s) || false
        }))
      };
    });
    
    console.log('Initial state:', JSON.stringify(initialPositions, null, 2));
    expect(initialPositions.soldierCount).toBe(3);
    
    // Step 3: Open tower upgrade dialog
    console.log('⚙️ Step 3: Opening tower upgrade dialog...');
    await canvas.click({ position: { x: 231, y: 170 } });
    await expect(page.locator('#towerUpgradeDialog')).toBeVisible();
    await expect(page.locator('#towerGatherBtn')).toBeVisible();
    
    // Step 4: Start gather point selection
    console.log('🎯 Step 4: Starting gather point selection...');
    await page.click('#towerGatherBtn');
    
    // Verify we're in selection mode
    const selectionModeActive = await page.evaluate(() => {
      return {
        isSettingRallyPoint: window.game?.uiManager?.isSettingRallyPoint,
        rallyTowerExists: !!window.game?.uiManager?.rallyTower,
        cursorStyle: window.game?.canvas?.style?.cursor
      };
    });
    
    console.log('Selection mode state:', selectionModeActive);
    expect(selectionModeActive.isSettingRallyPoint).toBe(true);
    
    // Take screenshot showing blue area
    await page.screenshot({ path: 'test-results/gather-point-debug-area.png' });
    
    // Step 5: Click to set new gather point
    console.log('📍 Step 5: Setting new gather point...');
    const newGatherX = 180;
    const newGatherY = 220;
    
    console.log(`Clicking at (${newGatherX}, ${newGatherY}) to set new gather point...`);
    await canvas.click({ position: { x: newGatherX, y: newGatherY } });
    await page.waitForTimeout(500);
    
    // Step 6: Verify gather point was updated
    console.log('📊 Step 6: Checking if gather points updated...');
    const updatedPositions = await page.evaluate(() => {
      const tower = window.game?.towerManager?.towers[0];
      const soldiers = tower?.unitGroup?.soldiers || [];
      
      return {
        selectionModeEnded: !window.game?.uiManager?.isSettingRallyPoint,
        soldiers: soldiers.map(s => ({
          name: s.name,
          currentPos: { x: Math.round(s.x), y: Math.round(s.y) },
          gatherPoint: { x: Math.round(s.gatherX), y: Math.round(s.gatherY) },
          isMoving: window.movementSystem?.isMoving(s) || false
        }))
      };
    });
    
    console.log('Updated state:', JSON.stringify(updatedPositions, null, 2));
    
    // Check if any gather points changed
    const gatherPointsChanged = initialPositions.soldiers.some((initial, i) => {
      const updated = updatedPositions.soldiers[i];
      return initial.gatherPoint.x !== updated.gatherPoint.x || 
             initial.gatherPoint.y !== updated.gatherPoint.y;
    });
    
    console.log(gatherPointsChanged ? '✅ SUCCESS: Gather points changed!' : '❌ FAILURE: Gather points did not change');
    
    if (gatherPointsChanged) {
      // Step 7: Wait and verify soldiers actually move to new positions
      console.log('🏃 Step 7: Waiting for soldiers to move to new positions...');
      await page.waitForTimeout(3000);
      
      const finalPositions = await page.evaluate(() => {
        const tower = window.game?.towerManager?.towers[0];
        const soldiers = tower?.unitGroup?.soldiers || [];
        
        return soldiers.map(s => ({
          name: s.name,
          currentPos: { x: Math.round(s.x), y: Math.round(s.y) },
          gatherPoint: { x: Math.round(s.gatherX), y: Math.round(s.gatherY) },
          distanceToGather: Math.round(Math.sqrt(
            Math.pow(s.x - s.gatherX, 2) + Math.pow(s.y - s.gatherY, 2)
          ))
        }));
      });
      
      console.log('Final positions:', JSON.stringify(finalPositions, null, 2));
      
      const soldiersAtGatherPoint = finalPositions.filter(s => s.distanceToGather <= 10);
      console.log(`${soldiersAtGatherPoint.length}/3 soldiers reached their gather points`);
      
      // Take final screenshot
      await page.screenshot({ path: 'test-results/soldiers-at-new-gather-point.png' });
      
    } else {
      // Debug why gather points didn't change
      console.log('🔍 Debugging why gather points did not change...');
      
      // Check for JavaScript errors
      const jsErrors = consoleMessages.filter(msg => 
        msg.includes('[error]') && !msg.includes('404')
      );
      
      if (jsErrors.length > 0) {
        console.log('❌ JavaScript errors found:');
        jsErrors.forEach(error => console.log(`  ${error}`));
      }
      
      // Check if the rally point handler was actually called
      const rallyHandlerCalled = consoleMessages.some(msg => 
        msg.includes('RALLY POINT HANDLER EXECUTING') ||
        msg.includes('Range check:')
      );
      
      console.log('Rally point handler called:', rallyHandlerCalled);
      
      if (!rallyHandlerCalled) {
        console.log('❌ Rally point handler was never executed - this is the core issue');
      }
    }
    
    // Always expect that gather points should change when we click within range
    expect(gatherPointsChanged).toBe(true);
  });
});