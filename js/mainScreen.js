/**
* mainScreen.js
*
* Controls the "Main Screen" UI, including:
* - Game slot selection (persisted in localStorage)
* - Display of level 1 and level 2 (level 2 is locked until >=1 star on level1)
* - Dotted line between level1 and level2
* - Placeholders for tower upgrades, heroes, items
* - Hero selection (2 heroes: "Melee Hero" & "Archer Hero")
* - Shows total stars (x/y) in each slot button
*/

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
* Hard-coded to 12 for now (assuming 4 levels with max 3 stars each).
* Adjust if you add more levels or change max stars per level.
*/
function computeMaxStars() {
return 12;
}

// ----------- PUBLIC API -----------
export function initMainScreen() {
// 1) Grab the container element first
const slotButtonsContainer = document.getElementById("slotButtonsContainer");
if (!slotButtonsContainer) return;

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

// ex: "Slot 1 (2/6 stars)"
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

// Level buttons
const level1Btn = document.getElementById("level1Btn");
const level2Btn = document.getElementById("level2Btn");
const level3Btn = document.getElementById("level3Btn");
const level4Btn = document.getElementById("level4Btn");
if (level1Btn) {
  level1Btn.addEventListener("click", () => chooseLevel("level1"));
}
if (level2Btn) {
  level2Btn.addEventListener("click", () => chooseLevel("level2"));
}
if (level3Btn) {
  level3Btn.addEventListener("click", () => chooseLevel("level3"));
}
if (level4Btn) {
  level4Btn.addEventListener("click", () => chooseLevel("level4"));
}

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

// Initial UI update
updateMainScreenDisplay();
// Also show update info (unique hash, date/time)
showUpdateInfo();
}

export function unlockStars(levelId, starCount) {
const slotIndex = localStorage.getItem("kr_activeSlot") || "1";
const slotData = loadSlotData(slotIndex);
const oldStars = slotData.currentStars[levelId] || 0;
if (starCount > oldStars) {
slotData.currentStars[levelId] = starCount;
}
saveSlotData(slotIndex, slotData);
updateMainScreenDisplay();
}

/**
* Update the main screen display with the current slot’s star counts,
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

// Show star counts for each level
const level1Stars = slotData.currentStars["level1"] || 0;
const level2Stars = slotData.currentStars["level2"] || 0;
const level3Stars = slotData.currentStars["level3"] || 0;
const level4Stars = slotData.currentStars["level4"] || 0;
const level1StarDisplay = document.getElementById("level1StarDisplay");
const level2StarDisplay = document.getElementById("level2StarDisplay");
const level3StarDisplay = document.getElementById("level3StarDisplay");
const level4StarDisplay = document.getElementById("level4StarDisplay");
if (level1StarDisplay) {
  level1StarDisplay.textContent = "Stars: " + level1Stars;
}
if (level2StarDisplay) {
  level2StarDisplay.textContent = "Stars: " + level2Stars;
}
if (level3StarDisplay) {
  level3StarDisplay.textContent = "Stars: " + level3Stars;
}
if (level4StarDisplay) {
  level4StarDisplay.textContent = "Stars: " + level4Stars;
}

// Lock/unlock level 2 if level1Stars >= 1
const level2Btn = document.getElementById("level2Btn");
const dottedLine1to2 = document.getElementById("dottedLine");
if (level2Btn && dottedLine1to2) {
  if (level1Stars >= 1) {
    level2Btn.disabled = false;
    dottedLine1to2.style.opacity = "1";
  } else {
    level2Btn.disabled = true;
    dottedLine1to2.style.opacity = "0.3";
  }
}

// Lock/unlock level 3 if level2Stars >= 1
const level3Btn = document.getElementById("level3Btn");
const dottedLine2to3 = document.getElementById("dottedLine2to3");
if (level3Btn && dottedLine2to3) {
  if (level2Stars >= 1) {
    level3Btn.disabled = false;
    dottedLine2to3.style.opacity = "1";
  } else {
    level3Btn.disabled = true;
    dottedLine2to3.style.opacity = "0.3";
  }
}

// Lock/unlock level 4 if level3Stars >= 1
const level4Btn = document.getElementById("level4Btn");
const dottedLine3to4 = document.getElementById("dottedLine3to4");
if (level4Btn && dottedLine3to4) {
  if (level3Stars >= 1) {
    level4Btn.disabled = false;
    dottedLine3to4.style.opacity = "1";
  } else {
    level4Btn.disabled = true;
    dottedLine3to4.style.opacity = "0.3";
  }
}

// Show selected hero
const selectedHeroLabel = document.getElementById("selectedHeroLabel");
if (selectedHeroLabel) {
selectedHeroLabel.textContent = "Hero: " + (slotData.selectedHero || "None");
}

// Rebuild the slotButtonsContainer so it shows updated star totals
const slotButtonsContainer = document.getElementById("slotButtonsContainer");
if (slotButtonsContainer) {
slotButtonsContainer.innerHTML = "";
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
// Add the "Editors" button back in
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

function chooseLevel(levelId) {
// Use router to navigate to level with URL change
if (window.router) {
window.router.navigate(`/level?level=${levelId}`);
} else {
// Fallback if router isn't available
localStorage.setItem("kr_chosenLevel", levelId);

// Hide main screen, show game container
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


