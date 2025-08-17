// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Hero Movement Features', () => {
  // Test that hero can move before game starts
  test('hero should move to clicked location before game starts', async ({ page }) => {
    // Navigate to the game
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for mainScreen to be visible first
    await page.waitForSelector('#mainScreen', { state: 'visible', timeout: 5000 });
    console.log('Main screen visible');
    
    // Select a hero (melee hero) by setting localStorage
    await page.evaluate(() => {
      // Select hero in localStorage
      localStorage.setItem('kr_activeSlot', '1');
      const slotData = {
        currentStars: {
          level1: 3,
          level2: 2,
          level3: 1
        },
        selectedHero: 'melee' // Select melee hero
      };
      localStorage.setItem('kr_slot1', JSON.stringify(slotData));
    });
    
    // Click on level 1 to start the game
    await page.click('#level1Btn');
    
    // Wait for game container to be visible
    await page.waitForSelector('#gameContainer', { state: 'visible', timeout: 5000 });
    console.log('Game container visible');
    
    // Get game state and initial hero position
    const initialState = await page.evaluate(() => {
      return {
        gameStarted: window.game.gameStarted,
        paused: window.game.paused,
        heroPosition: window.game.heroManager.heroes[0] ? {
          x: window.game.heroManager.heroes[0].x,
          y: window.game.heroManager.heroes[0].y
        } : null
      };
    });
    
    console.log('Initial game state:', initialState);
    expect(initialState.gameStarted).toBe(false);
    expect(initialState.heroPosition).not.toBeNull();
    
    // Make sure the hero is not at the center (where we'll move it)
    // Get the canvas center
    const canvasCenter = await page.evaluate(() => {
      return {
        x: window.game.canvas.width / 2,
        y: window.game.canvas.height / 2
      };
    });
    
    // Click to select the hero first
    // Use direct event simulation for precision
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
    
    // Verify hero is selected
    const heroSelected = await page.evaluate(() => {
      return window.game.uiManager.selectedHero !== null;
    });
    
    expect(heroSelected).toBe(true);
    console.log('Hero selected successfully');
    
    // Click on the center of the canvas to move the hero there
    await page.evaluate(() => {
      const centerX = window.game.canvas.width / 2;
      const centerY = window.game.canvas.height / 2;
      const canvas = window.game.canvas;
      const rect = canvas.getBoundingClientRect();
      
      // Convert center coordinates to client coordinates
      const clientX = rect.left + centerX;
      const clientY = rect.top + centerY;
      
      console.log('Setting gather point at', centerX, centerY);
      
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
    
    // Verify the hero is deselected after setting the destination
    const heroDeselected = await page.evaluate(() => {
      return window.game.uiManager.selectedHero === null;
    });
    
    expect(heroDeselected).toBe(true);
    console.log('Hero deselected after setting destination');
    
    // Wait for hero to move (5 seconds should be enough)
    await page.waitForTimeout(5000);
    
    // Check final position
    const finalPosition = await page.evaluate(() => {
      const hero = window.game.heroManager.heroes[0];
      const centerX = window.game.canvas.width / 2;
      const centerY = window.game.canvas.height / 2;
      
      return {
        heroX: hero.x,
        heroY: hero.y,
        centerX: centerX,
        centerY: centerY,
        distanceToCenter: Math.sqrt(
          Math.pow(hero.x - centerX, 2) + 
          Math.pow(hero.y - centerY, 2)
        )
      };
    });
    
    console.log('Final position:', finalPosition);
    
    // The hero should be close to the center (within 20 pixels)
    expect(finalPosition.distanceToCenter).toBeLessThan(20);
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'hero-movement-test.png' });
  });
});