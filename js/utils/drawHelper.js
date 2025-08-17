/**
 * drawHelper.js
 *
 * Provides a shared function to draw HP bars.
 */

/**
 * drawHealthBar(ctx, x, y, currentHp, maxHp, barWidth, barHeight, offsetY)
 *   - ctx: Canvas 2D context
 *   - x, y: center or top-left for the bar (depending on usage)
 *   - currentHp, maxHp: health values
 *   - barWidth, barHeight: dimensions
 *   - offsetY: how far above or below the entity to draw
 */
export function drawHealthBar(ctx, x, y, currentHp, maxHp, barWidth, barHeight, offsetY=0) {
  if (currentHp >= maxHp) {
    return; // no need to draw a bar if fully healthy (optional)
  }

  const pct = Math.max(0, currentHp / maxHp);
  const barX = x - barWidth / 2;
  const barY = y - offsetY;

  // Background (red)
  ctx.fillStyle = "red";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Foreground (green portion)
  ctx.fillStyle = "lime";
  ctx.fillRect(barX, barY, barWidth * pct, barHeight);
}
