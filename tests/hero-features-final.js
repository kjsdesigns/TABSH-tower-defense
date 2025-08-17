// A simplified test to verify hero movement works properly
const { chromium } = require('@playwright/test');

async function verifyHeroMovement() {
  // Launch browser with headed mode
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('==== VERIFYING HERO MOVEMENT ====');
    
    // Navigate to the game
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    console.log('Page loaded');
    
    // Wait for mainScreen to be visible
    await page.waitForSelector('#mainScreen', { state: 'visible', timeout: 5000 });
    
    // Select hero in localStorage
    await page.evaluate(() => {
      localStorage.setItem('kr_activeSlot', '1');
      const slotData = {
        currentStars: { level1: 3, level2: 2, level3: 1 },
        selectedHero: 'melee' 
      };
      localStorage.setItem('kr_slot1', JSON.stringify(slotData));
    });
    
    // Click on level 1
    await page.click('#level1Btn');
    await page.waitForSelector('#gameContainer', { state: 'visible', timeout: 5000 });
    
    // Wait for game to initialize
    await page.waitForTimeout(2000);
    
    // Log initial state
    const initialState = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      return {
        gameStarted: window.game.gameStarted,
        hero: hero ? {
          name: hero.name,
          x: hero.x, 
          y: hero.y
        } : null
      };
    });
    
    console.log('Initial state:', initialState);
    
    // STEP 1: Click on hero to select it
    await page.evaluate(() => {
      const hero = window.game.heroManager.heroes[0];
      if (!hero) return;
      
      const canvas = window.game.canvas;
      const rect = canvas.getBoundingClientRect();
      
      const clickX = rect.left + hero.x;
      const clickY = rect.top + hero.y;
      
      console.log(`Clicking on hero at (${hero.x}, ${hero.y}) -> page coords (${clickX}, ${clickY})`);
      
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: clickX,
        clientY: clickY
      });
      
      canvas.dispatchEvent(clickEvent);
    });
    
    // Verify selection
    const selectionState = await page.evaluate(() => {
      return {
        selectedHero: window.game.uiManager.selectedHero !== null
      };
    });
    
    console.log('Hero selected:', selectionState.selectedHero);
    
    // If not selected, retry with more aggressive approach
    if (!selectionState.selectedHero) {
      console.log('Retrying selection with direct approach...');
      await page.evaluate(() => {
        const hero = window.game.heroManager.heroes[0];
        if (!hero) return;
        
        // Force direct selection
        window.game.uiManager.selectedHero = hero;
        console.log('Forced hero selection');
      });
    }
    
    // STEP 2: Click on canvas center to set destination
    await page.evaluate(() => {
      // Use the center of the canvas
      const canvas = window.game.canvas;
      const rect = canvas.getBoundingClientRect();
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Convert to page coordinates
      const clickX = rect.left + centerX;
      const clickY = rect.top + centerY;
      
      console.log(`Clicking at canvas center (${centerX}, ${centerY}) -> page coords (${clickX}, ${clickY})`);
      
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: clickX,
        clientY: clickY
      });
      
      canvas.dispatchEvent(clickEvent);
    });
    
    // Verify gather point was set
    const gatherState = await page.evaluate(() => {
      const hero = window.game.heroManager.heroes[0];
      const centerX = window.game.canvas.width / 2;
      const centerY = window.game.canvas.height / 2;
      
      if (!hero) return { success: false };
      
      // Check if gather point is close to center
      const dx = hero.gatherX - centerX;
      const dy = hero.gatherY - centerY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      return {
        success: true,
        gatherX: hero.gatherX,
        gatherY: hero.gatherY,
        heroX: hero.x,
        heroY: hero.y,
        centerX: centerX,
        centerY: centerY,
        distanceToCenter: dist,
        isDeselected: window.game.uiManager.selectedHero === null
      };
    });
    
    console.log('Gather point state:', gatherState);
    
    // STEP 3: Wait for hero to move (display visual progress for 10 seconds)
    console.log('Waiting for hero to move...');
    
    // Visual countdown and position monitoring for 10 seconds
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000);
      
      // Store the initial position to use in evaluation
      const startX = initialState.hero ? initialState.hero.x : 0;
      const startY = initialState.hero ? initialState.hero.y : 0;
      
      const progressState = await page.evaluate(({startX, startY}) => {
        const hero = window.game.heroManager.heroes[0];
        if (!hero) return null;
        
        const centerX = window.game.canvas.width / 2;
        const centerY = window.game.canvas.height / 2;
        
        // Calculate distance from center (target)
        const dx = hero.x - centerX;
        const dy = hero.y - centerY;
        const distToCenter = Math.sqrt(dx*dx + dy*dy);
        
        // Calculate distance from starting position
        const dxStart = hero.x - startX;
        const dyStart = hero.y - startY;
        const distFromStart = Math.sqrt(dxStart*dxStart + dyStart*dyStart);
        
        return {
          position: { x: hero.x, y: hero.y },
          distanceToCenter: distToCenter,
          distanceFromStart: distFromStart
        };
      }, {startX, startY});
      
      console.log(`Progress [${i+1}/10]: Hero at (${progressState.position.x.toFixed(1)}, ${progressState.position.y.toFixed(1)}), ` +
                  `moved ${progressState.distanceFromStart.toFixed(1)} units, ` +
                  `${progressState.distanceToCenter.toFixed(1)} units from target`);
                  
      // Take screenshot at the end
      if (i === 9) {
        await page.screenshot({ path: 'hero-movement-final.png' });
      }
    }
    
    // STEP 4: Final verification
    // Get the initial position again for final check
    const finalStartX = initialState.hero ? initialState.hero.x : 0;
    const finalStartY = initialState.hero ? initialState.hero.y : 0;
    
    const finalState = await page.evaluate(({startX, startY}) => {
      const hero = window.game.heroManager.heroes[0];
      const centerX = window.game.canvas.width / 2;
      const centerY = window.game.canvas.height / 2;
      
      if (!hero) return { success: false };
      
      // Distance from center
      const dx = hero.x - centerX;
      const dy = hero.y - centerY;
      const distToCenter = Math.sqrt(dx*dx + dy*dy);
      
      // Distance from start
      const dxStart = hero.x - startX;
      const dyStart = hero.y - startY;
      const distFromStart = Math.sqrt(dxStart*dxStart + dyStart*dyStart);
      
      return {
        success: true,
        position: { x: hero.x, y: hero.y },
        distanceToCenter: distToCenter,
        distanceFromStart: distFromStart,
        isNearCenter: distToCenter < 20,
        hasMoved: distFromStart > 20
      };
    }, {startX: finalStartX, startY: finalStartY});
    
    console.log('Final verification:', finalState);
    
    if (finalState.hasMoved) {
      console.log('MOVEMENT TEST SUCCESSFUL: Hero has moved!');
    } else {
      console.log('MOVEMENT TEST FAILED: Hero did not move significantly.');
    }
    
    // Keep browser open for 5 seconds for inspection
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
verifyHeroMovement().catch(console.error);