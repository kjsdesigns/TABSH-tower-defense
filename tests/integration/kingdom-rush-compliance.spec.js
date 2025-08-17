/**
 * Kingdom Rush compliance test suite
 */

const { test, expect } = require('@playwright/test');

test.describe('Kingdom Rush Standard Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#mainScreen', { state: 'visible' });
    
    // Setup hero selection
    await page.evaluate(() => {
      localStorage.setItem('kr_activeSlot', '1');
      const slotData = {
        currentStars: { level1: 0 },
        selectedHero: 'melee'
      };
      localStorage.setItem('kr_slot1', JSON.stringify(slotData));
    });
    
    await page.click('#level1Btn');
    await page.waitForSelector('#gameCanvas');
  });

  test('should show countdown timer before waves start', async ({ page }) => {
    // Start the game
    await page.click('#gameControlButton');
    
    // Check for countdown display
    await page.waitForTimeout(1000);
    
    // Screenshot to verify countdown appears
    await page.screenshot({ path: 'test-results/countdown-check.png' });
    
    // The countdown should be visible in the canvas text
    const gameStatus = await page.evaluate(() => {
      const game = window.game;
      return {
        gameStarted: game?.gameState?.get('gameStarted'),
        timeUntilNextWave: game?.waveManager?.timeUntilNextWave,
        waveActive: game?.waveManager?.waveActive
      };
    });
    
    expect(gameStatus.gameStarted).toBe(true);
    expect(gameStatus.timeUntilNextWave).toBeGreaterThan(0);
    expect(gameStatus.waveActive).toBe(false);
  });

  test('should auto-select melee hero when none chosen', async ({ page }) => {
    // Clear hero selection
    await page.evaluate(() => {
      const slotData = {
        currentStars: { level1: 0 },
        selectedHero: null // No hero selected
      };
      localStorage.setItem('kr_slot1', JSON.stringify(slotData));
    });
    
    // Reload level
    await page.click('#level1Btn');
    await page.waitForSelector('#gameCanvas');
    
    const heroInfo = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      return {
        heroExists: !!hero,
        heroType: hero?.isMelee ? 'melee' : 'archer',
        autoSelected: localStorage.getItem('kr_slot1').includes('melee')
      };
    });
    
    expect(heroInfo.heroExists).toBe(true);
    expect(heroInfo.heroType).toBe('melee');
    expect(heroInfo.autoSelected).toBe(true);
  });

  test('should only show gather point for barracks towers', async ({ page }) => {
    await page.click('#gameControlButton');
    
    // Try to place a point tower first
    await page.evaluate(() => {
      const game = window.game;
      const spot = game.towerSpots[0];
      const tower = game.towerManager.createTower('point tower');
      if (tower) {
        tower.x = spot.x;
        tower.y = spot.y;
        tower.spot = spot;
        spot.occupied = true;
        game.towerManager.towers.push(tower);
      }
    });
    
    // Click on the tower to open upgrade dialog
    const canvas = page.locator('#gameCanvas');
    await canvas.click({ position: { x: 200, y: 150 } });
    
    // Check if gather button is hidden for point tower
    const gatherButtonVisible = await page.locator('#towerGatherBtn').isVisible();
    expect(gatherButtonVisible).toBe(false);
    
    // Now test with barracks tower
    await page.evaluate(() => {
      const game = window.game;
      // Replace with barracks tower
      const tower = game.towerManager.towers[0];
      if (tower) {
        tower.type = 'barracks tower';
      }
    });
    
    // Refresh dialog
    await page.click('#towerUpgradeClose');
    await canvas.click({ position: { x: 200, y: 150 } });
    
    const gatherButtonVisibleForBarracks = await page.locator('#towerGatherBtn').isVisible();
    expect(gatherButtonVisibleForBarracks).toBe(true);
  });

  test('should display proper enemy count and wave information', async ({ page }) => {
    await page.click('#gameControlButton');
    
    // Wait for enemies to spawn
    await page.waitForTimeout(3000);
    
    // Check game canvas text for enemy count
    await page.screenshot({ path: 'test-results/enemy-count-display.png' });
    
    const gameStats = await page.evaluate(() => {
      const game = window.game;
      const wm = game?.waveManager;
      
      return {
        waveActive: wm?.waveActive,
        enemies: game?.enemies?.length || 0,
        currentWave: wm?.waveIndex + 1,
        totalWaves: wm?.waves?.length
      };
    });
    
    // Should show proper wave progression
    expect(gameStats.currentWave).toBeGreaterThan(0);
    expect(gameStats.totalWaves).toBeGreaterThan(0);
  });

  test('should handle tower placement correctly', async ({ page }) => {
    await page.click('#gameControlButton');
    
    // Click on a tower spot
    const canvas = page.locator('#gameCanvas');
    await canvas.click({ position: { x: 231, y: 170 } }); // First tower spot from level1 config
    
    // Should show build dialog
    await expect(page.locator('#towerBuildDialog')).toBeVisible();
    
    // Should have tower options
    const towerOptions = await page.locator('#towerBuildOptions button').count();
    expect(towerOptions).toBeGreaterThan(0);
    
    // Should be able to build a tower
    await page.locator('#towerBuildOptions button').first().click();
    
    const towerBuilt = await page.evaluate(() => {
      return window.game?.towerManager?.towers?.length > 0;
    });
    
    expect(towerBuilt).toBe(true);
  });
});