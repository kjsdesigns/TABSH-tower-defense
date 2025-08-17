/**
 * Integration tests for movement system
 */

const { test, expect } = require('@playwright/test');

test.describe('Movement System Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#mainScreen', { state: 'visible' });
    
    // Set up hero for testing
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

  test('should register hero with movement system', async ({ page }) => {
    const movementInfo = await page.evaluate(() => {
      const movementSystem = window.movementSystem;
      const hero = window.game?.heroManager?.heroes[0];
      
      return {
        movementSystemExists: !!movementSystem,
        heroExists: !!hero,
        heroRegistered: hero ? movementSystem.entities.has(hero) : false,
        entityCount: movementSystem.entities.size
      };
    });

    expect(movementInfo.movementSystemExists).toBe(true);
    expect(movementInfo.heroExists).toBe(true);
    expect(movementInfo.heroRegistered).toBe(true);
    expect(movementInfo.entityCount).toBeGreaterThan(0);
  });

  test('should move hero when canvas is clicked', async ({ page }) => {
    // Get initial hero position
    const initialPosition = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      return hero ? { x: hero.x, y: hero.y } : null;
    });

    expect(initialPosition).toBeTruthy();

    // Click on canvas to move hero
    const canvas = page.locator('#gameCanvas');
    await canvas.click({ position: { x: 200, y: 200 } });

    // Wait a moment for movement to be registered
    await page.waitForTimeout(100);

    // Check that movement target was set
    const movementTarget = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      const movementSystem = window.movementSystem;
      
      if (!hero || !movementSystem) return null;
      
      return {
        isMoving: movementSystem.isMoving(hero),
        target: movementSystem.getTarget(hero)
      };
    });

    expect(movementTarget.isMoving).toBe(true);
    expect(movementTarget.target).toBeTruthy();
  });

  test('should update hero position over time', async ({ page }) => {
    // Set a movement target
    await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      const movementSystem = window.movementSystem;
      
      if (hero && movementSystem) {
        movementSystem.setTarget(hero, 300, 200);
      }
    });

    // Get initial position
    const initialPosition = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      return hero ? { x: hero.x, y: hero.y } : null;
    });

    // Wait for movement updates (simulate time passing)
    await page.waitForTimeout(500);

    // Get new position after movement
    const newPosition = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      return hero ? { x: hero.x, y: hero.y } : null;
    });

    // Hero should have moved towards target
    expect(newPosition.x).not.toBe(initialPosition.x);
    expect(newPosition.y).not.toBe(initialPosition.y);
  });

  test('should respect movement priorities', async ({ page }) => {
    await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      const movementSystem = window.movementSystem;
      
      if (hero && movementSystem) {
        // Set low priority target
        movementSystem.setTarget(hero, 100, 100, { priority: 1 });
        
        // Try to override with lower priority (should fail)
        movementSystem.setTarget(hero, 300, 300, { priority: 0 });
      }
    });

    const target = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      const movementSystem = window.movementSystem;
      
      return movementSystem.getTarget(hero);
    });

    // Should still have the first target (higher priority)
    expect(target.x).toBe(100);
    expect(target.y).toBe(100);
  });

  test('should stop movement when requested', async ({ page }) => {
    // Start movement
    await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      const movementSystem = window.movementSystem;
      
      if (hero && movementSystem) {
        movementSystem.setTarget(hero, 300, 200);
      }
    });

    // Verify movement started
    let isMoving = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      const movementSystem = window.movementSystem;
      
      return movementSystem.isMoving(hero);
    });
    expect(isMoving).toBe(true);

    // Stop movement
    await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      const movementSystem = window.movementSystem;
      
      if (hero && movementSystem) {
        movementSystem.stopMovement(hero);
      }
    });

    // Verify movement stopped
    isMoving = await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      const movementSystem = window.movementSystem;
      
      return movementSystem.isMoving(hero);
    });
    expect(isMoving).toBe(false);
  });

  test('should handle barracks tower unit movement', async ({ page }) => {
    // Place a barracks tower first
    await page.evaluate(() => {
      const game = window.game;
      if (game && game.towerManager) {
        // Find a tower spot
        const spot = game.towerSpots[0];
        if (spot) {
          const tower = game.towerManager.createTower('barracks tower');
          if (tower) {
            tower.x = spot.x;
            tower.y = spot.y;
            tower.spot = spot;
            spot.occupied = true;
            game.towerManager.towers.push(tower);
            
            // Create unit group for the tower
            game.towerManager.createUnitsForTower(tower);
          }
        }
      }
    });

    // Wait for tower creation
    await page.waitForTimeout(100);

    // Check that soldiers were created and registered
    const soldierInfo = await page.evaluate(() => {
      const game = window.game;
      const movementSystem = window.movementSystem;
      
      let soldierCount = 0;
      for (const tower of game.towerManager.towers) {
        if (tower.unitGroup) {
          soldierCount += tower.unitGroup.soldiers.length;
        }
      }

      return {
        soldierCount,
        registeredEntities: movementSystem.entities.size
      };
    });

    expect(soldierInfo.soldierCount).toBeGreaterThan(0);
    expect(soldierInfo.registeredEntities).toBeGreaterThan(1); // Hero + soldiers
  });

  test('should provide movement status for debugging', async ({ page }) => {
    // Set up some movement
    await page.evaluate(() => {
      const hero = window.game?.heroManager?.heroes[0];
      const movementSystem = window.movementSystem;
      
      if (hero && movementSystem) {
        movementSystem.setTarget(hero, 250, 150, { type: 'gather' });
      }
    });

    const status = await page.evaluate(() => {
      const movementSystem = window.movementSystem;
      return movementSystem.getStatus();
    });

    expect(status).toHaveLength(1);
    expect(status[0]).toHaveProperty('name');
    expect(status[0]).toHaveProperty('position');
    expect(status[0]).toHaveProperty('target');
    expect(status[0]).toHaveProperty('isMoving');
    expect(status[0].isMoving).toBe(true);
  });

  test('should handle cleanup properly', async ({ page }) => {
    // Get initial entity count
    const initialCount = await page.evaluate(() => {
      const movementSystem = window.movementSystem;
      return movementSystem.entities.size;
    });

    // Create and remove a hero
    await page.evaluate(() => {
      const game = window.game;
      const movementSystem = window.movementSystem;
      
      // Add a new hero
      const newHero = game.heroManager.addHero({
        name: 'Test Hero',
        x: 100,
        y: 100,
        maxHp: 100,
        damage: 10,
        isMelee: true,
        speed: 80,
        attackInterval: 1.0
      });
      
      // Remove it
      game.heroManager.removeHero(newHero);
    });

    // Check that entity count returned to normal
    const finalCount = await page.evaluate(() => {
      const movementSystem = window.movementSystem;
      return movementSystem.entities.size;
    });

    expect(finalCount).toBe(initialCount);
  });
});