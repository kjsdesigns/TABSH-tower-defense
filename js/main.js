import { Game } from "./game.js";
import { level1Data } from "../config/maps/level1.js";
import { level2Data } from "../config/maps/level2.js";
import { level3Data } from "../config/maps/level3.js";
import { level4Data } from "../config/maps/level4.js";
import { UIManager } from "./uiManager.js";
import { loadAllAssets } from "./assetLoader.js";
import { unlockStars, initMainScreen } from "./mainScreen.js";
import { soundManager } from "./soundManager.js"; // ensure we can call soundManager
// Router is loaded separately in index.html

let enemyHpPercent = 100;
let game = null;
let lastStartingGold = 1000;

window.startGameFromMainScreen = function() {
  const goldInput = document.getElementById("startingGoldInput");
  const desiredGold = parseInt(goldInput?.value || "1000");
  (async () => {
    try {
      await startGameWithGold(desiredGold);
    } catch (err) {
      console.error("Error in startGameWithGold:", err);
      alert("Failed to start game: " + err);
    }
  })();
};

async function startGameWithGold(startingGold) {
  if (window.game && window.game.waveManager) {
    window.game.waveManager.clearAllTimers();
  }

  lastStartingGold = startingGold;

  const loseMessage = document.getElementById("loseMessage");
  const winMessage  = document.getElementById("winMessage");
  if (loseMessage) loseMessage.style.display = "none";
  if (winMessage)  winMessage.style.display = "none";

  const canvas = document.getElementById("gameCanvas");
  const enemyStatsDiv = document.getElementById("enemyStats");
  const towerSelectPanel = document.getElementById("towerSelectPanel");
  const debugTableContainer = document.getElementById("debugTableContainer");

  game = new Game(canvas, enemyStatsDiv, towerSelectPanel, debugTableContainer);
  window.game = game; // Make game accessible globally for testing

  if (game.waveManager) {
    game.waveManager.clearAllTimers();
    game.waveManager.waveIndex = 0;
    game.waveManager.waveActive = false;
  }

  game.gameOver = false;
  game.paused = false;
  game.gameStarted = false;

  const gcBtn = document.getElementById("gameControlButton");
  if (gcBtn) {
    gcBtn.textContent = "Start";
  }

  game.lives = 20;
  game.maxLives = 20;
  game.debugMode = true;

  const uiManager = new UIManager(
    game,
    enemyStatsDiv,
    towerSelectPanel,
    debugTableContainer,
    loseMessage,
    winMessage
  );
  uiManager.initDebugTable();
  game.uiManager = uiManager;

  game.globalEnemyHpMultiplier = enemyHpPercent / 100;

  try {
    const enemyTypes = [
      { name: "drone",         src: "assets/enemies/drone.png" },
      { name: "leaf_blower",   src: "assets/enemies/leaf_blower.png" },
      { name: "trench_digger", src: "assets/enemies/trench_digger.png" },
      { name: "trench_walker", src: "assets/enemies/trench_walker.png" },
    ];
    
    // Get the chosen level from localStorage
    const chosenLevel = localStorage.getItem("kr_chosenLevel") || "level1";
    
    // Select the appropriate level data
    let levelData = level1Data;
    if (chosenLevel === "level2") {
      levelData = level2Data;
    } else if (chosenLevel === "level3") {
      levelData = level3Data;
    } else if (chosenLevel === "level4") {
      levelData = level4Data;
    }
    
    const { loadedEnemies, loadedBackground } = await loadAllAssets(
      enemyTypes,
      levelData.background
    );
    game.enemyManager.setLoadedEnemyAssets(loadedEnemies);

    game.setLevelData(levelData, loadedBackground);

  } catch (assetErr) {
    console.error("Asset loading error:", assetErr);
    alert("Failed to load assets: " + assetErr);
  }

  game.gold = startingGold;

  // Load hero from slot
  const activeSlotIndex = localStorage.getItem("kr_activeSlot") || "1";
  const rawSlotData = localStorage.getItem("kr_slot" + activeSlotIndex);
  let chosenHero = null;
  if (rawSlotData) {
    try {
      const parsed = JSON.parse(rawSlotData);
      chosenHero = parsed.selectedHero;
    } catch(e) {
      chosenHero = null;
    }
  }
  
  // Use heroStart position from level data if available
  const heroX = game.heroStart ? game.heroStart.x : 100;
  const heroY = game.heroStart ? game.heroStart.y : 100;
  
  if (chosenHero === "melee") {
    game.heroManager.addHero({
      name: "Knight Hero",
      x: heroX,
      y: heroY,
      radius: 20,
      maxHp: 200,
      damage: 15,
      isMelee: true,
      speed: 80,
      attackInterval: 1.0,
    });
  } else if (chosenHero === "archer") {
    game.heroManager.addHero({
      name: "Archer Hero",
      x: heroX,
      y: heroY,
      radius: 20,
      maxHp: 120,
      damage: 10,
      isMelee: false,
      speed: 90,
      attackInterval: 1.2,
    });
  }

  game.start();
  const currentGameLabel = document.getElementById("currentGameLabel");
  if (currentGameLabel) {
    currentGameLabel.innerHTML = `Current game:<br>Starting gold: ${startingGold}, Enemy HP: ${enemyHpPercent}%`;
  }

  const toggleDebugBtn = document.getElementById("toggleDebugBtn");
  if (toggleDebugBtn) {
    toggleDebugBtn.onclick = () => {
      game.debugMode = !game.debugMode;
      toggleDebugBtn.textContent = game.debugMode ? "Hide Debug" : "Show Debug";
    };
  }
}

// Listen for DOM load => init main screen + wire up music controls
window.addEventListener("load", async () => {
  soundManager.init();  // load from localStorage

  initMainScreen();

  const startGoldInput = document.getElementById("startingGoldInput");
  const restartGameButton = document.getElementById("restartGameButton");
  const settingsDialog = document.getElementById("settingsDialog");
  const settingsButton = document.getElementById("settingsButton");
  const settingsDialogClose = document.getElementById("settingsDialogClose");

  // BACK TO MAIN: stop music & hide settings
  const backToMainButton = document.getElementById("backToMainButton");
  if (backToMainButton) {
    backToMainButton.addEventListener("click", () => {
      soundManager.stopMusic();  // Stop any currently playing music
      if (settingsDialog) {
        settingsDialog.style.display = "none";
      }
      // Use router to navigate back to main if available
      if (window.router) {
        window.router.navigate('/');
      } else {
        // Fallback navigation
        const mainScreen = document.getElementById('mainScreen');
        const gameContainer = document.getElementById('gameContainer');
        if (mainScreen && gameContainer) {
          mainScreen.style.display = 'block';
          gameContainer.style.display = 'none';
        }
      }
    });
  }

  // SETTINGS: hide tower dialogs
  if (settingsButton && settingsDialog) {
    settingsButton.addEventListener("click", () => {
      // hide any tower dialogs
      const buildDialog = document.getElementById("towerBuildDialog");
      const upgradeDialog = document.getElementById("towerUpgradeDialog");
      if (buildDialog) buildDialog.style.display = "none";
      if (upgradeDialog) upgradeDialog.style.display = "none";

      const style = settingsDialog.style.display;
      settingsDialog.style.display = (style === "none" || style === "") ? "block" : "none";
    });
  }
  if (settingsDialogClose && settingsDialog) {
    settingsDialogClose.addEventListener("click", () => {
      settingsDialog.style.display = "none";
    });
  }

  // Music On/Off + Volume
  const musicOnCheckbox = document.getElementById("musicOnCheckbox");
  const musicVolumeSlider = document.getElementById("musicVolumeSlider");
  if (musicOnCheckbox && musicVolumeSlider) {
    musicOnCheckbox.addEventListener("change", () => {
      soundManager.setMusicEnabled(musicOnCheckbox.checked);
    });
    musicVolumeSlider.addEventListener("input", () => {
      const vol = parseInt(musicVolumeSlider.value, 10) / 100;
      soundManager.setMusicVolume(vol);
    });
  }

  // SFX On/Off + Volume
  const sfxOnCheckbox = document.getElementById("sfxOnCheckbox");
  const sfxVolumeSlider = document.getElementById("sfxVolumeSlider");
  if (sfxOnCheckbox && sfxVolumeSlider) {
    sfxOnCheckbox.addEventListener("change", () => {
      soundManager.setSfxEnabled(sfxOnCheckbox.checked);
    });
    sfxVolumeSlider.addEventListener("input", () => {
      const vol = parseInt(sfxVolumeSlider.value, 10) / 100;
      soundManager.setSfxVolume(vol);
    });
  }

  // Enemy HP segment
  const hpOptions = [];
  for (let v = 80; v <= 120; v += 5) {
    hpOptions.push(v);
  }
  const enemyHpSegment = document.getElementById("enemyHpSegment");
  if (enemyHpSegment) {
    enemyHpSegment.innerHTML = "";
    hpOptions.forEach(value => {
      const btn = document.createElement("button");
      btn.textContent = value + "%";
      btn.classList.add("enemyHpOption");
      if (value === enemyHpPercent) {
        btn.style.backgroundColor = "#444";
      }
      btn.addEventListener("click", () => {
        document.querySelectorAll(".enemyHpOption").forEach(b => {
          b.style.backgroundColor = "";
        });
        enemyHpPercent = value;
        btn.style.backgroundColor = "#444";
      });
      enemyHpSegment.appendChild(btn);
    });
  }

  try {
    await startGameWithGold(parseInt(startGoldInput?.value || "1000"));
  } catch (err) {
    console.error("Error on initial game start:", err);
  }

  if (restartGameButton) {
    restartGameButton.addEventListener("click", async () => {
      if (document.getElementById("loseMessage")) {
        document.getElementById("loseMessage").style.display = "none";
      }
      if (document.getElementById("winMessage")) {
        document.getElementById("winMessage").style.display = "none";
      }
      try {
        const desiredGold = parseInt(startGoldInput?.value || "1000");
        await startGameWithGold(desiredGold);
      } catch (err) {
        console.error("Error restarting game:", err);
      }
    });
  }

  // lose/win dialogs
  const loseRestartBtn = document.getElementById("loseRestartBtn");
  const loseSettingsBtn = document.getElementById("loseSettingsBtn");
  const winRestartBtn = document.getElementById("winRestartBtn");
  const winSettingsBtn = document.getElementById("winSettingsBtn");
  if (loseRestartBtn) {
    loseRestartBtn.addEventListener("click", async () => {
      if (document.getElementById("loseMessage")) {
        document.getElementById("loseMessage").style.display = "none";
      }
      try {
        await startGameWithGold(lastStartingGold);
      } catch (err) {
        console.error("Error on lose restart:", err);
      }
    });
  }
  if (loseSettingsBtn) {
    loseSettingsBtn.addEventListener("click", () => {
      if (settingsDialog) {
        settingsDialog.style.zIndex = "10001";
      }
      if (document.getElementById("loseMessage")) {
        document.getElementById("loseMessage").style.zIndex = "10000";
      }
      if (settingsDialog) {
        settingsDialog.style.display = "block";
      }
    });
  }
  if (winRestartBtn) {
    winRestartBtn.addEventListener("click", async () => {
      if (document.getElementById("winMessage")) {
        document.getElementById("winMessage").style.display = "none";
      }
      try {
        await startGameWithGold(lastStartingGold);
      } catch (err) {
        console.error("Error on win restart:", err);
      }
    });
  }
  if (winSettingsBtn) {
    winSettingsBtn.addEventListener("click", () => {
      if (settingsDialog) {
        settingsDialog.style.zIndex = "10001";
      }
      if (document.getElementById("winMessage")) {
        document.getElementById("winMessage").style.zIndex = "10000";
      }
      if (settingsDialog) {
        settingsDialog.style.display = "block";
      }
    });
  }
});
