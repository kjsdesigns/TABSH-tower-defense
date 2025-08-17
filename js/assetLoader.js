/**
 * assetLoader.js
 *
 * Updated to use the new AssetManager system with fallbacks.
 * Provides backward compatibility for existing code.
 */

import { assetManager } from "./core/AssetManager.js";

/**
 * loadAllAssets(enemyTypes, backgroundSrc)
 * - enemyTypes: array of objects [{ name, src }, ...]
 * - backgroundSrc: string path to background image
 *
 * Returns { loadedEnemies, loadedBackground }
 * Uses AssetManager for robust loading with fallbacks.
 */
export async function loadAllAssets(enemyTypes, backgroundSrc) {
  try {
    // Fix background path
    let fixedBg = backgroundSrc || "";
    if (fixedBg && !fixedBg.startsWith("assets/")) {
      fixedBg = "assets/maps/" + fixedBg;
    }

    // Load background using AssetManager
    const loadedBackground = await assetManager.loadImage(fixedBg, 'background');
    console.log('Background loaded successfully');

    // Load enemies using AssetManager
    const loadedEnemies = await Promise.all(
      enemyTypes.map(async (type) => {
        let enemySrc = type.src;
        if (enemySrc && !enemySrc.startsWith("assets/")) {
          enemySrc = "assets/enemies/" + enemySrc;
        }

        const img = await assetManager.loadImage(enemySrc, 'enemy');
        
        // Calculate scaling for display
        let maxDim = 30;
        let scale = 1;
        let w = 30, h = 30;
        
        if (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0) {
          scale = maxDim / Math.max(img.naturalWidth, img.naturalHeight);
          w = Math.round(img.naturalWidth * scale);
          h = Math.round(img.naturalHeight * scale);
        } else if (img instanceof HTMLCanvasElement) {
          scale = maxDim / Math.max(img.width, img.height);
          w = Math.round(img.width * scale);
          h = Math.round(img.height * scale);
        }

        return {
          ...type,
          image: img,
          width: w,
          height: h,
          speed: 40,
        };
      })
    );

    console.log(`Loaded ${loadedEnemies.length} enemy types successfully`);

    return {
      loadedEnemies,
      loadedBackground,
    };
  } catch (err) {
    console.error('Asset loading error:', err);
    // Don't throw - AssetManager provides fallbacks
    return {
      loadedEnemies: [],
      loadedBackground: null
    };
  }
}