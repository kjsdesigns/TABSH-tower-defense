/**
 * PlaceholderAssets.js
 * 
 * Creates procedural placeholder assets for missing game resources.
 * These provide functional fallbacks while maintaining visual clarity about what's missing.
 */

export class PlaceholderAssets {
  static createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  static createHeroImage(type = 'knight', size = 64) {
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background circle
    const color = type === 'knight' ? '#4a90e2' : '#7ed321';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Symbol
    ctx.fillStyle = '#fff';
    ctx.font = `${size / 3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type === 'knight' ? '⚔' : '🏹', size / 2, size / 2);
    
    return canvas;
  }

  static createTowerImage(type = 'point', size = 64) {
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    const colors = {
      'point': '#9013fe',
      'splash': '#f5a623',
      'barracks': '#50e3c2'
    };
    
    const symbols = {
      'point': '●',
      'splash': '💥',
      'barracks': '🏰'
    };
    
    // Background square
    ctx.fillStyle = colors[type] || '#666';
    ctx.fillRect(2, 2, size - 4, size - 4);
    
    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    
    // Symbol
    ctx.fillStyle = '#fff';
    ctx.font = `${size / 3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbols[type] || '?', size / 2, size / 2);
    
    return canvas;
  }

  static createEnemyImage(type = 'drone', size = 64) {
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    const colors = {
      'drone': '#d0021b',
      'leaf_blower': '#417505',
      'trench_digger': '#8b572a',
      'trench_walker': '#9b59b6'
    };
    
    const symbols = {
      'drone': '🚁',
      'leaf_blower': '🍃',
      'trench_digger': '⛏',
      'trench_walker': '🦎'
    };
    
    // Background diamond
    ctx.fillStyle = colors[type] || '#d0021b';
    ctx.beginPath();
    ctx.moveTo(size / 2, 2);
    ctx.lineTo(size - 2, size / 2);
    ctx.lineTo(size / 2, size - 2);
    ctx.lineTo(2, size / 2);
    ctx.closePath();
    ctx.fill();
    
    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Symbol
    ctx.fillStyle = '#fff';
    ctx.font = `${size / 4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbols[type] || '👾', size / 2, size / 2);
    
    return canvas;
  }

  static createProjectileImage(type = 'arrow', size = 16) {
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    if (type === 'arrow') {
      // Draw arrow
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, size / 2);
      ctx.lineTo(size - 4, size / 2);
      ctx.stroke();
      
      // Arrowhead
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.moveTo(size - 2, size / 2);
      ctx.lineTo(size - 6, size / 2 - 3);
      ctx.lineTo(size - 6, size / 2 + 3);
      ctx.closePath();
      ctx.fill();
    } else {
      // Generic projectile
      ctx.fillStyle = '#ffa500';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return canvas;
  }

  static createUnitImage(type = 'soldier', size = 32) {
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#cd5c5c';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Symbol
    ctx.fillStyle = '#fff';
    ctx.font = `${size / 3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛡', size / 2, size / 2);
    
    return canvas;
  }

  static createBackgroundImage(width = 800, height = 600, levelName = 'Level') {
    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#87ceeb');  // Sky blue
    gradient.addColorStop(0.7, '#98fb98'); // Pale green
    gradient.addColorStop(1, '#228b22');   // Forest green
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add some basic terrain features
    ctx.fillStyle = 'rgba(139, 69, 19, 0.3)'; // Brown for paths
    for (let i = 0; i < 3; i++) {
      const y = (height / 4) * (i + 1);
      ctx.beginPath();
      ctx.ellipse(width / 2, y, width / 3, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Level name
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(levelName, 20, 30);
    
    return canvas;
  }

  static async generateAllPlaceholders() {
    const placeholders = new Map();
    
    // Heroes
    placeholders.set('assets/heroes/knight.png', this.createHeroImage('knight'));
    placeholders.set('assets/heroes/archer.png', this.createHeroImage('archer'));
    
    // Towers
    placeholders.set('assets/towers/pointTower.png', this.createTowerImage('point'));
    placeholders.set('assets/towers/splashTower.png', this.createTowerImage('splash'));
    placeholders.set('assets/towers/barracksTower.png', this.createTowerImage('barracks'));
    
    // Enemies
    placeholders.set('assets/enemies/drone.png', this.createEnemyImage('drone'));
    placeholders.set('assets/enemies/leaf_blower.png', this.createEnemyImage('leaf_blower'));
    placeholders.set('assets/enemies/trench_digger.png', this.createEnemyImage('trench_digger'));
    placeholders.set('assets/enemies/trench_walker.png', this.createEnemyImage('trench_walker'));
    placeholders.set('assets/enemies/pizza_cooker.png', this.createEnemyImage('pizza_cooker', 64));
    placeholders.set('assets/enemies/spike_tail.png', this.createEnemyImage('spike_tail', 64));
    
    // Units
    placeholders.set('assets/units/soldier.png', this.createUnitImage('soldier'));
    
    // Projectiles
    placeholders.set('assets/projectiles/arrow.png', this.createProjectileImage('arrow'));
    placeholders.set('assets/projectiles/bullet.png', this.createProjectileImage('bullet'));
    
    // Backgrounds
    placeholders.set('assets/maps/level1.png', this.createBackgroundImage(800, 600, 'Forest Path'));
    placeholders.set('assets/maps/level2.png', this.createBackgroundImage(800, 600, 'Mountain Pass'));
    placeholders.set('assets/maps/level3.png', this.createBackgroundImage(800, 600, 'Desert Oasis'));
    placeholders.set('assets/maps/level4.png', this.createBackgroundImage(800, 600, 'Volcanic Crater'));
    
    return placeholders;
  }

  static canvasToDataUrl(canvas, type = 'image/png') {
    return canvas.toDataURL(type);
  }

  static async saveCanvasAsBlob(canvas, type = 'image/png') {
    return new Promise(resolve => {
      canvas.toBlob(resolve, type);
    });
  }
}