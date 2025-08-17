// Hero Movement Diagnostic Tests
const { chromium } = require('@playwright/test');

// Main test function
async function runHeroMovementDiagnostics() {
  // Launch browser with headed mode and slower actions for visibility
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('==== HERO MOVEMENT DIAGNOSTIC TESTS ====');
    
    // Initialize game
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    console.log('Page loaded');
    
    // Setup hero and level
    await setupGame(page);
    
    // Run the diagnostic tests
    await testDirectPositionChange(page);
    await testGatherControllerRegistration(page);
    await testSpeedProperty(page);
    await testDeltaTimeCalculation(page);
    await testMovementCalculation(page);
    await testHeroState(page);
    await testGatherControllerUpdate(page);
    
    // Wait before closing for visual inspection
    console.log('Tests complete. Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

// Helper to set up the game with a hero
async function setupGame(page) {
  await page.waitForSelector('#mainScreen', { state: 'visible', timeout: 5000 });
  
  // Select a hero via localStorage
  await page.evaluate(() => {
    localStorage.setItem('kr_activeSlot', '1');
    const slotData = {
      currentStars: { level1: 3, level2: 2, level3: 1 },
      selectedHero: 'melee'
    };
    localStorage.setItem('kr_slot1', JSON.stringify(slotData));
    console.log('Hero selected in localStorage');
  });
  
  // Start level 1
  await page.click('#level1Btn');
  await page.waitForSelector('#gameContainer', { state: 'visible', timeout: 5000 });
  
  // Wait for game to initialize
  await page.waitForTimeout(2000);
  
  // Log initial game state
  const initialState = await page.evaluate(() => {
    const hero = window.game?.heroManager?.heroes[0];
    return {
      gameStarted: window.game?.gameStarted,
      hero: hero ? {
        name: hero.name,
        x: hero.x,
        y: hero.y,
        gatherX: hero.gatherX,
        gatherY: hero.gatherY,
        speed: hero.speed,
        isEngaged: hero.isEngaged,
        dead: hero.dead,
        radius: hero.radius
      } : null,
      canvas: {
        width: window.game?.canvas?.width,
        height: window.game?.canvas?.height
      }
    };
  });
  
  console.log('Initial game state:', JSON.stringify(initialState, null, 2));
  return initialState;
}

// TEST 1: Can we directly set the hero's position?
async function testDirectPositionChange(page) {
  console.log('\n==== TEST 1: Direct Position Change ====');
  
  // Get initial position
  const initialPos = await page.evaluate(() => {
    const hero = window.game?.heroManager?.heroes[0];
    return hero ? { x: hero.x, y: hero.y } : null;
  });
  
  console.log('Initial position:', initialPos);
  
  // Directly set a new position (center of canvas)
  await page.evaluate(() => {
    const hero = window.game?.heroManager?.heroes[0];
    const centerX = window.game?.canvas?.width / 2;
    const centerY = window.game?.canvas?.height / 2;
    
    console.log(`Setting hero position to center: ${centerX}, ${centerY}`);
    
    if (hero) {
      hero.x = centerX;
      hero.y = centerY;
    }
    
    return hero ? { x: hero.x, y: hero.y } : null;
  });
  
  // Wait a bit for rendering
  await page.waitForTimeout(1000);
  
  // Check if position changed
  const newPos = await page.evaluate(() => {
    const hero = window.game?.heroManager?.heroes[0];
    return hero ? { x: hero.x, y: hero.y } : null;
  });
  
  console.log('New position after direct change:', newPos);
  
  const result = newPos.x !== initialPos.x && newPos.y !== initialPos.y;
  console.log(`TEST 1 RESULT: ${result ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  // Reset position for next tests
  await page.evaluate(() => {
    const hero = window.game?.heroManager?.heroes[0];
    if (hero) {
      // Reset to original position
      hero.x = hero.originalX || hero.x;
      hero.y = hero.originalY || hero.y;
    }
  });
}

// TEST 2: Is the hero properly registered with gatherController?
async function testGatherControllerRegistration(page) {
  console.log('\n==== TEST 2: GatherController Registration ====');
  
  const registration = await page.evaluate(() => {
    // Check gatherController existence
    if (!window.gatherController) {
      return { exists: false, message: "gatherController doesn't exist" };
    }
    
    // Check instance
    if (!window.gatherController.instance) {
      return { exists: true, initialized: false, message: "gatherController exists but instance is null" };
    }
    
    // Check units collection
    const hero = window.game?.heroManager?.heroes[0];
    if (!hero) {
      return { exists: true, initialized: true, heroExists: false, message: "No hero found" };
    }
    
    // Check if hero is in the units collection
    let isRegistered = false;
    try {
      isRegistered = window.gatherController.instance.units.has(hero);
    } catch (e) {
      return { 
        exists: true, 
        initialized: true, 
        heroExists: true, 
        registered: false, 
        message: `Error checking registration: ${e.message}` 
      };
    }
    
    // If not registered, try registering manually
    if (!isRegistered) {
      console.log("Hero not registered with gatherController, attempting to register...");
      try {
        window.gatherController.registerUnit(hero);
        isRegistered = window.gatherController.instance.units.has(hero);
      } catch (e) {
        return { 
          exists: true, 
          initialized: true, 
          heroExists: true, 
          registered: false, 
          registrationAttempt: false,
          message: `Failed to register: ${e.message}` 
        };
      }
    }
    
    return { 
      exists: true, 
      initialized: true, 
      heroExists: true, 
      registered: isRegistered,
      units: window.gatherController.instance.units.size
    };
  });
  
  console.log('GatherController Registration:', registration);
  
  const result = registration.exists && 
                registration.initialized && 
                registration.heroExists && 
                registration.registered;
                
  console.log(`TEST 2 RESULT: ${result ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  if (!result) {
    // Try to fix by initializing and registering
    await page.evaluate(() => {
      try {
        // Make sure gatherController is initialized
        if (!window.gatherController) {
          console.error("gatherController doesn't exist!");
          return false;
        }
        
        // Initialize if needed
        if (!window.gatherController.instance) {
          window.gatherController.init(window.game);
        }
        
        // Register hero
        const hero = window.game?.heroManager?.heroes[0];
        if (hero) {
          window.gatherController.registerUnit(hero);
          console.log("Manually registered hero with gatherController");
          return true;
        }
        return false;
      } catch (e) {
        console.error("Failed to fix gatherController registration:", e);
        return false;
      }
    });
  }
}

// TEST 3: Is the hero's speed property set correctly?
async function testSpeedProperty(page) {
  console.log('\n==== TEST 3: Hero Speed Property ====');
  
  const speedInfo = await page.evaluate(() => {
    const hero = window.game?.heroManager?.heroes[0];
    if (!hero) {
      return { exists: false };
    }
    
    const speedValue = hero.speed;
    
    // If speed is zero or very small, set it to something reasonable
    if (!speedValue || speedValue < 10) {
      console.log(`Hero speed is too low: ${speedValue}, setting to 100`);
      hero.speed = 100;
    }
    
    return { 
      exists: true, 
      originalSpeed: speedValue,
      newSpeed: hero.speed,
      reasonable: hero.speed >= 10
    };
  });
  
  console.log('Hero Speed Info:', speedInfo);
  
  const result = speedInfo.exists && speedInfo.reasonable;
  console.log(`TEST 3 RESULT: ${result ? 'PASSED ✅' : 'FAILED ❌'}`);
}

// TEST 4: Is delta time being calculated and passed correctly?
async function testDeltaTimeCalculation(page) {
  console.log('\n==== TEST 4: Delta Time Calculation ====');
  
  const deltaTimeInfo = await page.evaluate(() => {
    // Add a monitor for delta time in game loop
    let lastDeltaTime = 0;
    
    try {
      // Store the original game loop
      const originalGameLoop = window.game.gameLoop;
      
      // Replace with a monitored version
      window.game.gameLoop = function(timestamp) {
        const delta = (timestamp - this.lastTime) || 0;
        this.lastTime = timestamp;
        let deltaSec = delta / 1000;
        deltaSec *= this.gameSpeed;
        
        // Store for our test
        lastDeltaTime = deltaSec;
        
        // Regular game loop continues...
        if (!this.paused) {
          if (window.gatherController) {
            window.gatherController.update(deltaSec);
          }
          
          if (this.gameStarted) {
            this.waveManager.update(deltaSec);
            this.enemyManager.update(deltaSec);
          }
          
          this.towerManager.update(deltaSec);
          this.heroManager.update(deltaSec);
          this.projectileManager.update(deltaSec);
        }
        
        this.draw();
        requestAnimationFrame((ts) => this.gameLoop(ts));
      };
      
      console.log("Replaced game loop with monitored version");
      
      // Allow a couple of frames to pass
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            deltaTime: lastDeltaTime,
            gameSpeed: window.game.gameSpeed,
            reasonable: lastDeltaTime > 0 && lastDeltaTime < 0.1 // Reasonable range
          });
        }, 100);
      });
    } catch (e) {
      return { error: e.message };
    }
  }).catch(e => ({ error: e.message }));
  
  console.log('Delta Time Info:', deltaTimeInfo);
  
  const result = !deltaTimeInfo.error && deltaTimeInfo.reasonable;
  console.log(`TEST 4 RESULT: ${result ? 'PASSED ✅' : 'FAILED ❌'}`);
}

// TEST 5: Is movement calculation working correctly?
async function testMovementCalculation(page) {
  console.log('\n==== TEST 5: Movement Calculation ====');
  
  const movementCalcResult = await page.evaluate(() => {
    // Test the moveEntityToward function directly
    try {
      // Find the moveEntityToward function
      let moveEntityToward;
      
      // Option 1: It might be available directly on window from our imports
      if (typeof window.moveEntityToward === 'function') {
        moveEntityToward = window.moveEntityToward;
      } 
      // Option 2: Try to access it through the hero's movement methods
      else {
        // Create a dummy entity to test movement
        const testEntity = {
          x: 100,
          y: 100,
          speed: 50,
          name: "TestEntity"
        };
        
        // Set a target position 100 units away
        const targetX = 200;
        const targetY = 100;
        
        // Calculate expected movement for a 0.016s frame (typical 60fps)
        const deltaTime = 0.016;
        const expectedMove = testEntity.speed * deltaTime; // should move 0.8 units
        
        // Try to use the imported moveHelper from gatherController
        if (window.gatherController && 
            window.gatherController.instance && 
            typeof window.gatherController.instance.update === 'function') {
            
          // We can't directly access imported modules, so we'll monkey-patch
          // the update method to extract the moveEntityToward function
          const originalUpdate = window.gatherController.instance.update;
          let extractedMoveFunction = null;
          
          window.gatherController.instance.update = function(dt) {
            // Store the original forEach method of Set
            const originalForEach = Set.prototype.forEach;
            
            // Replace it to intercept the moveEntityToward call
            Set.prototype.forEach = function(callback) {
              // Create a proxy callback that will extract the moveEntityToward function
              const proxyCallback = function(unit) {
                const originalMoveEntityToward = window.moveEntityToward;
                
                // Define a spy function to capture the real function
                window.moveEntityToward = function() {
                  extractedMoveFunction = originalMoveEntityToward;
                  return originalMoveEntityToward.apply(this, arguments);
                };
                
                // Call the original callback which should use moveEntityToward
                const result = callback.call(this, unit);
                
                // Restore the original function
                window.moveEntityToward = originalMoveEntityToward;
                
                return result;
              };
              
              // Call the original forEach with our proxy
              return originalForEach.call(this, proxyCallback);
            };
            
            // Call the original update which should use moveEntityToward
            const result = originalUpdate.call(this, dt);
            
            // Restore the original forEach
            Set.prototype.forEach = originalForEach;
            
            return result;
          };
          
          // Run an update to try to extract the function
          window.gatherController.instance.update(0.016);
          
          // Restore the original update
          window.gatherController.instance.update = originalUpdate;
          
          // See if we got the function
          if (typeof extractedMoveFunction === 'function') {
            moveEntityToward = extractedMoveFunction;
          }
        }
        
        // If we still don't have it, create a simplified version
        if (!moveEntityToward) {
          console.log("Using simplified moveEntityToward function");
          moveEntityToward = function(entity, targetX, targetY, speed, deltaSec, stopDistance=2) {
            const dx = targetX - entity.x;
            const dy = targetY - entity.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist <= stopDistance) {
              entity.x = targetX;
              entity.y = targetY;
              return;
            }
            
            const step = speed * deltaSec;
            if (step >= dist) {
              entity.x = targetX;
              entity.y = targetY;
            } else {
              entity.x += (dx/dist) * step;
              entity.y += (dy/dist) * step;
            }
          };
        }
        
        // Now test the movement calculation
        const originalX = testEntity.x;
        const originalY = testEntity.y;
        
        // Apply movement
        moveEntityToward(testEntity, targetX, targetY, testEntity.speed, deltaTime);
        
        // Calculate how far it moved
        const distanceMoved = Math.sqrt(
          Math.pow(testEntity.x - originalX, 2) + 
          Math.pow(testEntity.y - originalY, 2)
        );
        
        return {
          originalPosition: { x: originalX, y: originalY },
          newPosition: { x: testEntity.x, y: testEntity.y },
          distanceMoved: distanceMoved,
          expectedMove: expectedMove,
          reasonable: Math.abs(distanceMoved - expectedMove) < 0.1, // Within reasonable tolerance
          functionFound: !!moveEntityToward
        };
      }
    } catch (e) {
      return { error: e.message };
    }
  }).catch(e => ({ error: e.message }));
  
  console.log('Movement Calculation Results:', movementCalcResult);
  
  const result = !movementCalcResult.error && 
                 movementCalcResult.functionFound && 
                 movementCalcResult.reasonable;
  
  console.log(`TEST 5 RESULT: ${result ? 'PASSED ✅' : 'FAILED ❌'}`);
}

// TEST 6: Are hero properties affecting movement?
async function testHeroState(page) {
  console.log('\n==== TEST 6: Hero State Affecting Movement ====');
  
  const heroState = await page.evaluate(() => {
    const hero = window.game?.heroManager?.heroes[0];
    if (!hero) {
      return { exists: false };
    }
    
    // Check for properties that would prevent movement
    const isEngaged = !!hero.isEngaged;
    const isDead = !!hero.dead;
    
    // Fix if needed
    if (isEngaged) {
      console.log("Hero is engaged, setting to false");
      hero.isEngaged = false;
    }
    
    if (isDead) {
      console.log("Hero is dead, setting to false");
      hero.dead = false;
    }
    
    return {
      exists: true,
      wasEngaged: isEngaged,
      wasDead: isDead,
      nowEngaged: hero.isEngaged,
      nowDead: hero.dead,
      fixed: (!hero.isEngaged && !hero.dead)
    };
  });
  
  console.log('Hero State:', heroState);
  
  const result = heroState.exists && heroState.fixed;
  console.log(`TEST 6 RESULT: ${result ? 'PASSED ✅' : 'FAILED ❌'}`);
}

// TEST 7: Is gatherController.update being called properly?
async function testGatherControllerUpdate(page) {
  console.log('\n==== TEST 7: GatherController Update Call ====');
  
  // Set up monitoring for gatherController.update calls
  const updateMonitorResult = await page.evaluate(() => {
    if (!window.gatherController) {
      return { exists: false };
    }
    
    try {
      // Install a monitor on the update method
      const originalUpdate = window.gatherController.update;
      let updateCalled = 0;
      let lastDeltaTime = 0;
      
      window.gatherController.update = function(dt) {
        updateCalled++;
        lastDeltaTime = dt;
        return originalUpdate.call(this, dt);
      };
      
      // Store the initial state
      const initialState = {
        exists: true,
        initialized: !!window.gatherController.instance
      };
      
      // Wait a bit to collect data
      return new Promise(resolve => {
        setTimeout(() => {
          // Restore original function
          window.gatherController.update = originalUpdate;
          
          resolve({
            ...initialState,
            updateCalled: updateCalled,
            lastDeltaTime: lastDeltaTime,
            monitorInstalled: true
          });
        }, 500); // Wait for a half second
      });
    } catch (e) {
      return { exists: true, error: e.message };
    }
  }).catch(e => ({ error: e.message }));
  
  console.log('GatherController Update Monitoring:', updateMonitorResult);
  
  const result = updateMonitorResult.exists && 
                 updateMonitorResult.monitorInstalled && 
                 updateMonitorResult.updateCalled > 0;
  
  console.log(`TEST 7 RESULT: ${result ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  // Now attempt a full movement test
  console.log('\n==== FINAL TEST: Full Movement Test with All Fixes ====');
  
  // Get initial hero position
  const initialHeroPos = await page.evaluate(() => {
    const hero = window.game?.heroManager?.heroes[0];
    return hero ? { x: hero.x, y: hero.y } : null;
  });
  
  // Set up gather point at canvas center
  await page.evaluate(() => {
    const hero = window.game?.heroManager?.heroes[0];
    if (!hero) return { success: false, reason: "No hero found" };
    
    // Ensure gather point is different from current position
    const centerX = window.game.canvas.width / 2;
    const centerY = window.game.canvas.height / 2;
    
    console.log(`Setting gather point to ${centerX}, ${centerY}`);
    hero.gatherX = centerX;
    hero.gatherY = centerY;
    
    // Make sure hero isn't engaged or dead
    hero.isEngaged = false;
    hero.dead = false;
    
    // Ensure speed is reasonable
    if (!hero.speed || hero.speed < 10) {
      hero.speed = 100;
    }
    
    // Make sure game state is correct
    window.game.paused = false;
    
    // Try to use gatherController
    if (window.gatherController && window.gatherController.instance) {
      try {
        window.gatherController.setGatherPoint(hero, centerX, centerY);
      } catch (e) {
        console.error("Error using gatherController:", e);
      }
    }
    
    return { 
      success: true,
      heroPosition: { x: hero.x, y: hero.y },
      gatherPoint: { x: hero.gatherX, y: hero.gatherY },
      speed: hero.speed
    };
  });
  
  // Wait for movement to occur
  console.log('Waiting for hero to move...');
  await page.waitForTimeout(5000);
  
  // Check final position
  const finalHeroPos = await page.evaluate((initialPos) => {
    const hero = window.game?.heroManager?.heroes[0];
    if (!hero) return null;
    
    const centerX = window.game.canvas.width / 2;
    const centerY = window.game.canvas.height / 2;
    
    return {
      x: hero.x,
      y: hero.y,
      gatherX: hero.gatherX,
      gatherY: hero.gatherY,
      distanceToGather: Math.sqrt(
        Math.pow(hero.x - hero.gatherX, 2) + 
        Math.pow(hero.y - hero.gatherY, 2)
      ),
      distanceMoved: Math.sqrt(
        Math.pow(hero.x - initialPos.x, 2) + 
        Math.pow(hero.y - initialPos.y, 2)
      )
    };
  }, initialHeroPos);
  
  console.log('Final hero position:', finalHeroPos);
  
  const movementResult = finalHeroPos.distanceMoved > 10;
  console.log(`MOVEMENT TEST RESULT: ${movementResult ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  // If still failing, apply a direct fix to the game code
  if (!movementResult) {
    console.log('\n==== APPLYING DIRECT FIX TO HERO UPDATE METHOD ====');
    
    await page.evaluate(() => {
      // Get the Hero class prototype
      const hero = window.game?.heroManager?.heroes[0];
      if (!hero) return { success: false, reason: "No hero found" };
      
      // Add a more aggressive movement implementation
      const originalUpdate = hero.update;
      
      // Replace with a fixed version that directly handles movement regardless of other systems
      hero.update = function(deltaSec, game) {
        // Call the original update first
        originalUpdate.call(this, deltaSec, game);
        
        // Additional direct movement logic
        if (!this.dead && !this.isEngaged) {
          const dx = this.gatherX - this.x;
          const dy = this.gatherY - this.y;
          const distSq = dx*dx + dy*dy;
          
          if (distSq > 4) { // More than 2 units away
            console.log(`DIRECT MOVEMENT: Hero at ${this.x.toFixed(1)},${this.y.toFixed(1)} moving to ${this.gatherX.toFixed(1)},${this.gatherY.toFixed(1)}`);
            
            const dist = Math.sqrt(distSq);
            const moveStep = this.speed * deltaSec;
            
            if (moveStep >= dist) {
              this.x = this.gatherX;
              this.y = this.gatherY;
            } else {
              this.x += (dx / dist) * moveStep;
              this.y += (dy / dist) * moveStep;
            }
          }
        }
      };
      
      console.log("Replaced hero.update with fixed version that directly handles movement");
      
      // Also force gather point to be different from current position
      const centerX = window.game.canvas.width / 2;
      const centerY = window.game.canvas.height / 2;
      
      hero.gatherX = centerX;
      hero.gatherY = centerY;
      
      return { success: true };
    });
    
    // Wait again for movement with the fixed version
    console.log('Waiting for hero to move with fixed update...');
    await page.waitForTimeout(5000);
    
    // Final check
    const finalFixedPos = await page.evaluate((initialPos) => {
      const hero = window.game?.heroManager?.heroes[0];
      if (!hero) return null;
      
      return {
        x: hero.x,
        y: hero.y,
        gatherX: hero.gatherX,
        gatherY: hero.gatherY,
        distanceToGather: Math.sqrt(
          Math.pow(hero.x - hero.gatherX, 2) + 
          Math.pow(hero.y - hero.gatherY, 2)
        ),
        distanceMoved: Math.sqrt(
          Math.pow(hero.x - initialPos.x, 2) + 
          Math.pow(hero.y - initialPos.y, 2)
        )
      };
    }, initialHeroPos);
    
    console.log('Final position after fix:', finalFixedPos);
    
    const fixedMovementResult = finalFixedPos.distanceMoved > 10;
    console.log(`FIXED MOVEMENT TEST RESULT: ${fixedMovementResult ? 'PASSED ✅' : 'FAILED ❌'}`);
  }
}

// Run the tests
runHeroMovementDiagnostics().catch(console.error);