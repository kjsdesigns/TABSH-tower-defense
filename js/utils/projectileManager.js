/**
 * projectileManager.js
 *
 * A single place to handle ALL projectiles (from towers, heroes, etc.).
 *  - spawnProjectile(props)
 *  - update(deltaSec)
 *  - draw(ctx)
 *
 * In your main Game class, do:
 *   this.projectileManager = new ProjectileManager(this);
 * Then towerManager or heroManager calls:
 *   this.game.projectileManager.spawnProjectile({...});
 */

export class ProjectileManager {
  constructor(game) {
    this.game = game;
    this.projectiles = [];
  }

  spawnProjectile(props) {
    // props includes x, y, targetX, targetY, speed, damage, splashRadius, mainTarget, etc.
    // We add a 'hit' flag to track collisions
    this.projectiles.push({
      ...props,
      hit: false,
    });
  }

  update(deltaSec) {
    // Move each projectile
    this.projectiles.forEach(proj => {
      if (proj.hit) return; // already collided
      const step = proj.speed * deltaSec;
      const dx = proj.targetX - proj.x;
      const dy = proj.targetY - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= step) {
        proj.x = proj.targetX;
        proj.y = proj.targetY;
        proj.hit = true;
      } else {
        proj.x += (dx / dist) * step;
        proj.y += (dy / dist) * step;
      }
    });

    // Apply damage on collisions
    this.projectiles.forEach(proj => {
      if (!proj.hit) return;
      if (proj.splashRadius && proj.splashRadius > 0) {
        // splash damage
        const enemiesHit = this.game.enemies.filter(e => {
          const ex = e.x + (e.width  ? e.width / 2  : 0);
          const ey = e.y + (e.height ? e.height / 2 : 0);
          const ddx = proj.x - ex;
          const ddy = proj.y - ey;
          return ddx * ddx + ddy * ddy <= proj.splashRadius * proj.splashRadius;
        });
        enemiesHit.forEach(e => {
          if (e === proj.mainTarget) e.hp -= proj.damage;
          else e.hp -= (proj.damage / 2);
        });
      } else {
        // single-target
        if (proj.mainTarget && !proj.mainTarget.dead) {
          proj.mainTarget.hp -= proj.damage;
        }
      }
    });

    // Remove finished
    this.projectiles = this.projectiles.filter(p => !p.hit);
  }

  draw(ctx) {
    ctx.fillStyle = "cyan";
    this.projectiles.forEach(proj => {
      ctx.fillRect(proj.x - 2, proj.y - 2, 4, 4);
    });
  }
}
