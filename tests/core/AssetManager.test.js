/**
 * Unit tests for AssetManager
 */

import { AssetManager } from '../../js/core/AssetManager.js';

describe('AssetManager', () => {
  let assetManager;

  beforeEach(() => {
    assetManager = new AssetManager();
  });

  afterEach(() => {
    assetManager.clear();
  });

  describe('Placeholder Creation', () => {
    test('should create placeholders on initialization', () => {
      expect(assetManager.placeholders.has('enemy')).toBe(true);
      expect(assetManager.placeholders.has('tower')).toBe(true);
      expect(assetManager.placeholders.has('hero')).toBe(true);
      expect(assetManager.placeholders.has('background')).toBe(true);
      expect(assetManager.placeholders.has('projectile')).toBe(true);
    });

    test('placeholders should be canvas elements', () => {
      const enemyPlaceholder = assetManager.placeholders.get('enemy');
      expect(enemyPlaceholder.tagName).toBe('CANVAS');
      expect(enemyPlaceholder.width).toBeGreaterThan(0);
      expect(enemyPlaceholder.height).toBeGreaterThan(0);
    });
  });

  describe('Asset Loading', () => {
    test('should handle image loading failure gracefully', async () => {
      const asset = await assetManager.loadImage('nonexistent/path.png', 'enemy');
      
      expect(asset).toBeDefined();
      expect(assetManager.hasFailed('nonexistent/path.png')).toBe(true);
      
      // Should return placeholder
      const placeholder = assetManager.placeholders.get('enemy');
      expect(asset).toBe(placeholder);
    });

    test('should handle audio loading failure gracefully', async () => {
      const asset = await assetManager.loadAudio('nonexistent/sound.mp3');
      
      expect(asset).toBeDefined();
      expect(assetManager.hasFailed('nonexistent/sound.mp3')).toBe(true);
    });

    test('should cache loaded assets', async () => {
      const path = 'test/asset.png';
      
      // Load same asset twice
      const asset1 = await assetManager.loadImage(path, 'enemy');
      const asset2 = await assetManager.loadImage(path, 'enemy');
      
      // Should return same cached instance
      expect(asset1).toBe(asset2);
      expect(assetManager.hasAsset(path)).toBe(true);
    });
  });

  describe('Batch Asset Loading', () => {
    test('should load multiple assets in parallel', async () => {
      const assetList = [
        { path: 'test1.png', type: 'enemy' },
        { path: 'test2.png', type: 'tower' },
        { path: 'test3.mp3', type: 'audio', assetType: 'audio' }
      ];
      
      const assetMap = await assetManager.loadAssets(assetList);
      
      expect(assetMap.size).toBe(3);
      expect(assetMap.has('test1.png')).toBe(true);
      expect(assetMap.has('test2.png')).toBe(true);
      expect(assetMap.has('test3.mp3')).toBe(true);
    });
  });

  describe('Level Preloading', () => {
    test('should preload level assets', async () => {
      const levelData = {
        background: 'level1.png',
        music: 'background.mp3',
        waves: [
          {
            enemyGroups: [
              { type: 'drone' },
              { type: 'leaf_blower' }
            ]
          }
        ]
      };
      
      const assetMap = await assetManager.preloadLevel(levelData);
      
      expect(assetMap.size).toBeGreaterThan(0);
      
      // Check specific assets were loaded
      expect(assetMap.has('assets/maps/level1.png')).toBe(true);
      expect(assetMap.has('assets/sounds/background.mp3')).toBe(true);
      expect(assetMap.has('assets/enemies/drone.png')).toBe(true);
      expect(assetMap.has('assets/enemies/leaf_blower.png')).toBe(true);
    });
  });

  describe('Asset Statistics', () => {
    test('should provide loading statistics', async () => {
      // Load some assets (will fail and be counted)
      await assetManager.loadImage('test1.png', 'enemy');
      await assetManager.loadImage('test2.png', 'tower');
      await assetManager.loadAudio('test.mp3');
      
      const stats = assetManager.getStats();
      
      expect(stats.totalLoaded).toBe(3);
      expect(stats.totalFailed).toBe(3);
      expect(stats.successRate).toBe(50); // 3 loaded (placeholders) / 6 total
      expect(stats.failedAssets).toHaveLength(3);
    });
  });

  describe('Asset Validation', () => {
    test('should validate asset integrity', () => {
      // Add a mock invalid image
      const invalidImg = new Image();
      assetManager.assets.set('invalid.png', invalidImg);
      
      const issues = assetManager.validateAssets();
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toContain('invalid.png');
    });
  });

  describe('Utility Functions', () => {
    test('should convert canvas to data URL', () => {
      const placeholder = assetManager.placeholders.get('enemy');
      const dataUrl = assetManager.canvasToDataUrl(placeholder);
      
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });
});