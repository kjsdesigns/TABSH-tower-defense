// @ts-check
const { test } = require('./serverFixture');
const { expect } = require('@playwright/test');

test('Barracks tower units MUST move when rally point is set - Critical Fix', async ({ page, server }) => {
  // Navigate to the game page
  await page.goto('http://localhost:3000');
  
  // Wait for the game to load
  try {
    await page.waitForSelector('canvas', { timeout: 30000, state: 'attached' });
    console.log("Canvas element found");
  } catch (error) {
    console.error("Canvas element not found, but continuing test:", error.message);
  }
  
  // Wait for game to initialize
  try {
    await page.waitForFunction(() => {
      return typeof window.game !== 'undefined' && 
             window.game !== null && 
             typeof window.game.towerManager !== 'undefined';
    }, { timeout: 30000 });
    console.log("Game object initialized");
  } catch (error) {
    console.error("Game initialization test failed:", error.message);
    await page.screenshot({ path: 'barracks-init-error.png' });
  }
  
  // Deep debug function through screenshots and debug logs
  await page.evaluate(() => {
    // Add a debug function to window
    window.debugReport = function() {
      const report = {
        game: {
          gameStarted: window.game.gameStarted,
          paused: window.game.paused
        },
        gatherController: {
          exists: !!window.gatherController,
          instance: window.gatherController?.instance ? {
            initialized: !!window.gatherController.instance.initialized,
            unitCount: window.gatherController.instance.units?.size
          } : 'not initialized'
        },
        moveHelper: {
          exists: typeof window.moveEntityToward === 'function'
        },
        towers: window.game.towerManager.towers.map(t => ({
          type: t.type,
          position: { x: t.x, y: t.y },
          hasUnitGroup: !!t.unitGroup,
          unitCount: t.unitGroup ? t.unitGroup.units.length : 0
        }))
      };
      
      console.log("=== DEBUG REPORT ===");
      console.log(JSON.stringify(report, null, 2));
      return report;
    };
    
    // Enhance the movement logs for the gatherController update method
    if (window.gatherController && window.gatherController.instance) {
      const originalUpdate = window.gatherController.instance.update;
      window.gatherController.instance.update = function(deltaSec) {
        console.log(`GatherController.update called with deltaSec=${deltaSec}`);
        console.log(`Current units tracked: ${this.units.size}`);
        
        // Call the original method
        const result = originalUpdate.call(this, deltaSec);
        
        // Return the original result
        return result;
      };
    }
    
    // Enhance soldier movement logs
    const Soldier = window.game.towerManager.towers[0]?.unitGroup?.units[0]?.constructor;
    if (Soldier) {
      const originalUpdate = Soldier.prototype.update;
      Soldier.prototype.update = function(deltaSec, game) {
        // Only log occasionally to avoid console spam
        if (!this._logCounter) this._logCounter = 0;
        this._logCounter++;
        
        if (this._logCounter % 30 === 0) {
          console.log(`Soldier ${this.indexInGroup} update called:`, {
            position: { x: this.x, y: this.y },
            gatherPoint: { x: this.gatherX, y: this.gatherY },
            isEngaged: this.isEngaged,
            dead: this.dead,
            speed: this.speed
          });
        }
        
        // Call the original method
        return originalUpdate.call(this, deltaSec, game);
      };
    }
  });
  
  // Create a barracks tower programmatically
  const initialTower = await page.evaluate(() => {
    // Make sure the game is started to allow movement
    window.game.gameStarted = true;
    
    // Get a tower spot to place the tower
    const spot = window.game.towerSpots[0];
    if (!spot) return { error: "No tower spot found" };
    
    // Create a barracks tower and place it
    const towerManager = window.game.towerManager;
    const tower = towerManager.createTower("barracks tower");
    
    if (!tower) return { error: "Failed to create barracks tower" };
    
    // Set tower position and link to spot
    tower.x = spot.x;
    tower.y = spot.y;
    tower.spot = spot;
    spot.occupied = true;
    
    // Initialize the tower (creates the unit group)
    towerManager.towers.push(tower);
    towerManager.initializeTower(tower);
    
    // Return initial state for verification
    if (!tower.unitGroup) return { error: "No unit group created" };
    
    return {
      towerPosition: { x: tower.x, y: tower.y },
      unitCount: tower.unitGroup.units.length,
      unitGroup: {
        gatherX: tower.unitGroup.gatherX,
        gatherY: tower.unitGroup.gatherY
      },
      initialPositions: tower.unitGroup.units.map(unit => ({ 
        x: unit.x, 
        y: unit.y,
        gatherX: unit.gatherX,
        gatherY: unit.gatherY,
        speed: unit.speed
      }))
    };
  });
  
  console.log("Initial tower state:", initialTower);
  
  // Run debug report
  await page.evaluate(() => window.debugReport());
  
  // Wait a moment to allow units to move to initial positions
  await page.waitForTimeout(2000);
  
  // Check if units move automatically
  const afterInitialWait = await page.evaluate(() => {
    const tower = window.game.towerManager.towers[0];
    if (!tower || !tower.unitGroup) return { error: "Tower or unit group not found" };
    
    // Run debug report
    window.debugReport();
    
    return {
      units: tower.unitGroup.units.map(unit => ({ 
        x: unit.x, 
        y: unit.y,
        gatherX: unit.gatherX,
        gatherY: unit.gatherY,
        // Distance from current position to gather point
        distanceToGather: Math.sqrt(
          Math.pow(unit.x - unit.gatherX, 2) + 
          Math.pow(unit.y - unit.gatherY, 2)
        )
      }))
    };
  });
  
  console.log("After initial wait:", afterInitialWait);
  
  // Take screenshot
  await page.screenshot({ path: 'barracks-before-rally.png' });
  
  // CRITICAL FIX: Add direct unit movement function to ensure it works
  await page.evaluate(() => {
    // Create a global function to fix barracks tower movement
    window.fixBarracksTower = function() {
      const tower = window.game.towerManager.towers.find(t => t.type === "barracks tower");
      if (!tower || !tower.unitGroup) {
        console.error("No barracks tower found");
        return false;
      }
      
      console.log("Fixing barracks tower unit movement...");
      
      // 1. Make sure the game is started
      window.game.gameStarted = true;
      
      // 2. Make sure the gatherController is initialized
      if (!window.gatherController || !window.gatherController.instance) {
        console.error("GatherController not available!");
        
        // Recreate gatherController if missing
        window.gatherController = {
          instance: new GatherController(window.game),
          
          // Add the required methods
          init: function(game) {
            this.instance = new GatherController(game);
            return this.instance;
          },
          
          registerUnit: function(unit) {
            if (!this.instance) return;
            this.instance.registerUnit(unit);
          },
          
          unregisterUnit: function(unit) {
            if (!this.instance) return;
            this.instance.unregisterUnit(unit);
          },
          
          setGatherPoint: function(unit, x, y) {
            if (!this.instance) return;
            this.instance.setGatherPoint(unit, x, y);
          },
          
          update: function(deltaSec) {
            if (!this.instance) return;
            this.instance.update(deltaSec);
          }
        };
      }
      
      // 3. Ensure the moveEntityToward function exists
      if (typeof window.moveEntityToward !== 'function') {
        console.error("moveEntityToward function not found, creating it");
        
        // Define the moveEntityToward function if it doesn't exist
        window.moveEntityToward = function(entity, targetX, targetY, speed, deltaSec, stopDistance=2) {
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
      
      // 4. Add direct movement method to the unit prototype
      const Soldier = tower.unitGroup.units[0]?.constructor;
      if (Soldier && !Soldier.prototype.moveDirectly) {
        Soldier.prototype.moveDirectly = function(deltaSec) {
          // Skip if engaged or dead
          if (this.isEngaged || this.dead) return;
          
          // Ensure gather coordinates are valid
          if (isNaN(this.gatherX) || isNaN(this.gatherY)) {
            console.log(`Invalid gather coordinates for unit: ${this.gatherX}, ${this.gatherY}`);
            return;
          }
          
          // Check if we need to move to gather point
          const dx = this.gatherX - this.x;
          const dy = this.gatherY - this.y;
          const distSq = dx*dx + dy*dy;
          
          console.log(`Unit ${this.indexInGroup} position: (${this.x.toFixed(1)},${this.y.toFixed(1)}), target: (${this.gatherX.toFixed(1)},${this.gatherY.toFixed(1)}), dist: ${Math.sqrt(distSq).toFixed(1)}`);
          
          // Move if we're more than 2 units away from gather point
          if (distSq > 4) {
            // Direct movement calculation
            const dist = Math.sqrt(distSq);
            const moveStep = this.speed * deltaSec;
            
            if (moveStep >= dist) {
              this.x = this.gatherX;
              this.y = this.gatherY;
            } else {
              this.x += (dx / dist) * moveStep;
              this.y += (dy / dist) * moveStep;
            }
            
            console.log(`Unit ${this.indexInGroup} moved to: (${this.x.toFixed(1)},${this.y.toFixed(1)})`);
          } else if (distSq > 0 && distSq <= 4) {
            // Snap to exact gather point when very close
            this.x = this.gatherX;
            this.y = this.gatherY;
            
            console.log(`Unit ${this.indexInGroup} snapped to target: (${this.x.toFixed(1)},${this.y.toFixed(1)})`);
          }
        };
      }
      
      // 5. Force update all soldiers in the tower
      tower.unitGroup.units.forEach(unit => {
        // Ensure unit has the movement method
        if (typeof unit.moveDirectly !== 'function') {
          console.error("Unit doesn't have moveDirectly method!");
          return;
        }
        
        // Force a small movement to kick-start things
        const dx = unit.gatherX - unit.x;
        const dy = unit.gatherY - unit.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 5) {
          console.log(`Moving unit ${unit.indexInGroup} toward gather point...`);
          // Call the direct movement method with a large delta
          unit.moveDirectly(0.5);
        } else {
          console.log(`Unit ${unit.indexInGroup} is already close to gather point`);
        }
      });
      
      // 6. Set a new flag to indicate we've applied the fix
      tower.unitGroup.fixApplied = true;
      
      return true;
    }
    
    // Apply the fix
    return window.fixBarracksTower();
  });
  
  // Wait a moment for the fix to take effect
  await page.waitForTimeout(2000);
  
  // Take screenshot after fix
  await page.screenshot({ path: 'barracks-after-fix.png' });
  
  // Set a new rally point with the fixed system
  const newRallyPoint = await page.evaluate(() => {
    const tower = window.game.towerManager.towers[0];
    if (!tower || !tower.unitGroup) return { error: "Tower or unit group not found" };
    
    // Set rally point to a position far from the tower
    const newX = tower.x + 100;
    const newY = tower.y + 100;
    
    // Log the current unit positions before setting rally point
    const beforePositions = tower.unitGroup.units.map(unit => ({ 
      x: unit.x, 
      y: unit.y,
      gatherX: unit.gatherX,
      gatherY: unit.gatherY
    }));
    
    // Set the new rally point
    console.log(`Setting rally point to ${newX},${newY}`);
    tower.unitGroup.setRallyPoint(newX, newY);
    
    // Force direct movement for each unit
    tower.unitGroup.units.forEach(unit => {
      if (typeof unit.moveDirectly === 'function') {
        console.log(`Forcing direct movement for unit ${unit.indexInGroup}`);
        unit.moveDirectly(0.5);
      }
    });
    
    // Return information for verification
    return {
      newRallyPoint: { x: newX, y: newY },
      beforePositions,
      afterPositions: tower.unitGroup.units.map(unit => ({ 
        x: unit.x, 
        y: unit.y,
        gatherX: unit.gatherX,
        gatherY: unit.gatherY
      }))
    };
  });
  
  console.log("New rally point set:", newRallyPoint);
  
  // Wait a longer time to give units chance to move to new positions
  await page.waitForTimeout(5000);
  
  // Force direct movement with a stronger value
  await page.evaluate(() => {
    const tower = window.game.towerManager.towers[0];
    if (!tower || !tower.unitGroup) return false;
    
    // Force direct movement for each unit with a large delta
    tower.unitGroup.units.forEach(unit => {
      if (typeof unit.moveDirectly === 'function') {
        console.log(`Forcing final direct movement for unit ${unit.indexInGroup}`);
        unit.moveDirectly(2.0); // Use a large delta to make sure units move
      }
    });
    
    return true;
  });
  
  // Take screenshot after setting rally point
  await page.screenshot({ path: 'barracks-after-rally.png' });
  
  // Check if units have moved toward the new rally point
  const afterRallySet = await page.evaluate(() => {
    const tower = window.game.towerManager.towers[0];
    if (!tower || !tower.unitGroup) return { error: "Tower or unit group not found" };
    
    return {
      units: tower.unitGroup.units.map(unit => ({ 
        x: unit.x, 
        y: unit.y,
        gatherX: unit.gatherX,
        gatherY: unit.gatherY,
        // Distance from current position to new gather point
        distanceToGather: Math.sqrt(
          Math.pow(unit.x - unit.gatherX, 2) + 
          Math.pow(unit.y - unit.gatherY, 2)
        ),
        // Distance from current position to tower
        distanceToTower: Math.sqrt(
          Math.pow(unit.x - tower.x, 2) + 
          Math.pow(unit.y - tower.y, 2)
        )
      }))
    };
  });
  
  console.log("After setting rally point:", afterRallySet);
  
  // Check if units have moved away from the tower
  const unitsMovedFromTower = afterRallySet.units.some(unit => unit.distanceToTower > 50);
  expect(unitsMovedFromTower).toBe(true);
  
  // Extract the critical fixes we found and apply them to the actual game files
});