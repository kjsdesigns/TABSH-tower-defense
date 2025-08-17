// Direct hero movement test - the simplest possible test
const { chromium } = require('@playwright/test');

async function directHeroTest() {
  // Launch browser with headed mode
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('==== DIRECT HERO MOVEMENT TEST ====');
    
    // Navigate to the game
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    console.log('Page loaded');
    
    // Setup the game - start with level selection screen
    await page.waitForSelector('#mainScreen', { state: 'visible', timeout: 5000 });
    console.log('Main screen visible');
    
    // Setup localStorage
    await page.evaluate(() => {
      localStorage.setItem('kr_activeSlot', '1');
      const slotData = {
        currentStars: { level1: 3, level2: 2, level3: 1 },
        selectedHero: 'melee' 
      };
      localStorage.setItem('kr_slot1', JSON.stringify(slotData));
    });
    
    // Click level 1 button to start the game properly
    await page.click('#level1Btn');
    console.log('Clicked level 1 button');
    
    // Wait for game container to be visible
    await page.waitForSelector('#gameContainer', { state: 'visible', timeout: 5000 });
    console.log('Game container visible');
    
    // Wait for game to fully initialize
    await page.waitForTimeout(3000);
    
    // DIRECT APPROACH: Modify the hero properties directly
    console.log('Setting hero properties directly...');
    
    const initialPosition = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      if (!hero) return null;
      
      const initialPos = { x: hero.x, y: hero.y };
      console.log(`Hero initial position: ${hero.x}, ${hero.y}`);
      
      // Force gather point to be canvas center
      hero.gatherX = window.game.canvas.width / 2;
      hero.gatherY = window.game.canvas.height / 2;
      console.log(`Set gather point to: ${hero.gatherX}, ${hero.gatherY}`);
      
      // Make sure hero is not engaged or dead
      hero.isEngaged = false;
      hero.dead = false;
      
      // Ensure speed is reasonable
      hero.speed = 100;
      
      // Set visual target indicator
      hero.targetX = hero.gatherX;
      hero.targetY = hero.gatherY;
      hero.showTarget = true;
      
      return initialPos;
    });
    
    if (!initialPosition) {
      console.error('Could not find hero');
      return;
    }
    
    console.log('Initial position:', initialPosition);
    console.log('Waiting for hero to move...');
    
    // Wait for movement to occur
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000);
      
      const currentPos = await page.evaluate((startPos) => {
        const hero = window.game?.heroManager?.heroes[0];
        if (!hero) return null;
        
        return { 
          x: hero.x, 
          y: hero.y,
          distanceToStart: Math.sqrt(
            Math.pow(hero.x - startPos.x, 2) + 
            Math.pow(hero.y - startPos.y, 2)
          )
        };
      }, initialPosition);
      
      console.log(`Position after ${i+1} seconds:`, currentPos);
      
      if (currentPos.distanceToStart > 20) {
        console.log('Hero has moved!');
        break;
      }
    }
    
    // Take screenshot of final state
    await page.screenshot({ path: 'hero-direct-test.png' });
    
    // Keep browser open for inspection
    console.log('Test complete. Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
directHeroTest().catch(console.error);