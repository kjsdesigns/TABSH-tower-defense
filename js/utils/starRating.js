/**
 * starRating.js
 * 
 * Utility for calculating and displaying star ratings based on performance
 */

/**
 * Calculate star rating based on lives remaining
 * @param {number} livesRemaining - Lives left when level was completed
 * @param {number} maxLives - Maximum lives (usually 20)
 * @returns {number} Star rating (0-3)
 */
export function calculateStarRating(livesRemaining, maxLives = 20) {
  if (livesRemaining <= 0) return 0; // No stars if no lives left
  if (livesRemaining <= 10) return 1; // 1 star for 1-10 lives
  if (livesRemaining <= 17) return 2; // 2 stars for 11-17 lives
  if (livesRemaining >= 18) return 3; // 3 stars for 18-20 lives
  return 1; // Default fallback
}

/**
 * Create visual star display HTML for a given star count
 * Always shows 3 star positions, filled or empty based on progress
 * @param {number} starCount - Number of filled stars (0-3)
 * @returns {string} HTML string for star display
 */
export function createStarDisplayHTML(starCount) {
  const stars = [];
  const maxStars = 3;
  
  // Always show 3 star positions
  for (let i = 0; i < maxStars; i++) {
    if (i < starCount) {
      stars.push('<div class="star-icon star-full"></div>');
    } else {
      stars.push('<div class="star-icon star-empty"></div>');
    }
  }
  
  return stars.join('');
}

/**
 * Update a level's star display in the DOM
 * @param {string} levelId - Level identifier (e.g., "level1")
 * @param {number} starCount - Number of stars to display
 */
export function updateLevelStarDisplay(levelId, starCount) {
  const starDisplay = document.getElementById(`${levelId}StarDisplay`);
  if (!starDisplay) return;
  
  starDisplay.innerHTML = createStarDisplayHTML(starCount);
}

/**
 * Get the best star rating for a level from localStorage
 * @param {string} levelId - Level identifier
 * @param {string} slotIndex - Game slot index
 * @returns {number} Best star rating for this level
 */
export function getBestStarRating(levelId, slotIndex = null) {
  if (!slotIndex) {
    slotIndex = localStorage.getItem("kr_activeSlot") || "1";
  }
  
  const slotKey = "kr_slot" + slotIndex;
  const slotData = localStorage.getItem(slotKey);
  
  if (!slotData) return 0;
  
  try {
    const parsed = JSON.parse(slotData);
    return parsed.currentStars?.[levelId] || 0;
  } catch (error) {
    console.warn('Error parsing slot data:', error);
    return 0;
  }
}

/**
 * Save a new star rating for a level (only if it's better than current)
 * @param {string} levelId - Level identifier
 * @param {number} newStarCount - New star rating to potentially save
 * @param {string} slotIndex - Game slot index
 * @returns {boolean} True if the rating was saved (new best), false otherwise
 */
export function saveBestStarRating(levelId, newStarCount, slotIndex = null) {
  if (!slotIndex) {
    slotIndex = localStorage.getItem("kr_activeSlot") || "1";
  }
  
  const slotKey = "kr_slot" + slotIndex;
  let slotData;
  
  try {
    const raw = localStorage.getItem(slotKey);
    slotData = raw ? JSON.parse(raw) : { currentStars: {}, selectedHero: null };
  } catch (error) {
    console.warn('Error parsing slot data, creating new:', error);
    slotData = { currentStars: {}, selectedHero: null };
  }
  
  // Ensure currentStars object exists
  if (!slotData.currentStars) {
    slotData.currentStars = {};
  }
  
  const currentBest = slotData.currentStars[levelId] || 0;
  
  // Only save if new rating is better
  if (newStarCount > currentBest) {
    slotData.currentStars[levelId] = newStarCount;
    localStorage.setItem(slotKey, JSON.stringify(slotData));
    console.log(`New best star rating for ${levelId}: ${newStarCount} stars (previous: ${currentBest})`);
    return true;
  }
  
  console.log(`Star rating ${newStarCount} not saved for ${levelId} (current best: ${currentBest})`);
  return false;
}