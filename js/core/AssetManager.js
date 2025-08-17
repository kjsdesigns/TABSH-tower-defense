/**
 * AssetManager.js
 * 
 * Centralized asset management system with fallbacks and error handling.
 * Provides placeholder assets for missing files and validates all assets.
 */

export class AssetManager {
  constructor() {
    this.assets = new Map();
    this.loadPromises = new Map();
    this.failedAssets = new Set();
    this.placeholders = new Map();
    this.debug = false;
    
    this.createPlaceholders();
  }

  /**
   * Create placeholder assets for missing files
   */
  createPlaceholders() {
    // Create placeholder canvas for missing images
    const createPlaceholderImage = (width, height, text, color = '#666') => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      
      // Border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, width - 2, height - 2);
      
      // Text
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.min(width / 8, 16)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
      
      return canvas;
    };

    // Enemy placeholders
    this.placeholders.set('enemy', createPlaceholderImage(64, 64, 'ENEMY', '#a44'));
    
    // Tower placeholders
    this.placeholders.set('tower', createPlaceholderImage(64, 64, 'TOWER', '#4a4'));
    
    // Hero placeholders
    this.placeholders.set('hero', createPlaceholderImage(64, 64, 'HERO', '#44a'));
    
    // Background placeholder
    this.placeholders.set('background', createPlaceholderImage(800, 600, 'BACKGROUND', '#333'));
    
    // Projectile placeholder
    this.placeholders.set('projectile', createPlaceholderImage(16, 16, '•', '#fa4'));

    // Audio placeholder (silent audio)
    const createSilentAudio = () => {
      const audio = new Audio();
      // Create a minimal silent audio data URL
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCz2a2f';
      return audio;
    };
    
    this.placeholders.set('audio', createSilentAudio());
  }

  /**
   * Load an image asset with fallback
   * @param {string} path - Asset path
   * @param {string} type - Asset type for placeholder
   * @returns {Promise<HTMLImageElement|HTMLCanvasElement>}
   */
  async loadImage(path, type = 'enemy') {
    if (this.assets.has(path)) {
      return this.assets.get(path);
    }

    if (this.loadPromises.has(path)) {
      return this.loadPromises.get(path);
    }

    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.assets.set(path, img);
        if (this.debug) {
          console.log(`AssetManager: Loaded image ${path}`);
        }
        resolve(img);
      };
      
      img.onerror = () => {
        this.failedAssets.add(path);
        const placeholder = this.placeholders.get(type);
        this.assets.set(path, placeholder);
        
        console.warn(`AssetManager: Failed to load ${path}, using placeholder`);
        resolve(placeholder);
      };
      
      img.src = path;
    });

    this.loadPromises.set(path, loadPromise);
    return loadPromise;
  }

  /**
   * Load an audio asset with fallback
   * @param {string} path - Asset path
   * @returns {Promise<HTMLAudioElement>}
   */
  async loadAudio(path) {
    if (this.assets.has(path)) {
      return this.assets.get(path);
    }

    if (this.loadPromises.has(path)) {
      return this.loadPromises.get(path);
    }

    const loadPromise = new Promise((resolve) => {
      const audio = new Audio();
      
      audio.oncanplaythrough = () => {
        this.assets.set(path, audio);
        if (this.debug) {
          console.log(`AssetManager: Loaded audio ${path}`);
        }
        resolve(audio);
      };
      
      audio.onerror = () => {
        this.failedAssets.add(path);
        const placeholder = this.placeholders.get('audio');
        this.assets.set(path, placeholder);
        
        console.warn(`AssetManager: Failed to load ${path}, using silent audio`);
        resolve(placeholder);
      };
      
      audio.src = path;
    });

    this.loadPromises.set(path, loadPromise);
    return loadPromise;
  }

  /**
   * Load multiple assets in parallel
   * @param {Array} assetList - Array of {path, type} objects
   * @returns {Promise<Map>} Map of path -> asset
   */
  async loadAssets(assetList) {
    const promises = assetList.map(async ({ path, type, assetType = 'image' }) => {
      let asset;
      if (assetType === 'audio') {
        asset = await this.loadAudio(path);
      } else {
        asset = await this.loadImage(path, type);
      }
      return { path, asset };
    });

    const results = await Promise.all(promises);
    const assetMap = new Map();
    
    results.forEach(({ path, asset }) => {
      assetMap.set(path, asset);
    });

    return assetMap;
  }

  /**
   * Get an already loaded asset
   */
  getAsset(path) {
    return this.assets.get(path);
  }

  /**
   * Check if asset exists and is loaded
   */
  hasAsset(path) {
    return this.assets.has(path);
  }

  /**
   * Check if asset failed to load
   */
  hasFailed(path) {
    return this.failedAssets.has(path);
  }

  /**
   * Preload assets for a level
   */
  async preloadLevel(levelData) {
    const assetsToLoad = [];

    // Background
    if (levelData.background) {
      assetsToLoad.push({
        path: `assets/maps/${levelData.background}`,
        type: 'background'
      });
    }

    // Music
    if (levelData.music) {
      assetsToLoad.push({
        path: `assets/sounds/${levelData.music}`,
        type: 'audio',
        assetType: 'audio'
      });
    }

    // Enemy types from waves
    const enemyTypes = new Set();
    if (levelData.waves) {
      levelData.waves.forEach(wave => {
        if (wave.enemyGroups) {
          wave.enemyGroups.forEach(group => {
            enemyTypes.add(group.type);
          });
        }
      });
    }

    // Load enemy assets
    enemyTypes.forEach(type => {
      assetsToLoad.push({
        path: `assets/enemies/${type}.png`,
        type: 'enemy'
      });
    });

    // Load common tower assets
    const towerTypes = ['pointTower', 'splashTower', 'barracksTower'];
    towerTypes.forEach(type => {
      assetsToLoad.push({
        path: `assets/towers/${type}.png`,
        type: 'tower'
      });
    });

    // Load hero assets
    const heroTypes = ['knight', 'archer'];
    heroTypes.forEach(type => {
      assetsToLoad.push({
        path: `assets/heroes/${type}.png`,
        type: 'hero'
      });
    });

    if (this.debug) {
      console.log(`AssetManager: Preloading ${assetsToLoad.length} assets for level`);
    }

    return await this.loadAssets(assetsToLoad);
  }

  /**
   * Get asset loading statistics
   */
  getStats() {
    return {
      totalLoaded: this.assets.size,
      totalFailed: this.failedAssets.size,
      successRate: this.assets.size / (this.assets.size + this.failedAssets.size) * 100,
      failedAssets: Array.from(this.failedAssets)
    };
  }

  /**
   * Clear all assets (for cleanup/testing)
   */
  clear() {
    this.assets.clear();
    this.loadPromises.clear();
    this.failedAssets.clear();
  }

  /**
   * Enable/disable debug logging
   */
  setDebug(enabled) {
    this.debug = enabled;
  }

  /**
   * Create a data URL for a canvas (for testing)
   */
  canvasToDataUrl(canvas) {
    return canvas.toDataURL();
  }

  /**
   * Validate asset integrity
   */
  validateAssets() {
    const issues = [];
    
    for (const [path, asset] of this.assets) {
      if (asset instanceof HTMLImageElement) {
        if (!asset.complete || asset.naturalWidth === 0) {
          issues.push(`Image asset ${path} is not properly loaded`);
        }
      } else if (asset instanceof HTMLAudioElement) {
        if (asset.readyState < 2) {
          issues.push(`Audio asset ${path} is not ready for playback`);
        }
      }
    }
    
    return issues;
  }
}

// Create singleton instance
export const assetManager = new AssetManager();

// Make globally accessible for debugging
window.assetManager = assetManager;