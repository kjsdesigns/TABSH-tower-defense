// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Hero Movement and Selection Features', () => {
  // Test both requirements:
  // 1. Hero should move before game starts
  // 2. Hero should be deselected after setting movement destination
  test('hero movement and selection behavior', async ({ page }) => {
    // Navigate to the game
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for mainScreen to be visible first
    await page.waitForSelector('#mainScreen', { state: 'visible', timeout: 5000 });
    
    // Select a hero (melee hero) by setting localStorage
    await page.evaluate(() => {
      localStorage.setItem('kr_activeSlot', '1');
      const slotData = {
        currentStars: { level1: 3, level2: 2, level3: 1 },
        selectedHero: 'melee'
      };
      localStorage.setItem('kr_slot1', JSON.stringify(slotData));
    });
    
    // Click on level 1 to start the game
    await page.click('#level1Btn');
    
    // Wait for game container and canvas to be visible
    await page.waitForSelector('#gameContainer', { state: 'visible', timeout: 5000 });
    
    // Wait for game to initialize
    await page.waitForTimeout(2000);
    
    // Verify game is in "not started" state
    const gameState = await page.evaluate(() => {
      return {
        gameStarted: window.game.gameStarted,
        paused: window.game.paused
      };
    });
    
    expect(gameState.gameStarted).toBe(false);
    
    // Get hero position
    const heroPosition = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      return hero ? { x: hero.x, y: hero.y } : null;
    });
    
    expect(heroPosition).not.toBeNull();
    
    // Click to select the hero using direct event simulation
    await page.evaluate(() => {
      const hero = window.game.heroManager.heroes[0];
      const canvas = window.game.canvas;
      const rect = canvas.getBoundingClientRect();
      
      // Convert hero coordinates to client coordinates
      const clientX = rect.left + hero.x;
      const clientY = rect.top + hero.y;
      
      // Create and dispatch click event on canvas
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: clientX,
        clientY: clientY
      });
      
      canvas.dispatchEvent(clickEvent);
    });
    
    // Take a screenshot showing hero selected
    await page.screenshot({ path: 'hero-selected.png' });
    
    // Verify hero is selected
    const heroSelected = await page.evaluate(() => {
      return window.game.uiManager.selectedHero !== null;
    });
    
    expect(heroSelected).toBe(true);
    
    // Click canvas center to set a destination point
    await page.evaluate(() => {
      const canvas = window.game.canvas;
      const rect = canvas.getBoundingClientRect();
      
      // Use the canvas center
      const centerX = rect.left + canvas.width / 2;
      const centerY = rect.top + canvas.height / 2;
      
      // Create and dispatch click event on canvas
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: centerX,
        clientY: centerY
      });
      
      canvas.dispatchEvent(clickEvent);
    });
    
    // Verify the gather point was set
    const gatherInfo = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      return {
        gatherX: hero.gatherX,
        gatherY: hero.gatherY,
        heroX: hero.x,
        heroY: hero.y,
        canvasCenter: {
          x: window.game.canvas.width / 2,
          y: window.game.canvas.height / 2
        }
      };
    });
    
    // Gather point should be close to canvas center
    const distanceToCenter = Math.sqrt(
      Math.pow(gatherInfo.gatherX - gatherInfo.canvasCenter.x, 2) +
      Math.pow(gatherInfo.gatherY - gatherInfo.canvasCenter.y, 2)
    );
    
    expect(distanceToCenter).toBeLessThan(20);
    
    // Verify hero is deselected after setting destination (REQUIREMENT 2)
    const heroDeselected = await page.evaluate(() => {
      return window.game.uiManager.selectedHero === null;
    });
    
    expect(heroDeselected).toBe(true);
    
    // Wait for hero to move
    await page.waitForTimeout(5000);
    
    // Take a screenshot showing hero moved
    await page.screenshot({ path: 'hero-moved.png' });
    
    // Verify hero has moved toward destination (REQUIREMENT 1)
    const finalPosition = await page.evaluate((initialPos) => {
      const hero = window.game?.heroManager?.heroes[0];
      return {
        x: hero.x,
        y: hero.y,
        distanceMoved: Math.sqrt(
          Math.pow(hero.x - initialPos.x, 2) +
          Math.pow(hero.y - initialPos.y, 2)
        )
      };
    }, heroPosition);
    
    // Hero should have moved a significant distance
    expect(finalPosition.distanceMoved).toBeGreaterThan(20);
  });
});