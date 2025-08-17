/**
 * Integration tests for game flow
 */

const { test, expect } = require('@playwright/test');

test.describe('Game Flow Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#mainScreen', { state: 'visible' });
  });

  test('should load main screen correctly', async ({ page }) => {
    // Check main screen elements
    await expect(page.locator('#mainScreen')).toBeVisible();
    await expect(page.locator('#slotButtonsContainer')).toBeVisible();
    await expect(page.locator('#level1Btn')).toBeVisible();
    
    // Check initial state
    const currentSlotLabel = await page.locator('#currentSlotLabel').textContent();
    expect(currentSlotLabel).toContain('Current Slot: 1');
  });

  test('should navigate to level correctly', async ({ page }) => {
    // Set up hero selection
    await page.evaluate(() => {
      localStorage.setItem('kr_activeSlot', '1');
      const slotData = {
        currentStars: { level1: 0 },
        selectedHero: 'melee'
      };
      localStorage.setItem('kr_slot1', JSON.stringify(slotData));
    });

    // Click level 1 button
    await page.click('#level1Btn');
    
    // Verify game container is shown
    await expect(page.locator('#gameContainer')).toBeVisible();
    await expect(page.locator('#mainScreen')).toBeHidden();
    
    // Verify canvas is present
    await expect(page.locator('#gameCanvas')).toBeVisible();
  });

  test('should initialize game state correctly', async ({ page }) => {
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
    
    // Check game state initialization
    const gameState = await page.evaluate(() => {
      return {
        gameStarted: window.game?.gameStarted,
        gold: window.game?.gold,
        lives: window.game?.lives,
        heroCount: window.game?.heroManager?.heroes?.length,
        movementSystemExists: !!window.movementSystem
      };
    });

    expect(gameState.gameStarted).toBe(false);
    expect(gameState.gold).toBeGreaterThan(0);
    expect(gameState.lives).toBe(20);
    expect(gameState.heroCount).toBe(1);
    expect(gameState.movementSystemExists).toBe(true);
  });

  test('should handle hero selection and placement', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('kr_activeSlot', '1');
      const slotData = {
        currentStars: { level1: 0 },
        selectedHero: 'archer'
      };
      localStorage.setItem('kr_slot1', JSON.stringify(slotData));
    });

    await page.click('#level1Btn');
    await page.waitForSelector('#gameCanvas');
    
    // Verify archer hero was created
    const heroInfo = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      return {
        exists: !!hero,
        isMelee: hero?.isMelee,
        name: hero?.name
      };
    });

    expect(heroInfo.exists).toBe(true);
    expect(heroInfo.isMelee).toBe(false);
    expect(heroInfo.name).toBe('Archer Hero');
  });

  test('should start and pause game correctly', async ({ page }) => {
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
    
    // Start the game
    await page.click('#gameControlButton');
    
    let gameState = await page.evaluate(() => ({
      gameStarted: window.game?.gameStarted,
      paused: window.game?.paused
    }));
    
    expect(gameState.gameStarted).toBe(true);
    expect(gameState.paused).toBe(false);
    
    // Pause the game
    await page.click('#gameControlButton');
    
    gameState = await page.evaluate(() => ({
      gameStarted: window.game?.gameStarted,
      paused: window.game?.paused
    }));
    
    expect(gameState.gameStarted).toBe(true);
    expect(gameState.paused).toBe(true);
  });

  test('should handle speed controls', async ({ page }) => {
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
    
    // Check initial speed
    let speedButton = await page.locator('#speedToggleButton').textContent();
    expect(speedButton).toBe('1x');
    
    // Cycle speed
    await page.click('#speedToggleButton');
    speedButton = await page.locator('#speedToggleButton').textContent();
    expect(speedButton).toBe('2x');
    
    // Verify game state
    const gameSpeed = await page.evaluate(() => window.gameState?.get('gameSpeed'));
    expect(gameSpeed).toBe(2);
  });

  test('should navigate back to main screen', async ({ page }) => {
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
    
    // Open settings and go back to main
    await page.click('#settingsButton');
    await page.click('#backToMainButton');
    
    // Verify we're back to main screen
    await expect(page.locator('#mainScreen')).toBeVisible();
    await expect(page.locator('#gameContainer')).toBeHidden();
  });

  test('should handle router navigation', async ({ page }) => {
    // Test direct URL navigation
    await page.goto('http://localhost:3000/level?level=level1');
    
    // Should automatically load level1
    await expect(page.locator('#gameContainer')).toBeVisible();
    
    // Navigate back via router
    await page.evaluate(() => {
      if (window.router) {
        window.router.navigate('/');
      }
    });
    
    await expect(page.locator('#mainScreen')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Monitor console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

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
    
    // Game should still be functional despite potential asset loading errors
    const gameExists = await page.evaluate(() => !!window.game);
    expect(gameExists).toBe(true);
    
    // Should not have critical errors
    const criticalErrors = errors.filter(error => 
      error.includes('TypeError') || error.includes('ReferenceError')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});