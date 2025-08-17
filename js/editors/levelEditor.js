import { CanvasEditorBaseUI } from "./CanvasEditorBaseUI.js";
import { fetchConfigFile, parseConfigFile } from "../utils/fileLoader.js";
import { LevelEditorTools } from "./levelEditorTools.js";
import { saveConfig } from "../utils/configSaver.js";
import { populateAudioAndSet, populateImagesAndSet } from "../utils/formPopulateHelper.js";

export class LevelEditor extends CanvasEditorBaseUI {
  constructor(container) {
    super("Level", "config/maps");
    this.container = container;
    this.dataObject = {};

    this.loadExistingFileCallback = this.loadExistingFile.bind(this);
    this.saveCallback = this.saveLevelConfig.bind(this);
    this.refreshEditorCallback = this.buildForm.bind(this);

    this.musicAudio = null;
    this.initUI(this.container);
  }

  async loadExistingFile(fileName) {
    console.log("[LevelEditor] loadExistingFile for", fileName);
    try {
      const text = await fetchConfigFile(this.defaultDir, fileName);
      this.dataObject = parseConfigFile(text) || {};
    } catch (err) {
      console.error("[LevelEditor] Error loading file:", err);
      alert("Failed to load file: " + err);
      this.dataObject = {};
    }
  }

  buildForm(contentDiv) {
    contentDiv.innerHTML = "";

    // Level Name & Music
    const rowDiv = document.createElement("div");
    rowDiv.style.marginBottom = "8px";
    contentDiv.appendChild(rowDiv);

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Level Name: ";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.style.marginRight = "20px";
    nameInput.value = this.dataObject.levelName || "";
    nameLabel.appendChild(nameInput);
    rowDiv.appendChild(nameLabel);

    const musicLabel = document.createElement("label");
    musicLabel.textContent = "Music: ";
    musicLabel.style.marginLeft = "10px";
    const musicSelect = document.createElement("select");
    musicLabel.appendChild(musicSelect);

    const musicPlayBtn = document.createElement("button");
    musicPlayBtn.textContent = "►";
    musicPlayBtn.style.marginLeft = "6px";
    let isPlaying = false;
    musicPlayBtn.addEventListener("click", () => {
      if (!musicSelect.value) return;
      if (!this.musicAudio) {
        this.musicAudio = new Audio("assets/sounds/" + musicSelect.value);
      }
      if (this.musicAudio.src.indexOf(musicSelect.value) < 0) {
        this.musicAudio.pause();
        this.musicAudio = new Audio("assets/sounds/" + musicSelect.value);
        isPlaying = false;
      }
      if (!isPlaying) {
        this.musicAudio.play().catch(err => console.warn("Music preview error:", err));
        musicPlayBtn.textContent = "❚❚";
        isPlaying = true;
      } else {
        this.musicAudio.pause();
        musicPlayBtn.textContent = "►";
        isPlaying = false;
      }
    });
    musicLabel.appendChild(musicPlayBtn);
    rowDiv.appendChild(musicLabel);

    populateAudioAndSet(musicSelect, "assets/sounds", this.dataObject.music);

    // Background Image
    const bgRow = document.createElement("div");
    bgRow.style.marginBottom = "8px";
    const bgLabel = document.createElement("label");
    bgLabel.textContent = "Background Image: ";
    const bgSelect = document.createElement("select");
    bgLabel.appendChild(bgSelect);
    bgRow.appendChild(bgLabel);
    contentDiv.appendChild(bgRow);

    populateImagesAndSet(bgSelect, "assets/maps", this.dataObject.background);
    bgSelect.addEventListener("change", () => {
      const newBg = bgSelect.value;
      this.dataObject.background = newBg;
      if (this.tools) {
        this.tools.setBackground(newBg ? "assets/maps/" + newBg : "");
      }
    });

    // references
    this.nameInput = nameInput;
    this.musicSelect = musicSelect;
    this.bgSelect = bgSelect;

    // toolbar + canvas
    const toolbarContainer = document.createElement("div");
    toolbarContainer.style.marginBottom = "8px";
    contentDiv.appendChild(toolbarContainer);

    this.canvas = this.initCanvas(contentDiv);

    // Editor tools
    this.tools = new LevelEditorTools(this.canvas, this.dataObject, toolbarContainer);

    // If there's a background in data, show it
    if (this.dataObject.background) {
      this.tools.setBackground("assets/maps/" + this.dataObject.background);
    }
  }

  collectDataFromForm() {
    // Remember the user’s edits
    this.dataObject.levelName = this.nameInput.value.trim();
    this.dataObject.music     = this.musicSelect.value || "";
    // (background is already stored in this.dataObject.background by the event)

    // Hard-code the map width/height.  If your editor is 800x600, do that:
    this.dataObject.mapWidth  = 800;
    this.dataObject.mapHeight = 600;

    return this.dataObject;
  }

  async saveLevelConfig(fileName, dataObj) {
    // "Data" instead of "Config"
    return this.saveFile(fileName, dataObj, "Data");
  }
}
