/**
 * editorBaseUI.js
 *
 * Base class for all editors. Provides the core UI flow:
 *   - Listing existing files
 *   - Creating new files
 *   - Displaying an edit form
 *   - Handling Save / Cancel with top-right action buttons
 *   - URL updates when files are selected
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
    this.onFileSelect = null; // Callback for URL updates
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
      
      // Trigger URL update for new file
      if (this.onFileSelect) {
        this.onFileSelect(trimmedName);
      }
      
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
      // Load each file's content, parse it, show "levelName - filename.js"
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
            
            // Trigger URL update callback
            if (this.onFileSelect) {
              this.onFileSelect(f);
            }
            
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
            console.warn("Could not parse:", f, err);
            btn.textContent = `(parse error) - ${f}`;
          }

          btn.addEventListener("click", async () => {
            this.currentFileName = f;
            this.isEditingNew = false;
            
            // Trigger URL update callback
            if (this.onFileSelect) {
              this.onFileSelect(f);
            }
            
            await this.loadExistingFileCallback(f);
            this.showEditorForm();
          });
          return btn;
        })
      );

      buttons.forEach((btn) => {
        this.fileListContainer.appendChild(btn);
      });
    }
  }

  showEditorForm() {
    // Hide the "select or create" area once we're editing
    const selectOrCreateDiv = document.getElementById("selectOrCreateDiv");
    if (selectOrCreateDiv) {
      selectOrCreateDiv.style.display = "none";
    }

    this.fileListContainer.style.display = "none";
    this.formContainer.style.display = "block";
    this.formContainer.innerHTML = "";
    
    // Create header with title and action buttons in top-right
    const headerDiv = document.createElement("div");
    headerDiv.style.display = "flex";
    headerDiv.style.justifyContent = "space-between";
    headerDiv.style.alignItems = "center";
    headerDiv.style.marginBottom = "15px";
    headerDiv.style.padding = "10px";
    headerDiv.style.backgroundColor = "rgba(0,0,0,0.1)";
    headerDiv.style.borderRadius = "4px";
    
    const heading = document.createElement("h2");
    heading.style.margin = "0";
    if (this.isEditingNew) {
      heading.textContent = `New ${this.editorName}: ${this.currentFileName}`;
    } else {
      heading.textContent = `Editing ${this.editorName}: ${this.currentFileName}`;
    }
    headerDiv.appendChild(heading);
    
    // Action buttons container (top-right)
    const actionButtonsDiv = document.createElement("div");
    actionButtonsDiv.style.display = "flex";
    actionButtonsDiv.style.gap = "8px";
    
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.style.backgroundColor = "#4CAF50";
    saveBtn.style.color = "white";
    saveBtn.style.border = "none";
    saveBtn.style.padding = "8px 16px";
    saveBtn.style.borderRadius = "4px";
    saveBtn.style.cursor = "pointer";
    saveBtn.style.fontWeight = "bold";
    
    saveBtn.addEventListener("click", async () => {
      const success = await this.handleSave();
      if (success) {
        // Return to selection screen
        this.showSelectionScreen();
      }
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.backgroundColor = "#f44336";
    cancelBtn.style.color = "white";
    cancelBtn.style.border = "none";
    cancelBtn.style.padding = "8px 16px";
    cancelBtn.style.borderRadius = "4px";
    cancelBtn.style.cursor = "pointer";
    
    cancelBtn.addEventListener("click", () => {
      this.showSelectionScreen();
    });
    
    actionButtonsDiv.appendChild(saveBtn);
    actionButtonsDiv.appendChild(cancelBtn);
    headerDiv.appendChild(actionButtonsDiv);
    
    this.formContainer.appendChild(headerDiv);

    const contentDiv = document.createElement("div");
    contentDiv.id = "editorFormContent";
    contentDiv.style.marginBottom = "10px";
    this.formContainer.appendChild(contentDiv);

    // Let the subclass build the form
    this.refreshEditorCallback(contentDiv);
  }

  showSelectionScreen() {
    // Show the selection screen, hide form
    const selectOrCreateDiv = document.getElementById("selectOrCreateDiv");
    if (selectOrCreateDiv) {
      selectOrCreateDiv.style.display = "block";
    }

    this.fileListContainer.style.display = "block";
    this.formContainer.style.display = "none";

    // Reset filename
    this.currentFileName = null;
    this.isEditingNew = false;
    
    // Update URL to remove file parameter
    if (this.onFileSelect) {
      this.onFileSelect(null);
    }
  }

  async handleSave() {
    const dataObj = this.collectDataFromForm();
    if (!dataObj) {
      alert("Could not collect data from form. Check console for errors.");
      return false;
    }

    const result = await this.saveCallback(this.currentFileName, dataObj);
    if (result.success) {
      alert(`Saved ${this.currentFileName} successfully!`);
      return true;
    } else {
      alert(`Save failed: ${result.error}`);
      return false;
    }
  }

  collectDataFromForm() {
    // Subclasses should override this
    console.warn("collectDataFromForm not implemented in subclass");
    return null;
  }

  /**
   * Standard save for config files (export const X = {...})
   */
  async saveFile(varName, dataObject) {
    const filePath = this.defaultDir + "/" + this.currentFileName;
    const content = `export const ${varName} = ${JSON.stringify(dataObject, null, 2)};`;
    
    try {
      const result = await saveConfig(filePath, content);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}