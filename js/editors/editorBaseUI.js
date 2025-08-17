/**
 * editorBaseUI.js
 *
 * Base class for all editors. Provides the core UI flow:
 *   - Listing existing files
 *   - Creating new files
 *   - Displaying an edit form
 *   - Handling Save / Cancel
 *
 * Subclasses override certain callbacks and can call new shared methods,
 * e.g. saveFile() for standard "export const X = {...}" style saving.
 */

import { listFiles } from "../utils/fileListHelper.js";
import { BaseEditor } from "../utils/baseEditor.js";
import { saveConfig } from "../utils/configSaver.js";
import { fetchConfigFile, parseConfigFile } from "../utils/fileLoader.js";

export class EditorBaseUI {
  constructor(editorName, defaultDir) {
    this.editorName = editorName;
    this.defaultDir = defaultDir;
    this.container = null;
    this.fileListContainer = null;
    this.formContainer = null;

    this.currentFileName = null;
    this.isEditingNew = false;

    this.loadExistingFileCallback = async (fileName) => {};
    this.saveCallback = async (fileName, dataObject) => {};
    this.refreshEditorCallback = () => {};
  }

  initUI(container) {
    this.container = container;
    this.container.innerHTML = "";

    // Step 1) "Select or Create"
    const selectOrCreateDiv = document.createElement("div");
    selectOrCreateDiv.style.marginBottom = "10px";
    selectOrCreateDiv.id = "selectOrCreateDiv";

    const selectLabel = document.createElement("strong");
    selectLabel.textContent = "Choose Existing or Create New:";
    selectOrCreateDiv.appendChild(selectLabel);

    // File list container
    this.fileListContainer = document.createElement("div");
    this.fileListContainer.style.margin = "6px 0";
    selectOrCreateDiv.appendChild(this.fileListContainer);

    // "New" input row
    const newFileRow = document.createElement("div");
    newFileRow.style.marginTop = "4px";
    const newFileInput = document.createElement("input");
    newFileInput.type = "text";
    newFileInput.placeholder = `New ${this.editorName} filename (e.g. myFile.js)`;
    newFileRow.appendChild(newFileInput);

    const newBtn = document.createElement("button");
    newBtn.textContent = "Create New";
    newBtn.style.marginLeft = "6px";
    newBtn.addEventListener("click", () => {
      const trimmedName = newFileInput.value.trim();
      if (!trimmedName) {
        alert("Please enter a valid file name (e.g. myFile.js)");
        return;
      }
      this.currentFileName = trimmedName;
      this.isEditingNew = true;
      // Now show editor form
      this.showEditorForm();
    });
    newFileRow.appendChild(newBtn);
    selectOrCreateDiv.appendChild(newFileRow);

    this.formContainer = document.createElement("div");
    this.formContainer.style.display = "none";
    this.formContainer.style.border = "1px solid #444";
    this.formContainer.style.padding = "8px";
    this.formContainer.style.marginTop = "10px";

    this.container.appendChild(selectOrCreateDiv);
    this.container.appendChild(this.formContainer);

    // Load existing files
    this.listExistingFiles();
  }

  async listExistingFiles() {
    const files = await listFiles(this.defaultDir);
    this.fileListContainer.innerHTML = "";
    if (!files.length) {
      this.fileListContainer.textContent = "(No files found)";
      return;
    }

    // If we're the Level editor, parse each to get levelName (if any)
    if (this.editorName === "Level") {
      // Load each file’s content, parse it, show "levelName - filename.js"
      const buttons = await Promise.all(
        files.map(async (f) => {
          const btn = document.createElement("button");
          btn.style.marginRight = "6px";
          btn.textContent = f; // fallback

          // Attempt to parse
          try {
            const text = await fetchConfigFile(this.defaultDir, f);
            const parsed = parseConfigFile(text);
            const levelName = parsed.levelName || "";
            if (levelName) {
              btn.textContent = `${levelName} - ${f}`;
            } else {
              btn.textContent = `(no name) - ${f}`;
            }
          } catch (err) {
            console.warn("Could not parse file:", f, err);
          }

          btn.addEventListener("click", async () => {
            this.currentFileName = f;
            this.isEditingNew = false;
            await this.loadExistingFileCallback(f);
            this.showEditorForm();
          });
          return btn;
        })
      );
      buttons.forEach((btn) => {
        this.fileListContainer.appendChild(btn);
      });

    } else if (this.editorName === "Enemy" || this.editorName === "Hero" || this.editorName === "Tower") {
      // For these, try to show the "name" property from their config
      const buttons = await Promise.all(
        files.map(async (f) => {
          const btn = document.createElement("button");
          btn.style.marginRight = "6px";

          try {
            const text = await fetchConfigFile(this.defaultDir, f);
            const parsed = parseConfigFile(text);
            const configName = parsed.name || "";
            if (configName) {
              btn.textContent = `${configName} - ${f}`;
            } else {
              btn.textContent = `(no name) - ${f}`;
            }
          } catch (err) {
            console.warn("Could not parse file:", f, err);
            btn.textContent = `(no name) - ${f}`;
          }

          btn.addEventListener("click", async () => {
            this.currentFileName = f;
            this.isEditingNew = false;
            await this.loadExistingFileCallback(f);
            this.showEditorForm();
          });
          return btn;
        })
      );
      buttons.forEach((btn) => {
        this.fileListContainer.appendChild(btn);
      });

    } else {
      // Normal fallback
      files.forEach((f) => {
        const btn = document.createElement("button");
        btn.textContent = f;
        btn.style.marginRight = "6px";
        btn.addEventListener("click", async () => {
          this.currentFileName = f;
          this.isEditingNew = false;
          await this.loadExistingFileCallback(f);
          this.showEditorForm();
        });
        this.fileListContainer.appendChild(btn);
      });
    }
  }

  showEditorForm() {
    // Hide the "select or create" area once we’re editing
    const selectOrCreateDiv = document.getElementById("selectOrCreateDiv");
    if (selectOrCreateDiv) {
      selectOrCreateDiv.style.display = "none";
    }

    this.fileListContainer.style.display = "none";
    this.formContainer.style.display = "block";
    this.formContainer.innerHTML = "";

    const heading = document.createElement("h2");
    if (this.isEditingNew) {
      heading.textContent = `New ${this.editorName}: ${this.currentFileName}`;
    } else {
      heading.textContent = `Editing ${this.editorName}: ${this.currentFileName}`;
    }
    this.formContainer.appendChild(heading);

    const contentDiv = document.createElement("div");
    contentDiv.id = "editorFormContent";
    contentDiv.style.marginBottom = "10px";
    this.formContainer.appendChild(contentDiv);

    // Let the subclass build the form
    this.refreshEditorCallback(contentDiv);

    // Save / Cancel row
    const saveCancelRow = document.createElement("div");

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Changes";
    saveBtn.addEventListener("click", async () => {
      const success = await this.handleSave();
      if (success) {
        // Return to selection screen
        this.formContainer.style.display = "none";
        // Re-show the listing if you want the user to see it again:
        const selectOrCreateDivAgain = document.getElementById("selectOrCreateDiv");
        if (selectOrCreateDivAgain) {
          selectOrCreateDivAgain.style.display = "block";
        }
        this.fileListContainer.style.display = "block";
        this.formContainer.innerHTML = "";
        this.listExistingFiles();
      }
    });
    saveCancelRow.appendChild(saveBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.marginLeft = "8px";
    cancelBtn.addEventListener("click", () => {
      // Revert to selection screen, no save
      this.formContainer.style.display = "none";
      const selectOrCreateDivAgain = document.getElementById("selectOrCreateDiv");
      if (selectOrCreateDivAgain) {
        selectOrCreateDivAgain.style.display = "block";
      }
      this.fileListContainer.style.display = "block";
      this.formContainer.innerHTML = "";
    });
    saveCancelRow.appendChild(cancelBtn);

    this.formContainer.appendChild(saveCancelRow);
  }

  async handleSave() {
    const dataObj = this.collectDataFromForm();
    if (!dataObj) {
      return false;
    }
    const result = await this.saveCallback(this.currentFileName, dataObj);
    if (result.success) {
      alert(`Saved ${this.currentFileName} successfully!`);
      return true;
    } else {
      alert("Failed to save: " + (result.error || JSON.stringify(result)));
      return false;
    }
  }

  collectDataFromForm() {
    return {};
  }

  /**
   * saveFile(fileName, dataObj, suffix = "Config")
   * Provides a standard "export const baseNameSuffix = {...}" approach.
   * Then calls saveConfig(`${this.defaultDir}/${fileName}`, contentStr).
   */
  async saveFile(fileName, dataObj, suffix = "Config") {
    const baseName = fileName.replace(".js", "");
    const contentStr = BaseEditor.generateExportString(baseName, dataObj, suffix);
    const result = await saveConfig(`${this.defaultDir}/${fileName}`, contentStr);
    return result;
  }
}
