/**
 * moveHelper.js
 *
 * Provides a shared function to move an entity toward a target point until within some distance.
 * 
 * Made globally accessible for debugging and direct access.
 */

/**
 * moveEntityToward(entity, targetX, targetY, speed, deltaSec, stopDistance=2)
 *   - Updates entity.x and entity.y, so that it moves toward (targetX, targetY).
 *   - If within stopDistance, it stops exactly there.
 */
// Define the function
export function moveEntityToward(entity, targetX, targetY, speed, deltaSec, stopDistance=2) {
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
    // We're close enough to just snap to the target
    const oldX = entity.x;
    const oldY = entity.y;
    entity.x = targetX;
    entity.y = targetY;
    
    // Log any significant movement
    if (Math.abs(oldX - entity.x) > 0.5 || Math.abs(oldY - entity.y) > 0.5) {
      console.log(`Entity ${entity.name || 'unknown'} moved to target: ${oldX.toFixed(1)},${oldY.toFixed(1)} -> ${entity.x.toFixed(1)},${entity.y.toFixed(1)}`);
    }
  } else {
    // Move a step toward the target
    const oldX = entity.x;
    const oldY = entity.y;
    entity.x += (dx/dist) * step;
    entity.y += (dy/dist) * step;
    
    // Log any significant movement
    if (Math.abs(oldX - entity.x) > 0.5 || Math.abs(oldY - entity.y) > 0.5) {
      console.log(`Entity ${entity.name || 'unknown'} moved step: ${oldX.toFixed(1)},${oldY.toFixed(1)} -> ${entity.x.toFixed(1)},${entity.y.toFixed(1)}`);
    }
  }
}

// Make it globally accessible after definition
window.moveEntityToward = moveEntityToward;
