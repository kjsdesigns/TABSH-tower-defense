// A simplified test to debug hero movement
const { chromium } = require('@playwright/test');

async function debugHeroMovement() {
  // Launch browser with headed mode
  const browser = await chromium.launch({ headless: false, slowMo: 100 }); // Add slowMo to make actions more visible
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the game
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    console.log('Page loaded');
    
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
      console.log('Hero selected in localStorage');
    });
    
    // Click on level 1 to start the game
    await page.click('#level1Btn');
    console.log('Clicked level 1 button');
    
    // Wait for gameContainer to be visible
    await page.waitForSelector('#gameContainer', { state: 'visible', timeout: 5000 });
    console.log('Game container visible');
    
    // Wait for canvas to be visible
    await page.waitForSelector('#gameCanvas', { state: 'visible', timeout: 5000 });
    console.log('Canvas visible');
    
    // Wait for game to initialize
    await page.waitForTimeout(2000);
    
    // Examine the canvas size and position
    const canvasBounds = await page.locator('#gameCanvas').boundingBox();
    console.log('Canvas bounds:', canvasBounds);
    
    // First fix the uiManager handleCanvasClick to make it work correctly
    await page.evaluate(() => {
      // Fix uiManager handleCanvasClick to properly convert client coordinates to canvas coordinates
      const originalHandleClick = window.game.uiManager.handleCanvasClick;
      
      window.game.uiManager.handleCanvasClick = function(e) {
        // Get canvas rectangle
        const rect = window.game.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        console.log('Canvas click:', { 
          clientX: e.clientX, 
          clientY: e.clientY, 
          canvasX: mx, 
          canvasY: my,
          rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
        });
        
        // Now call our original logic with modified parameters
        this._handleCanvasLogic(mx, my);
      };
      
      // Create a new method that contains the original logic
      window.game.uiManager._handleCanvasLogic = function(mx, my) {
        // If setting a rally point for tower
        if(this.isSettingRallyPoint && this.rallyTower){
          if(this.rallyTower.unitGroup){
            this.rallyTower.unitGroup.setRallyPoint(mx, my);
          }
          this.isSettingRallyPoint = false;
          this.rallyTower = null;
          return;
        }

        // If hero selected, click empty => set gather for hero
        if(this.selectedHero){
          const t = this.getTowerAt(mx, my);
          const h = this.game.heroManager.getHeroAt(mx, my);
          if(!t && !h){
            console.log("Setting gather point for hero", this.selectedHero.name, "to", mx, my);
            
            // Set gather point directly on the hero
            this.selectedHero.gatherX = mx;
            this.selectedHero.gatherY = my;
            
            // Also try to use gatherController as a fallback
            try {
              window.gatherController.setGatherPoint(this.selectedHero, mx, my);
            } catch (err) {
              console.log("Using direct gather point setting instead of controller");
            }
            
            console.log("Hero gather point set to:", this.selectedHero.gatherX, this.selectedHero.gatherY);
            // Deselect hero after setting gather point
            this.selectedHero = null;
            return;
          }
        }

        // did we click a hero?
        const clickedHero = this.game.heroManager.getHeroAt(mx, my);
        if(clickedHero){
          this.selectedHero = clickedHero;
          this.selectedTower = null;
          return;
        }

        // did we click a tower?
        const clickedTower = this.getTowerAt(mx, my);
        if(clickedTower){
          this.selectedTower = clickedTower;
          this.showUpgradeTowerDialog(clickedTower);
          return;
        }

        // maybe a spot?
        const spot = this.getTowerSpotAt(mx, my);
        if(spot && !spot.occupied){
          this.showBuildTowerDialog(spot);
        }
      };
      
      console.log('Replaced handleCanvasClick with fixed version');
      
      // Now let's examine current game state
      return {
        gameStarted: window.game.gameStarted,
        gatherControllerExists: !!window.gatherController,
        gatherControllerInitialized: window.gatherController ? !!window.gatherController.instance : false,
        heroes: window.game.heroManager.heroes.map(h => ({
          name: h.name,
          x: h.x,
          y: h.y,
          gatherX: h.gatherX,
          gatherY: h.gatherY,
          radius: h.radius
        }))
      };
    });
    
    // Get hero position
    const heroPosition = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      return hero ? { x: hero.x, y: hero.y, radius: hero.radius } : null;
    });
    
    console.log('Hero position:', heroPosition);
    
    if (!heroPosition) {
      console.error('Could not find hero');
      return;
    }
    
    // Click on hero to select it
    // Make sure we click properly in the canvas coordinate system
    const clickX = heroPosition.x;
    const clickY = heroPosition.y;
    
    // Use evaluateHandle to get access to window events
    await page.evaluate(({x, y}) => {
      // Create a custom click event at canvas coordinates
      const canvas = window.game.canvas;
      const rect = canvas.getBoundingClientRect();
      
      // Convert canvas coordinates to client coordinates
      const clientX = rect.left + x;
      const clientY = rect.top + y;
      
      console.log('Simulating click at canvas coords:', x, y);
      console.log('Converted to client coords:', clientX, clientY);
      
      // Create and dispatch the event on the canvas
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: clientX,
        clientY: clientY
      });
      
      canvas.dispatchEvent(clickEvent);
    }, {x: clickX, y: clickY});
    
    console.log('Clicked on hero at position:', { x: clickX, y: clickY });
    
    // Check if hero is selected
    const heroSelected = await page.evaluate(() => {
      return window.game?.uiManager?.selectedHero !== null;
    });
    console.log('Hero selected:', heroSelected);
    
    if (!heroSelected) {
      console.error('Failed to select hero, aborting test');
      return;
    }
    
    // Define a target position - make sure it's inside canvas boundaries
    // Stay at least 50px from edges to be safe
    const canvasCenter = await page.evaluate(() => {
      return {
        x: window.game.canvas.width / 2,
        y: window.game.canvas.height / 2
      };
    });
    
    // Move toward the center of the canvas
    const targetX = canvasCenter.x;
    const targetY = canvasCenter.y;
    console.log('Target position (canvas center):', {x: targetX, y: targetY});
    
    // Click to set movement destination using the same technique
    await page.evaluate(({x, y}) => {
      // Create a custom click event at canvas coordinates
      const canvas = window.game.canvas;
      const rect = canvas.getBoundingClientRect();
      
      // Convert canvas coordinates to client coordinates
      const clientX = rect.left + x;
      const clientY = rect.top + y;
      
      console.log('Simulating target click at canvas coords:', x, y);
      console.log('Converted to client coords:', clientX, clientY);
      
      // Create and dispatch the event on the canvas
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: clientX,
        clientY: clientY
      });
      
      canvas.dispatchEvent(clickEvent);
    }, {x: targetX, y: targetY});
    
    console.log('Clicked on target position (canvas center)');
    
    // Check if gather point was set
    const gatherPointInfo = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      const selected = window.game?.uiManager?.selectedHero;
      return {
        gatherX: hero.gatherX,
        gatherY: hero.gatherY,
        heroX: hero.x,
        heroY: hero.y,
        selected: selected !== null,
        // Also check gatherController
        gatherControllerExists: typeof window.gatherController !== 'undefined',
        gatherControllerInitialized: window.gatherController ? !!window.gatherController.instance : false,
        gameStarted: window.game.gameStarted,
        paused: window.game.paused
      };
    });
    console.log('After target click:', gatherPointInfo);
    
    // Make sure game state is set correctly for hero movement to work
    await page.evaluate(() => {
      // Make sure game is in correct state for movement to work
      console.log('Ensuring game state is ready for movement');
      window.game.gameStarted = false; // Make sure this is false so our fix applies
      window.game.paused = false;
      
      // Manually force update gatherController for good measure
      if (window.gatherController && window.gatherController.instance) {
        const hero = window.game.heroManager.heroes[0];
        if (hero) {
          console.log('Forcing gatherController update');
          window.gatherController.instance.setGatherPoint(hero, hero.gatherX, hero.gatherY);
          window.gatherController.instance.update(0.016); // Simulate one frame of movement
        }
      }
    });
    
    // Wait to observe movement
    console.log('Waiting to observe movement...');
    
    // Wait longer to ensure hero has time to move visibly
    await page.waitForTimeout(5000);
    
    // Check if hero moved
    const finalPosition = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      return hero ? { 
        x: hero.x, 
        y: hero.y, 
        gatherX: hero.gatherX, 
        gatherY: hero.gatherY 
      } : null;
    });
    console.log('Final hero position after 5 seconds:', finalPosition);
    
    // Calculate distance moved
    if (finalPosition && heroPosition) {
      const distanceMoved = Math.sqrt(
        Math.pow(finalPosition.x - heroPosition.x, 2) + 
        Math.pow(finalPosition.y - heroPosition.y, 2)
      );
      console.log('Distance moved:', distanceMoved);
      
      if (distanceMoved < 10) {
        console.error('ISSUE DETECTED: Hero did not move significantly');
        
        // Try to fix the issue directly in the code
        await page.evaluate(() => {
          console.log('Attempting to fix hero movement issue');
          
          // Check game.js to make sure gatherController.update() is called regardless of gameStarted
          console.log('Original game.gameLoop function:', window.game.gameLoop);
          
          // Add a fix to force the gatherController to update always
          const originalGameLoop = window.game.gameLoop;
          window.game.gameLoop = function(timestamp) {
            const delta = (timestamp - this.lastTime) || 0;
            this.lastTime = timestamp;
            let deltaSec = delta / 1000;
            deltaSec *= this.gameSpeed;
            
            if (!this.paused) {
              // ALWAYS update gatherController regardless of game state
              if (window.gatherController) {
                window.gatherController.update(deltaSec);
              }
              
              if (this.gameStarted) {
                this.waveManager.update(deltaSec);
                this.enemyManager.update(deltaSec);
              }
              
              // Always update these systems regardless of game started state
              this.towerManager.update(deltaSec);
              this.heroManager.update(deltaSec);
              this.projectileManager.update(deltaSec);
              
              // Debug logging
              if (!this._updateCounter) this._updateCounter = 0;
              this._updateCounter++;
              
              if (this._updateCounter % 60 === 0) {
                console.log(`Game update at ${timestamp}, gameStarted = ${this.gameStarted}, paused = ${this.paused}`);
                console.log('Hero position:', this.heroManager.heroes[0]?.x, this.heroManager.heroes[0]?.y);
                console.log('Hero gather point:', this.heroManager.heroes[0]?.gatherX, this.heroManager.heroes[0]?.gatherY);
              }
            }
            
            this.draw();
            requestAnimationFrame((ts) => this.gameLoop(ts));
          };
          
          console.log('Replaced game.gameLoop with fixed version');
          
          // Also force a gather point to make sure it's working
          const hero = window.game.heroManager.heroes[0];
          if (hero) {
            // Set gather point to center of screen
            const centerX = window.game.canvas.width / 2;
            const centerY = window.game.canvas.height / 2;
            
            console.log(`Forcing hero gather point to center (${centerX}, ${centerY})`);
            hero.gatherX = centerX;
            hero.gatherY = centerY;
            
            try {
              if (window.gatherController && window.gatherController.instance) {
                window.gatherController.instance.setGatherPoint(hero, centerX, centerY);
              }
            } catch (e) {
              console.error('Error setting gather point:', e);
            }
          }
        });
        
        // Wait a bit longer to see if our fix worked
        await page.waitForTimeout(5000);
        
        // Check one more time
        const fixedPosition = await page.evaluate(() => {
          const hero = window.game?.heroManager?.heroes[0];
          return hero ? { 
            x: hero.x, 
            y: hero.y, 
            gatherX: hero.gatherX, 
            gatherY: hero.gatherY 
          } : null;
        });
        
        console.log('Position after attempted fix:', fixedPosition);
        
        // Calculate if it moved after fix
        if (fixedPosition) {
          const fixedDistanceMoved = Math.sqrt(
            Math.pow(fixedPosition.x - heroPosition.x, 2) + 
            Math.pow(fixedPosition.y - heroPosition.y, 2)
          );
          console.log('Distance moved after fix:', fixedDistanceMoved);
        }
      } else {
        console.log('SUCCESS: Hero moved as expected');
      }
    }
    
    // Keep the browser open for 10 seconds for inspection
    console.log('Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
debugHeroMovement().catch(console.error);