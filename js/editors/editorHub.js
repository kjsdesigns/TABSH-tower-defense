/**
 * editorHub.js
 *
 * Renamed the old "Game Editor" approach back to "Level Editor."
 */
import { LevelEditor } from "./levelEditor.js";
import { EnemyEditor } from "./enemyEditor.js";
import { TowerEditor } from "./towerEditor.js";
import { HeroEditor } from "./heroEditor.js";

export function showEditorHub() {
  const editorHub = document.getElementById("editorHub");
  if (!editorHub) return;
  editorHub.style.display = "block";

  const mainScreen = document.getElementById("mainScreen");
  if (mainScreen) mainScreen.style.display = "none";

  // Setup tab buttons
  const tabButtons = editorHub.querySelectorAll(".editorTabButton");
  const tabContents = editorHub.querySelectorAll(".editorTabContent");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      console.log("[editorHub] Tab clicked =>", target);
      tabContents.forEach(tc => {
        tc.style.display = (tc.id === target) ? "block" : "none";
      });

      if (target === "levelEditorTab") {
        initializeLevelEditor();
      } else if (target === "enemyEditorTab") {
        initializeEnemyEditor();
      } else if (target === "towerEditorTab") {
        initializeTowerEditor();
      } else if (target === "heroEditorTab") {
        initializeHeroEditor();
      }
    });
  });
}

export function hideEditorHub() {
  // Use router if available, otherwise fallback to direct manipulation
  if (window.router) {
    window.router.navigate('/');
  } else {
    const editorHub = document.getElementById("editorHub");
    if (editorHub) editorHub.style.display = "none";

    const mainScreen = document.getElementById("mainScreen");
    if (mainScreen) mainScreen.style.display = "block";
  }
}

let levelEditorInstance = null;
function initializeLevelEditor() {
  console.log("[editorHub] initializeLevelEditor CALLED!");
  const levelEditorTab = document.getElementById("levelEditorTab");
  if (!levelEditorTab) {
    console.warn("[editorHub] No #levelEditorTab found in DOM!");
    return;
  }
  if (!levelEditorInstance) {
    levelEditorInstance = new LevelEditor(levelEditorTab);
  }
}

let enemyEditorInstance = null;
function initializeEnemyEditor() {
  console.log("[editorHub] initializeEnemyEditor CALLED!");
  const enemyEditorTab = document.getElementById("enemyEditorTab");
  if (!enemyEditorTab) {
    console.warn("[editorHub] No #enemyEditorTab found in DOM!");
    return;
  }
  if (!enemyEditorInstance) {
    enemyEditorInstance = new EnemyEditor(enemyEditorTab);
  }
}

let towerEditorInstance = null;
function initializeTowerEditor() {
  console.log("[editorHub] initializeTowerEditor CALLED!");
  const towerEditorTab = document.getElementById("towerEditorTab");
  if (!towerEditorTab) {
    console.warn("[editorHub] No #towerEditorTab found in DOM!");
    return;
  }
  if (!towerEditorInstance) {
    towerEditorInstance = new TowerEditor(towerEditorTab);
  }
}

let heroEditorInstance = null;
function initializeHeroEditor() {
  console.log("[editorHub] initializeHeroEditor CALLED!");
  const heroEditorTab = document.getElementById("heroEditorTab");
  if (!heroEditorTab) {
    console.warn("[editorHub] No #heroEditorTab found in DOM!");
    return;
  }
  if (!heroEditorInstance) {
    heroEditorInstance = new HeroEditor(heroEditorTab);
  }
}

// Expose show/hide so main can call them
window.showEditorHub = showEditorHub;
window.hideEditorHub = hideEditorHub;
