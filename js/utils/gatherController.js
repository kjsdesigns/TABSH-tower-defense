/**
 * gatherController.js
 *
 * Provides a single gather system for *both* hero and soldier (melee) units.
 * - Each unit has gatherX,gatherY for absolute position on the map.
 * - If not engaged (or dead), they move toward gatherX,gatherY.
 *
 * Usage:
 *   import { gatherController } from "./gatherController.js";
 *   gatherController.registerUnit(unit); // once at creation
 *   gatherController.setGatherPoint(unit, x, y); // user changes gather
 *   gatherController.update(deltaSec); // each frame
 */

import { moveEntityToward } from "./moveHelper.js";

class GatherController {
  constructor(game) {
    this.game = game;
    this.units = new Set(); // track all units (heroes + soldiers)
    this.initialized = true;
    
    // Make the controller globally accessible for debugging
    window.gatherController = gatherController;
  }

  registerUnit(unit) {
    // We ensure unit has gatherX,gatherY stored. If not present, set them to current (x,y).
    if (unit.gatherX == null) unit.gatherX = unit.x;
    if (unit.gatherY == null) unit.gatherY = unit.y;
    this.units.add(unit);
  }

  unregisterUnit(unit) {
    this.units.delete(unit);
  }

  setGatherPoint(unit, x, y) {
    console.log("setGatherPoint called for", unit.name, "to", x, y);
    
    // Make sure the unit is registered before setting its gather point
    if (!this.units.has(unit)) {
      console.log("Unit was not registered with gatherController, registering now");
      this.registerUnit(unit);
    }
    
    unit.gatherX = x;
    unit.gatherY = y;
    
    // Force a small move to get things going
    unit.x += (x > unit.x) ? 0.1 : -0.1;
    unit.y += (y > unit.y) ? 0.1 : -0.1;
    
    console.log("Gather point set, unit position:", unit.x, unit.y, "gather:", unit.gatherX, unit.gatherY);
  }

  update(deltaSec) {
    // Debug counter to limit log spam
    if (!this._debugCounter) this._debugCounter = 0;
    this._debugCounter++;
    
    this.units.forEach((u) => {
      if (u.dead) return;
      // If engaged in melee, skip
      if (u.isEngaged) return;

      // Move to gatherX/gatherY
      const dx = u.gatherX - u.x;
      const dy = u.gatherY - u.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Log movement details every 30 frames to avoid console spam
      if (this._debugCounter % 30 === 0 && dist > 2) {
        console.log("Moving unit", u.name, "from", u.x.toFixed(1), u.y.toFixed(1), 
                    "to gather point", u.gatherX.toFixed(1), u.gatherY.toFixed(1), 
                    "distance:", dist.toFixed(1));
      }
      
      if (dist > 2) {
        moveEntityToward(u, u.gatherX, u.gatherY, u.speed, deltaSec, 2);
      }
    });
  }
}

export const gatherController = {
  instance: null,

  init(game) {
    if (!this.instance) {
      this.instance = new GatherController(game);
    }
    return this.instance;
  },

  registerUnit(unit) {
    if (!this.instance) {
      console.warn("gatherController not inited yet!");
      return;
    }
    this.instance.registerUnit(unit);
  },

  unregisterUnit(unit) {
    if (!this.instance) return;
    this.instance.unregisterUnit(unit);
  },

  setGatherPoint(unit, x, y) {
    if (!this.instance) return;
    this.instance.setGatherPoint(unit, x, y);
  },

  update(deltaSec) {
    if (!this.instance) return;
    this.instance.update(deltaSec);
  }
};
