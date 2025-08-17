import { EditorBaseUI } from "./editorBaseUI.js";
import { fetchConfigFile, parseConfigFile } from "../utils/fileLoader.js";
// Use our new helpers
import { populateAudioAndSet, populateImagesAndSet } from "../utils/formPopulateHelper.js";

export class HeroEditor extends EditorBaseUI {
  constructor(container) {
    super("Hero", "config/heroes");
    this.container = container;
    this.dataObject = {};

    this.loadExistingFileCallback = this.loadExistingFile.bind(this);
    this.saveCallback = this.saveHeroConfig.bind(this);
    this.refreshEditorCallback = this.buildForm.bind(this);

    // Audio preview
    this.attackAudio = null;

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

    // Hero Name
    const nameRow = document.createElement("div");
    nameRow.style.marginBottom = "6px";
    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Hero Name: ";
    nameRow.appendChild(nameLabel);

    const nameSelect = document.createElement("select");
    const possibleNames = ["Knight Hero", "Archer Hero", "Rogue Hero", "Cleric Hero", "Mage Hero"];
    possibleNames.forEach(n => {
      const opt = document.createElement("option");
      opt.value = n;
      opt.textContent = n;
      nameSelect.appendChild(opt);
    });
    if (this.dataObject.name && !possibleNames.includes(this.dataObject.name)) {
      const customOpt = document.createElement("option");
      customOpt.value = this.dataObject.name;
      customOpt.textContent = this.dataObject.name + " (custom)";
      nameSelect.appendChild(customOpt);
    }
    if (this.dataObject.name) {
      nameSelect.value = this.dataObject.name;
    }
    nameSelect.addEventListener("change", () => {
      this.dataObject.name = nameSelect.value;
    });
    nameRow.appendChild(nameSelect);
    contentDiv.appendChild(nameRow);

    // Attack Sound
    const atkSoundRow = document.createElement("div");
    atkSoundRow.textContent = "Attack Sound: ";
    atkSoundRow.style.marginBottom = "6px";
    const atkSoundSelect = document.createElement("select");
    atkSoundRow.appendChild(atkSoundSelect);

    // Play/pause button
    const atkPlayBtn = document.createElement("button");
    atkPlayBtn.textContent = "►";
    let isPlaying = false;
    atkPlayBtn.addEventListener("click", () => {
      if (!atkSoundSelect.value) return;
      if (!this.attackAudio) {
        this.attackAudio = new Audio("assets/sounds/" + atkSoundSelect.value);
      }
      // if user changes selection mid-play
      if (this.attackAudio.src.indexOf(atkSoundSelect.value) < 0) {
        this.attackAudio.pause();
        this.attackAudio = new Audio("assets/sounds/" + atkSoundSelect.value);
        isPlaying = false;
      }
      if (!isPlaying) {
        this.attackAudio.play().catch(err => console.warn(err));
        atkPlayBtn.textContent = "❚❚";
        isPlaying = true;
      } else {
        this.attackAudio.pause();
        atkPlayBtn.textContent = "►";
        isPlaying = false;
      }
    });
    atkSoundRow.appendChild(atkPlayBtn);

    contentDiv.appendChild(atkSoundRow);

    // Populate with new helper
    populateAudioAndSet(atkSoundSelect, "assets/sounds", this.dataObject.attackSound);

    // Standing Image
    const standImgRow = document.createElement("div");
    standImgRow.textContent = "Standing Image: ";
    standImgRow.style.marginBottom = "6px";
    const standImgSelect = document.createElement("select");
    standImgRow.appendChild(standImgSelect);
    contentDiv.appendChild(standImgRow);

    populateImagesAndSet(standImgSelect, "assets/heroes", this.dataObject.standingImage);

    // Running Image
    const runImgRow = document.createElement("div");
    runImgRow.textContent = "Running Image: ";
    runImgRow.style.marginBottom = "6px";
    const runImgSelect = document.createElement("select");
    runImgRow.appendChild(runImgSelect);
    contentDiv.appendChild(runImgRow);

    populateImagesAndSet(runImgSelect, "assets/heroes", this.dataObject.runningImage);

    // Attacking Image
    const atkImgRow = document.createElement("div");
    atkImgRow.textContent = "Attacking Image: ";
    atkImgRow.style.marginBottom = "6px";
    const atkImgSelect = document.createElement("select");
    atkImgRow.appendChild(atkImgSelect);
    contentDiv.appendChild(atkImgRow);

    populateImagesAndSet(atkImgSelect, "assets/heroes", this.dataObject.attackingImage);

    // Projectile Image
    const projImgRow = document.createElement("div");
    projImgRow.textContent = "Projectile Image: ";
    projImgRow.style.marginBottom = "6px";
    const projImgSelect = document.createElement("select");
    projImgRow.appendChild(projImgSelect);
    contentDiv.appendChild(projImgRow);

    populateImagesAndSet(projImgSelect, "assets/heroes", this.dataObject.projectileImage);

    // Store references
    this.nameSelect = nameSelect;
    this.atkSoundSelect = atkSoundSelect;
    this.standImgSelect = standImgSelect;
    this.runImgSelect = runImgSelect;
    this.atkImgSelect = atkImgSelect;
    this.projImgSelect = projImgSelect;
  }

  collectDataFromForm() {
    return {
      ...this.dataObject,
      name: this.nameSelect?.value || "",
      attackSound: this.atkSoundSelect?.value || "",
      standingImage: this.standImgSelect?.value || "",
      runningImage: this.runImgSelect?.value || "",
      attackingImage: this.atkImgSelect?.value || "",
      projectileImage: this.projImgSelect?.value || ""
    };
  }

  async saveHeroConfig(fileName, dataObj) {
    return this.saveFile(fileName, dataObj, "Config");
  }
}
