import { EditorBaseUI } from "./editorBaseUI.js";
import { fetchConfigFile, parseConfigFile } from "../utils/fileLoader.js";
import { populateAudioAndSet, populateImagesAndSet } from "../utils/formPopulateHelper.js";

export class TowerEditor extends EditorBaseUI {
  constructor(container) {
    super("Tower", "config/towers");
    this.container = container;
    this.dataObject = {};

    this.loadExistingFileCallback = this.loadExistingFile.bind(this);
    this.saveCallback = this.saveTowerConfig.bind(this);
    this.refreshEditorCallback = this.buildForm.bind(this);

    // Audio preview references
    this.fireAudio = null;
    this.hitAudio = null;

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

    //
    // Tower Name
    //
    const nameRow = document.createElement("div");
    nameRow.style.marginBottom = "8px";
    nameRow.textContent = "Tower Name: ";
    const nameInput = document.createElement("input");
    nameInput.value = this.dataObject.name || "";
    nameRow.appendChild(nameInput);
    contentDiv.appendChild(nameRow);

    //
    // Tower Type (Range or Melee)
    //
    const typeRow = document.createElement("div");
    typeRow.style.marginBottom = "8px";
    typeRow.textContent = "Tower Type: ";
    const typeSelect = document.createElement("select");
    ["range", "melee"].forEach((optionVal) => {
      const opt = document.createElement("option");
      opt.value = optionVal;
      opt.textContent = optionVal;
      typeSelect.appendChild(opt);
    });
    if (this.dataObject.towerType) {
      typeSelect.value = this.dataObject.towerType;
    }
    typeRow.appendChild(typeSelect);
    contentDiv.appendChild(typeRow);

    //
    // Cost (4 values)
    //
    const costRow = document.createElement("div");
    costRow.style.marginBottom = "8px";
    costRow.textContent = "Cost (initial & 3 upgrades): ";
    const costInputs = [];
    for (let i = 0; i < 4; i++) {
      const cInput = document.createElement("input");
      cInput.type = "number";
      cInput.style.width = "60px";
      cInput.style.marginLeft = "4px";
      cInput.value =
        (this.dataObject.cost && this.dataObject.cost[i]) ||
        (i === 0 ? "80" : "50"); // default
      costRow.appendChild(cInput);
      costInputs.push(cInput);
    }
    contentDiv.appendChild(costRow);

    //
    // Attack Rate
    //
    const rateRow = document.createElement("div");
    rateRow.style.marginBottom = "8px";
    rateRow.textContent = "Attack Rate (seconds): ";
    const rateInput = document.createElement("input");
    rateInput.type = "number";
    rateInput.step = "0.1";
    rateInput.value = this.dataObject.attackRate || 1.2;
    rateRow.appendChild(rateInput);
    contentDiv.appendChild(rateRow);

    //
    // Damage (4 values: initial + 3 upgrades)
    //
    const dmgRow = document.createElement("div");
    dmgRow.style.marginBottom = "8px";
    dmgRow.textContent = "Damage (initial & 3 upgrades): ";
    const dmgInputs = [];
    for (let i = 0; i < 4; i++) {
      const dInput = document.createElement("input");
      dInput.type = "number";
      dInput.style.width = "60px";
      dInput.style.marginLeft = "4px";
      dInput.value =
        (this.dataObject.damage && this.dataObject.damage[i]) ||
        (i === 0 ? "10" : "15"); // arbitrary defaults
      dmgRow.appendChild(dInput);
      dmgInputs.push(dInput);
    }
    contentDiv.appendChild(dmgRow);

    //
    // Range (shown only if Tower Type = "range")
    //
    const rangeRow = document.createElement("div");
    rangeRow.style.marginBottom = "8px";
    rangeRow.textContent = "Range (pixels): ";
    const rangeInput = document.createElement("input");
    rangeInput.type = "number";
    rangeInput.value = this.dataObject.range || 160;
    rangeRow.appendChild(rangeInput);
    contentDiv.appendChild(rangeRow);

    //
    // # Units (shown only if Tower Type = "melee")
    //
    const unitsRow = document.createElement("div");
    unitsRow.style.marginBottom = "8px";
    unitsRow.textContent = "# Units: ";
    const unitsInput = document.createElement("input");
    unitsInput.type = "number";
    unitsInput.value = this.dataObject.numUnits || 3;
    unitsRow.appendChild(unitsInput);
    contentDiv.appendChild(unitsRow);

    //
    // Fire Sound
    //
    const fireSoundRow = document.createElement("div");
    fireSoundRow.textContent = "Fire Sound: ";
    fireSoundRow.style.marginBottom = "8px";
    const fireSoundSelect = document.createElement("select");
    fireSoundRow.appendChild(fireSoundSelect);
    // Fire sound play/pause
    const firePlayBtn = document.createElement("button");
    firePlayBtn.textContent = "►";
    let firePlaying = false;
    firePlayBtn.addEventListener("click", () => {
      if (!fireSoundSelect.value) return;
      if (!this.fireAudio) {
        this.fireAudio = new Audio("assets/sounds/" + fireSoundSelect.value);
      }
      if (this.fireAudio.src.indexOf(fireSoundSelect.value) < 0) {
        this.fireAudio.pause();
        this.fireAudio = new Audio("assets/sounds/" + fireSoundSelect.value);
        firePlaying = false;
      }
      if (!firePlaying) {
        this.fireAudio.play().catch(err => console.warn(err));
        firePlayBtn.textContent = "❚❚";
        firePlaying = true;
      } else {
        this.fireAudio.pause();
        firePlayBtn.textContent = "►";
        firePlaying = false;
      }
    });
    fireSoundRow.appendChild(firePlayBtn);
    contentDiv.appendChild(fireSoundRow);

    //
    // Hit Sound
    //
    const hitSoundRow = document.createElement("div");
    hitSoundRow.textContent = "Hit Sound: ";
    hitSoundRow.style.marginBottom = "8px";
    const hitSoundSelect = document.createElement("select");
    hitSoundRow.appendChild(hitSoundSelect);
    const hitPlayBtn = document.createElement("button");
    hitPlayBtn.textContent = "►";
    let hitPlaying = false;
    hitPlayBtn.addEventListener("click", () => {
      if (!hitSoundSelect.value) return;
      if (!this.hitAudio) {
        this.hitAudio = new Audio("assets/sounds/" + hitSoundSelect.value);
      }
      if (this.hitAudio.src.indexOf(hitSoundSelect.value) < 0) {
        this.hitAudio.pause();
        this.hitAudio = new Audio("assets/sounds/" + hitSoundSelect.value);
        hitPlaying = false;
      }
      if (!hitPlaying) {
        this.hitAudio.play().catch(err => console.warn(err));
        hitPlayBtn.textContent = "❚❚";
        hitPlaying = true;
      } else {
        this.hitAudio.pause();
        hitPlayBtn.textContent = "►";
        hitPlaying = false;
      }
    });
    hitSoundRow.appendChild(hitPlayBtn);
    contentDiv.appendChild(hitSoundRow);

    //
    // Tower Base Image
    //
    const towerImgRow = document.createElement("div");
    towerImgRow.style.marginBottom = "8px";
    towerImgRow.textContent = "Tower Base Image: ";
    const towerImgSelect = document.createElement("select");
    towerImgRow.appendChild(towerImgSelect);
    contentDiv.appendChild(towerImgRow);

    //
    // Projectile Image
    //
    const projImgRow = document.createElement("div");
    projImgRow.style.marginBottom = "8px";
    projImgRow.textContent = "Projectile Image: ";
    const projImgSelect = document.createElement("select");
    projImgRow.appendChild(projImgSelect);
    contentDiv.appendChild(projImgRow);

    //
    // Populate sound/image selects
    //
    populateAudioAndSet(fireSoundSelect, "assets/sounds", this.dataObject.fireSound);
    populateAudioAndSet(hitSoundSelect, "assets/sounds", this.dataObject.hitSound);
    populateImagesAndSet(towerImgSelect, "assets/towers", this.dataObject.towerImage);
    populateImagesAndSet(projImgSelect, "assets/towers", this.dataObject.projectileImage);

    //
    // Show/hide logic for Range vs # Units
    //
    function updateTypeVisibility() {
      if (typeSelect.value === "range") {
        rangeRow.style.display = "block";
        unitsRow.style.display = "none";
      } else {
        rangeRow.style.display = "none";
        unitsRow.style.display = "block";
      }
    }
    updateTypeVisibility();
    typeSelect.addEventListener("change", updateTypeVisibility);

    // Save references
    this.nameInput = nameInput;
    this.typeSelect = typeSelect;
    this.costInputs = costInputs;
    this.rateInput = rateInput;
    this.dmgInputs = dmgInputs;
    this.rangeInput = rangeInput;
    this.unitsInput = unitsInput;

    this.fireSoundSelect = fireSoundSelect;
    this.hitSoundSelect = hitSoundSelect;
    this.towerImgSelect = towerImgSelect;
    this.projImgSelect = projImgSelect;
  }

  collectDataFromForm() {
    // Gather cost array
    const costArr = this.costInputs.map(ci => parseInt(ci.value) || 0);

    // Gather damage array
    const dmgArr = this.dmgInputs.map(di => parseInt(di.value) || 0);

    // Tower type
    const tType = this.typeSelect.value;

    // If range, read range; if melee, read #units
    let finalRange = 0;
    let finalUnits = 0;
    if (tType === "range") {
      finalRange = parseInt(this.rangeInput.value) || 0;
    } else {
      finalUnits = parseInt(this.unitsInput.value) || 0;
    }

    return {
      ...this.dataObject,
      name: this.nameInput.value,
      towerType: tType,
      cost: costArr,
      attackRate: parseFloat(this.rateInput.value) || 1.0,
      damage: dmgArr,
      range: finalRange,
      numUnits: finalUnits,

      fireSound: this.fireSoundSelect.value,
      hitSound: this.hitSoundSelect.value,
      towerImage: this.towerImgSelect.value,
      projectileImage: this.projImgSelect.value
    };
  }

  async saveTowerConfig(fileName, dataObj) {
    return this.saveFile(fileName, dataObj, "Config");
  }
}
