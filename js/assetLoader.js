/**
 * assetLoader.js
 *
 * Provides a unified function to load background and enemy images,
 * returning a promise that resolves or rejects if loading fails.
 */

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      resolve(img);
    };

    // If an error occurs, we reject with an Error object
    img.onerror = () => {
      reject(new Error(`Could not load image: ${src}`));
    };
  });
}

/**
 * loadAllAssets(enemyTypes, backgroundSrc)
 * - enemyTypes: array of objects [{ name, src }, ...]
 * - backgroundSrc: string path to background image
 *
 * Returns { loadedEnemies, loadedBackground }
 * or throws if any image fails to load.
 */
export async function loadAllAssets(enemyTypes, backgroundSrc) {
  // If the background doesn't start with "assets/", assume it's just a filename
  // and prepend "assets/maps/" so we load the correct path:
  let fixedBg = backgroundSrc || "";
  if (fixedBg && !fixedBg.startsWith("assets/")) {
    fixedBg = "assets/maps/" + fixedBg;
  }

  // 1) Preload background
  const bgPromise = preloadImage(fixedBg);

  // 2) Preload each enemy
  const enemyPromises = enemyTypes.map(async (type) => {
    // If type.src lacks "assets/", fix it similarly (in case user only put a filename)
    let enemySrc = type.src;
    if (enemySrc && !enemySrc.startsWith("assets/")) {
      enemySrc = "assets/enemies/" + enemySrc;
    }

    const img = await preloadImage(enemySrc);
    const maxDim = 30;
    const scale = maxDim / Math.max(img.naturalWidth, img.naturalHeight);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    return {
      ...type,
      image: img,
      width: w,
      height: h,
      speed: 40,
    };
  });

  // Wait for everything
  try {
    const [loadedBackground, ...loadedEnemies] = await Promise.all([
      bgPromise,
      ...enemyPromises,
    ]);

    return {
      loadedEnemies,
      loadedBackground,
    };
  } catch (err) {
    // re-throw so main.js can catch & display the specific file that failed
    throw err;
  }
}
