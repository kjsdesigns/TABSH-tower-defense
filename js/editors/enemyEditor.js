import { EditorBaseUI } from "./editorBaseUI.js";
import { fetchConfigFile, parseConfigFile } from "../utils/fileLoader.js";
// Import our new modular helpers
import { populateAudioAndSet, populateImagesAndSet } from "../utils/formPopulateHelper.js";

export class EnemyEditor extends EditorBaseUI {
  constructor(container) {
    super("Enemy", "config/enemies");
    this.container = container;
    this.dataObject = {};

    this.loadExistingFileCallback = this.loadExistingFile.bind(this);
    this.saveCallback = this.saveEnemyConfig.bind(this);
    this.refreshEditorCallback = this.buildForm.bind(this);

    // For audio preview
    this.fireAudio = null;

    this.initUI(this.container);
  }

  async loadExistingFile(fileName) {
    const text = await fetchConfigFile(this.defaultDir, fileName);
    this.dataObject = parseConfigFile(text);
    if (!this.dataObject || typeof this.dataObject !== "object") {
      this.dataObject = {};
    }
  }

  buildForm(contentDiv) {
    contentDiv.innerHTML = "";

    // Base HP
    const hpRow = document.createElement("div");
    hpRow.textContent = "Base HP: ";
    const hpInput = document.createElement("input");
    hpInput.type = "number";
    hpInput.value = this.dataObject.baseHp || 50;
    hpRow.appendChild(hpInput);
    contentDiv.appendChild(hpRow);

    // Speed (pixels/sec)
    const speedRow = document.createElement("div");
    speedRow.textContent = "Speed (px/sec): ";
    const speedInput = document.createElement("input");
    speedInput.type = "number";
    speedInput.value = this.dataObject.baseSpeed || 40;
    speedRow.appendChild(speedInput);
    contentDiv.appendChild(speedRow);

    // Attack Interval
    const atkIntRow = document.createElement("div");
    atkIntRow.textContent = "Attack Interval: ";
    const atkIntInput = document.createElement("input");
    atkIntInput.type = "number";
    atkIntInput.step = "0.1";
    atkIntInput.value = this.dataObject.attackInterval || 1.0;
    atkIntRow.appendChild(atkIntInput);
    contentDiv.appendChild(atkIntRow);

    // Fire Sound
    const fireSoundRow = document.createElement("div");
    fireSoundRow.textContent = "Fire Sound: ";
    const fireSoundSelect = document.createElement("select");
    fireSoundRow.appendChild(fireSoundSelect);

    // A small play/pause button
    const firePlayBtn = document.createElement("button");
    firePlayBtn.textContent = "►";
    let isPlaying = false;
    firePlayBtn.addEventListener("click", () => {
      if (!fireSoundSelect.value) return;
      if (!this.fireAudio) {
        this.fireAudio = new Audio("assets/sounds/" + fireSoundSelect.value);
      }
      // if user changes selection mid-play
      if (this.fireAudio.src.indexOf(fireSoundSelect.value) < 0) {
        this.fireAudio.pause();
        this.fireAudio = new Audio("assets/sounds/" + fireSoundSelect.value);
        isPlaying = false;
      }
      if (!isPlaying) {
        this.fireAudio.play().catch(err => console.warn(err));
        firePlayBtn.textContent = "❚❚";
        isPlaying = true;
      } else {
        this.fireAudio.pause();
        firePlayBtn.textContent = "►";
        isPlaying = false;
      }
    });
    fireSoundRow.appendChild(firePlayBtn);

    contentDiv.appendChild(fireSoundRow);

    // Idle / Moving / Fighting Image
    const idleImgRow = document.createElement("div");
    idleImgRow.textContent = "Idle Image: ";
    const idleImgSelect = document.createElement("select");
    idleImgRow.appendChild(idleImgSelect);
    contentDiv.appendChild(idleImgRow);

    const movingImgRow = document.createElement("div");
    movingImgRow.textContent = "Moving Image: ";
    const movingImgSelect = document.createElement("select");
    movingImgRow.appendChild(movingImgSelect);
    contentDiv.appendChild(movingImgRow);

    const fightingImgRow = document.createElement("div");
    fightingImgRow.textContent = "Fighting Image: ";
    const fightingImgSelect = document.createElement("select");
    fightingImgRow.appendChild(fightingImgSelect);
    contentDiv.appendChild(fightingImgRow);

    // Use our new helpers for modular populating + setting value
    populateAudioAndSet(fireSoundSelect, "assets/sounds", this.dataObject.fireSound);
    populateImagesAndSet(idleImgSelect, "assets/enemies", this.dataObject.idleImage);
    populateImagesAndSet(movingImgSelect, "assets/enemies", this.dataObject.movingImage);
    populateImagesAndSet(fightingImgSelect, "assets/enemies", this.dataObject.fightingImage);

    // Save references
    this.hpInput = hpInput;
    this.speedInput = speedInput;
    this.atkIntInput = atkIntInput;
    this.fireSoundSelect = fireSoundSelect;
    this.idleImgSelect = idleImgSelect;
    this.movingImgSelect = movingImgSelect;
    this.fightingImgSelect = fightingImgSelect;
  }

  collectDataFromForm() {
    return {
      ...this.dataObject,
      baseHp: parseFloat(this.hpInput.value),
      baseSpeed: parseFloat(this.speedInput.value), // new speed field
      attackInterval: parseFloat(this.atkIntInput.value),
      fireSound: this.fireSoundSelect.value,
      idleImage: this.idleImgSelect.value,
      movingImage: this.movingImgSelect.value,
      fightingImage: this.fightingImgSelect.value
    };
  }

  async saveEnemyConfig(fileName, dataObj) {
    return this.saveFile(fileName, dataObj, "Config");
  }
}
