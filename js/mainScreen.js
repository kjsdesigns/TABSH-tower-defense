/**
 * mainScreen.js
 *
 * Controls the "Main Screen" UI, including:
 * - Game slot selection (persisted in localStorage)
 * - Dynamic level markers with star rating system
 * - Visual star display (0-3 stars based on performance)
 * - Placeholders for tower upgrades, heroes, items  
 * - Hero selection (2 heroes: "Melee Hero" & "Archer Hero")
 * - Shows total stars (x/y) in each slot button
 */

// Star display function that always shows 3 star positions
function updateLevelStarDisplay(levelId, starCount) {
  const starDisplay = document.getElementById(`${levelId}StarDisplay`);
  if (!starDisplay) return;
  
  // Always show 3 star positions
  const stars = [];
  for (let i = 0; i < 3; i++) {
    if (i < starCount) {
      stars.push('<div class="star-icon star-full"></div>');
    } else {
      stars.push('<div class="star-icon star-empty"></div>');
    }
  }
  
  starDisplay.innerHTML = stars.join('');
}

// Make star display function globally available
window.updateLevelStarDisplay = updateLevelStarDisplay;

const MAX_SLOTS = 3;

// We'll store data in localStorage under keys like "kr_slot1", "kr_slot2", etc.
// Each slot data might look like:
// {
//   currentStars: { level1: 3, level2: 2 },
//   selectedHero: "melee" or "archer"
// }

function loadSlotData(slotIndex) {
  const key = "kr_slot" + slotIndex;
  const raw = localStorage.getItem(key);
  if (raw) {
    return JSON.parse(raw);
  } else {
    return {
      currentStars: {},
      selectedHero: null,
    };
  }
}

function saveSlotData(slotIndex, data) {
  localStorage.setItem("kr_slot" + slotIndex, JSON.stringify(data));
}

/**
 * computeTotalStars(slotData)
 * Sums star counts across all levels in currentStars
 */
function computeTotalStars(slotData) {
  let total = 0;
  for (const levelId in slotData.currentStars) {
    total += slotData.currentStars[levelId];
  }
  return total;
}

/**
 * computeMaxStars()
 * Calculate based on number of levels (3 stars max per level).
 */
function computeMaxStars() {
  try {
    const savedPositions = localStorage.getItem('mapEditor_levelPositions');
    const positions = savedPositions ? JSON.parse(savedPositions) : getDefaultPositions();
    return positions.length * 3; // 3 stars max per level
  } catch (error) {
    return 12; // Fallback to default
  }
}

/**
 * Initialize level markers dynamically based on Map Editor data
 */
function initializeLevelMarkers() {
  const worldMapContainer = document.getElementById("worldMapContainer");
  if (!worldMapContainer) {
    console.error("worldMapContainer not found!");
    return;
  }
  
  // Clear existing markers  
  const existingMarkers = worldMapContainer.querySelectorAll('.level-marker, .levelMarker');
  existingMarkers.forEach(marker => marker.remove());
  
  // Load positions from Map Editor
  try {
    const savedPositions = localStorage.getItem('mapEditor_levelPositions');
    const positions = savedPositions ? JSON.parse(savedPositions) : getDefaultPositions();
    
    positions.forEach(pos => {
      createLevelMarker(pos.id, pos.x, pos.y, worldMapContainer);
    });
    
  } catch (error) {
    console.error('Error initializing level markers:', error);
    // Fall back to default positions
    const defaultPositions = getDefaultPositions();
    defaultPositions.forEach(pos => {
      createLevelMarker(pos.id, pos.x, pos.y, worldMapContainer);
    });
  }
}

/**
 * Create a level marker element using CSS classes
 */
function createLevelMarker(levelId, x, y, container) {
  const marker = document.createElement('div');
  marker.id = `level${levelId}Marker`;
  marker.className = 'level-marker levelMarker';
  marker.dataset.level = `level${levelId}`;
  // Only set position coordinates inline (dynamic data)
  marker.style.left = x + 'px';
  marker.style.top = y + 'px';
  
  const img = document.createElement('img');
  img.id = `level${levelId}MarkerImg`;
  img.className = 'level-marker-image';
  img.src = 'assets/markers/green-marker.png';
  img.alt = `Level ${levelId}`;
  
  // Add level number overlay
  const levelNumber = document.createElement('div');
  levelNumber.className = 'level-marker-number';
  levelNumber.textContent = levelId;
  
  const starDisplay = document.createElement('div');
  starDisplay.id = `level${levelId}StarDisplay`;
  starDisplay.className = 'star-display';
  
  marker.appendChild(img);
  marker.appendChild(levelNumber);
  marker.appendChild(starDisplay);
  container.appendChild(marker);
  
  // Add click event listener
  marker.addEventListener('click', () => chooseLevel(`level${levelId}`));
}

/**
 * Get default level positions
 */
function getDefaultPositions() {
  return [
    { id: 1, x: 80, y: 480 },   // Bottom left (treehouse)
    { id: 2, x: 280, y: 400 },  // Middle bottom (village)
    { id: 3, x: 520, y: 280 },  // Middle right (mountains)
    { id: 4, x: 680, y: 80 }    // Top right (castle)
  ];
}

// ----------- PUBLIC API -----------
export function initMainScreen() {
  // 1) Grab the container element first
  const slotButtonsContainer = document.getElementById("slotButtonsContainer");
  if (!slotButtonsContainer) {
    console.error("slotButtonsContainer not found!");
    return;
  }

  // 2) Clear any old buttons
  slotButtonsContainer.innerHTML = "";

  // 3) Create an Editors button at the left, for example
  const editorsButton = document.createElement("button");
  editorsButton.textContent = "Editors";
  editorsButton.style.marginLeft = "15px";
  editorsButton.addEventListener("click", () => {
    if (window.router) {
      window.router.navigate('/editor');
    } else if (window.showEditorHub) {
      window.showEditorHub();
    }
  });
  slotButtonsContainer.appendChild(editorsButton);

  // Build slot buttons
  for (let i = 1; i <= MAX_SLOTS; i++) {
    const slotData = loadSlotData(i);
    const totalStars = computeTotalStars(slotData);
    const maxStars = computeMaxStars();

    // ex: "Slot 1 (2/12 stars)"
    const btn = document.createElement("button");
    btn.textContent = `Slot ${i} (${totalStars}/${maxStars} stars)`;
    btn.style.marginRight = "8px";

    btn.addEventListener("click", () => {
      // set active slot in localStorage for quick reference
      localStorage.setItem("kr_activeSlot", String(i));
      updateMainScreenDisplay();
    });

    slotButtonsContainer.appendChild(btn);
  }

  // Hero selection dialog
  const heroesButton = document.getElementById("heroesButton");
  const heroDialog = document.getElementById("heroDialog");
  const heroDialogClose = document.getElementById("heroDialogClose");
  const meleeHeroBtn = document.getElementById("meleeHeroBtn");
  const archerHeroBtn = document.getElementById("archerHeroBtn");

  if (heroesButton) {
    heroesButton.addEventListener("click", () => {
      if (heroDialog) heroDialog.style.display = "block";
    });
  }
  if (heroDialogClose) {
    heroDialogClose.addEventListener("click", () => {
      if (heroDialog) heroDialog.style.display = "none";
    });
  }
  if (meleeHeroBtn) {
    meleeHeroBtn.addEventListener("click", () => setSelectedHero("melee"));
  }
  if (archerHeroBtn) {
    archerHeroBtn.addEventListener("click", () => setSelectedHero("archer"));
  }

  // Level markers are now created dynamically in initializeLevelMarkers()

  // "Game Editor" button
  const levelEditorBtn = document.getElementById("levelEditorButton");
  if (levelEditorBtn) {
    levelEditorBtn.addEventListener("click", () => {
      if (window.router) {
        window.router.navigate('/editor');
      } else if (window.showEditorHub) {
        window.showEditorHub();
      }
    });
  }

  // Initialize level markers dynamically
  initializeLevelMarkers();
  
  // Initial UI update
  updateMainScreenDisplay();
  // Also show update info (unique hash, date/time)
  showUpdateInfo();
}

// Make updateMainScreenDisplay globally available for router
window.updateMainScreenDisplay = updateMainScreenDisplay;

export function unlockStars(levelId, starCount) {
  const slotIndex = localStorage.getItem("kr_activeSlot") || "1";
  const slotData = loadSlotData(slotIndex);
  const oldStars = slotData.currentStars[levelId] || 0;
  if (starCount > oldStars) {
    slotData.currentStars[levelId] = starCount;
    saveSlotData(slotIndex, slotData);
    
    // Update visual star display immediately
    updateLevelStarDisplay(levelId, starCount);
  }
  updateMainScreenDisplay();
}

/**
 * Update the main screen display with the current slot's star counts,
 * unlock level2 if user has at least 1 star on level1, etc.
 */
function updateMainScreenDisplay() {
  const slotIndex = localStorage.getItem("kr_activeSlot") || "1";
  const slotData = loadSlotData(slotIndex);

  // Show the current slot
  const currentSlotLabel = document.getElementById("currentSlotLabel");
  if (currentSlotLabel) {
    currentSlotLabel.textContent = "Current Slot: " + slotIndex;
  }

  // Update all dynamic level markers
  updateAllLevelMarkers(slotData);

  // Show selected hero
  const selectedHeroLabel = document.getElementById("selectedHeroLabel");
  if (selectedHeroLabel) {
    selectedHeroLabel.textContent = "Hero: " + (slotData.selectedHero || "None");
  }

  // Rebuild the slotButtonsContainer so it shows updated star totals
  const slotButtonsContainer = document.getElementById("slotButtonsContainer");
  if (slotButtonsContainer) {
    slotButtonsContainer.innerHTML = "";
    
    // Add the "Editors" button first
    const editorsButton = document.createElement("button");
    editorsButton.textContent = "Editors";
    editorsButton.style.marginLeft = "15px";
    editorsButton.addEventListener("click", () => {
      if (window.router) {
        window.router.navigate('/editor');
      } else if (window.showEditorHub) {
        window.showEditorHub();
      }
    });
    slotButtonsContainer.appendChild(editorsButton);
    
    // Add slot buttons
    for (let i = 1; i <= MAX_SLOTS; i++) {
      const sData = loadSlotData(i);
      const totalStars = computeTotalStars(sData);
      const maxStars = computeMaxStars();
      const btn = document.createElement("button");
      btn.textContent = `Slot ${i} (${totalStars}/${maxStars} stars)`;
      btn.style.marginRight = "8px";
      btn.addEventListener("click", () => {
        localStorage.setItem("kr_activeSlot", String(i));
        updateMainScreenDisplay();
      });
      slotButtonsContainer.appendChild(btn);
    }
  }
}

function setSelectedHero(heroType) {
  const slotIndex = localStorage.getItem("kr_activeSlot") || "1";
  const slotData = loadSlotData(slotIndex);
  slotData.selectedHero = heroType;
  saveSlotData(slotIndex, slotData);

  const heroDialog = document.getElementById("heroDialog");
  if (heroDialog) heroDialog.style.display = "none";
  updateMainScreenDisplay();
}

/**
 * Update all level markers dynamically
 */
function updateAllLevelMarkers(slotData) {
  try {
    const savedPositions = localStorage.getItem('mapEditor_levelPositions');
    const positions = savedPositions ? JSON.parse(savedPositions) : getDefaultPositions();
    
    positions.forEach((pos, index) => {
      const levelKey = `level${pos.id}`;
      const starCount = slotData.currentStars[levelKey] || 0;
      
      // Determine if level is unlocked (level 1 is always unlocked)
      let isUnlocked = pos.id === 1;
      if (pos.id > 1) {
        const prevLevelKey = `level${pos.id - 1}`;
        const prevStars = slotData.currentStars[prevLevelKey] || 0;
        isUnlocked = prevStars >= 1;
      }
      
      updateLevelMarker(levelKey, starCount, isUnlocked);
      
      // Update visual star display
      updateLevelStarDisplay(`level${pos.id}`, starCount);
    });
    
  } catch (error) {
    console.warn('Error updating level markers:', error);
  }
}

/**
 * Update a level marker's appearance based on completion status
 * @param {string} levelId - The level identifier (e.g., "level1")
 * @param {number} starCount - Number of stars earned for this level
 * @param {boolean} isUnlocked - Whether this level is unlocked/available
 */
function updateLevelMarker(levelId, starCount, isUnlocked) {
  const marker = document.getElementById(`${levelId}Marker`);
  const markerImg = document.getElementById(`${levelId}MarkerImg`);
  
  if (!marker || !markerImg) return;
  
  // Remove existing state classes
  marker.classList.remove('disabled');
  
  if (!isUnlocked) {
    // Level is locked - show as disabled with grayscale
    marker.classList.add('disabled');
    return;
  }
  
  // Determine marker color based on completion status
  let markerColor;
  if (starCount > 0) {
    // Completed level - use blue marker
    markerColor = 'blue';
  } else {
    // Available but not completed - use green marker
    markerColor = 'green';
  }
  
  // Update the marker image
  markerImg.src = `assets/markers/${markerColor}-marker.png`;
}

function chooseLevel(levelId) {
  // Check if level is available
  const marker = document.getElementById(`${levelId}Marker`);
  if (marker && marker.classList.contains('disabled')) {
    console.log(`Level ${levelId} is locked`);
    return; // Don't allow navigation to locked levels
  }
  
  localStorage.setItem("kr_chosenLevel", levelId);

  // Use router navigation if available
  if (window.router) {
    window.router.navigate(`/level?level=${levelId}`);
  } else {
    // Fallback to direct navigation
    const mainScreen = document.getElementById("mainScreen");
    const gameContainer = document.getElementById("gameContainer");
    if (mainScreen && gameContainer) {
      mainScreen.style.display = "none";
      gameContainer.style.display = "block";
    }

    // Trigger actual game start in main.js
    if (window.startGameFromMainScreen) {
      window.startGameFromMainScreen();
    }
  }
}

/**
 * showUpdateInfo()
 * Reads the top line of change_log_summary.txt in format:
 *   "7b2cd9f41-updatedParsing - generated: 2024-12-29T14:47:00Z - applied: 20241229_132349"
 * Then extracts the hash, generated date, and applied date.
 */
function showUpdateInfo() {
  const updateInfoDiv = document.getElementById("updateInfo");
  if (!updateInfoDiv) return;

  fetch("./change_log/change_log_summary.txt")
    .then(resp => {
      if (!resp.ok) throw new Error("Could not load summary file");
      return resp.text();
    })
    .then(text => {
      const lines = text.trim().split("\n").map(l => l.trim());
      if (!lines.length) {
        updateInfoDiv.textContent = "(update info unavailable)";
        return;
      }

      const firstLine = lines[0];
      let uniqueHash = "";
      let generatedRaw = "";
      let fileUpdateRaw = "";

      // Updated regex to match ASCII hyphens
      const match = firstLine.match(/^(\S+)\s*-\s*generated:\s*(\S+)\s*-\s*applied:\s*(\S+)$/);
      if (match) {
        uniqueHash = match[1].trim();
        generatedRaw = match[2].trim();
        fileUpdateRaw = match[3].trim();
      }

      const generatedStr = formatDate(generatedRaw);
      const updatedStr = formatDate(fileUpdateRaw);
      const diffStr = computeTimeSince(fileUpdateRaw);

      const html = `
Unique hash: ${uniqueHash}<br/>
Generated: ${generatedStr}<br/>
Files updated: ${updatedStr}<br/>
Update: ${diffStr} ago
`;
      updateInfoDiv.innerHTML = html;
    })
    .catch(err => {
      console.warn("Could not show update info:", err);
      updateInfoDiv.textContent = "(update info unavailable)";
    });
}

/**
 * formatDate(raw)
 *  - input: "2024-12-29T14:47:00Z"
 *  - output: "Dec 29, 2024 2:47 PM"
 */
function formatDate(raw) {
  if (!raw) return "(no date)";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const options = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
  return d.toLocaleString('en-US', options);
}

/**
 * computeTimeSince(raw)
 *  - Return "X days, Y hours, Z mins, Q secs" string since date
 */
function computeTimeSince(raw) {
  if (!raw) return "(no date)";
  const then = new Date(raw).getTime();
  const now = Date.now();
  if (isNaN(then)) return "(invalid date)";

  let diffSec = Math.floor((now - then) / 1000);
  const days = Math.floor(diffSec / 86400);
  diffSec %= 86400;
  const hours = Math.floor(diffSec / 3600);
  diffSec %= 3600;
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} days`);
  if (hours > 0) parts.push(`${hours} hours`);
  if (mins > 0) parts.push(`${mins} mins`);
  parts.push(`${secs} secs`);

  return parts.join(", ");
}