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
function initializeLevelEditor(activeFile = null) {
  console.log("[editorHub] initializeLevelEditor CALLED with file:", activeFile);
  const levelEditorTab = document.getElementById("levelEditorTab");
  if (!levelEditorTab) {
    console.warn("[editorHub] No #levelEditorTab found in DOM!");
    return;
  }
  if (!levelEditorInstance) {
    levelEditorInstance = new LevelEditor(levelEditorTab);
    
    // Add URL update callback when file is selected
    levelEditorInstance.onFileSelect = (fileName) => {
      if (window.router && fileName) {
        window.router.navigate(`/editor?tab=level&file=${fileName}`, true);
      }
    };
  }
  
  // Load specific file if provided
  if (activeFile && levelEditorInstance.loadExistingFileCallback) {
    levelEditorInstance.loadExistingFileCallback(activeFile);
  }
}

let enemyEditorInstance = null;
function initializeEnemyEditor(activeFile = null) {
  console.log("[editorHub] initializeEnemyEditor CALLED with file:", activeFile);
  const enemyEditorTab = document.getElementById("enemyEditorTab");
  if (!enemyEditorTab) {
    console.warn("[editorHub] No #enemyEditorTab found in DOM!");
    return;
  }
  if (!enemyEditorInstance) {
    enemyEditorInstance = new EnemyEditor(enemyEditorTab);
    
    // Add URL update callback when file is selected
    enemyEditorInstance.onFileSelect = (fileName) => {
      if (window.router && fileName) {
        window.router.navigate(`/editor?tab=enemy&file=${fileName}`, true);
      }
    };
  }
  
  // Load specific file if provided
  if (activeFile && enemyEditorInstance.loadExistingFileCallback) {
    enemyEditorInstance.loadExistingFileCallback(activeFile);
  }
}

let towerEditorInstance = null;
function initializeTowerEditor(activeFile = null) {
  console.log("[editorHub] initializeTowerEditor CALLED with file:", activeFile);
  const towerEditorTab = document.getElementById("towerEditorTab");
  if (!towerEditorTab) {
    console.warn("[editorHub] No #towerEditorTab found in DOM!");
    return;
  }
  if (!towerEditorInstance) {
    towerEditorInstance = new TowerEditor(towerEditorTab);
    
    // Add URL update callback when file is selected
    towerEditorInstance.onFileSelect = (fileName) => {
      if (window.router && fileName) {
        window.router.navigate(`/editor?tab=tower&file=${fileName}`, true);
      }
    };
  }
  
  // Load specific file if provided
  if (activeFile && towerEditorInstance.loadExistingFileCallback) {
    towerEditorInstance.loadExistingFileCallback(activeFile);
  }
}

let heroEditorInstance = null;
function initializeHeroEditor(activeFile = null) {
  console.log("[editorHub] initializeHeroEditor CALLED with file:", activeFile);
  const heroEditorTab = document.getElementById("heroEditorTab");
  if (!heroEditorTab) {
    console.warn("[editorHub] No #heroEditorTab found in DOM!");
    return;
  }
  if (!heroEditorInstance) {
    heroEditorInstance = new HeroEditor(heroEditorTab);
    
    // Add URL update callback when file is selected
    heroEditorInstance.onFileSelect = (fileName) => {
      if (window.router && fileName) {
        window.router.navigate(`/editor?tab=hero&file=${fileName}`, true);
      }
    };
  }
  
  // Load specific file if provided
  if (activeFile && heroEditorInstance.loadExistingFileCallback) {
    heroEditorInstance.loadExistingFileCallback(activeFile);
  }
}

// Expose show/hide so main can call them
window.showEditorHub = showEditorHub;
window.hideEditorHub = hideEditorHub;
