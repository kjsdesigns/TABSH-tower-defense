/**
 * baseEditor.js
 *
 * A base class that can be extended by EnemyEditor, HeroEditor, TowerEditor, etc.
 * Provides helper methods to build typical UI elements:
 *   - createFileRow()
 *   - createJsonTextarea()
 *   - createParseButton()
 *   - createListFilesButton()
 *
 * Subclasses can override "listFilesDir", "objectLabel", etc.
 */

import { listFiles } from "./fileListHelper.js";

export class BaseEditor {
  constructor(container) {
    this.container = container;
    this.fileName = "";
    this.dataObject = {}; // the JSON data being edited
  }

  createFileRow(headingText, defaultFileName, saveCallback) {
    const heading = document.createElement("h2");
    heading.textContent = headingText;
    this.container.appendChild(heading);

    const fileRow = document.createElement("div");

    // Instead of using innerHTML on label, we create a <strong> child
    const label = document.createElement("label");
    // Create a <strong> element for the bold text
    const strongEl = document.createElement("strong");
    strongEl.textContent = `${headingText} Config Name (file):`;
    // Append the <strong> to the label
    label.appendChild(strongEl);
    fileRow.appendChild(label);

    // The file input
    const fileInput = document.createElement("input");
    fileInput.type = "text";
    fileInput.style.width = "200px";
    fileInput.style.marginLeft = "6px";
    fileInput.value = defaultFileName;
    fileRow.appendChild(fileInput);
    this.fileNameInput = fileInput;

    // The "Save" button
    const saveBtn = document.createElement("button");
    saveBtn.style.marginLeft = "10px";
    saveBtn.textContent = `Save ${headingText}`;
    saveBtn.addEventListener("click", saveCallback);
    fileRow.appendChild(saveBtn);

    const p = document.createElement("p");
    p.style.fontSize = "12px";
    p.style.margin = "4px 0";
    p.textContent = `Edit the JSON below, then click "Save ${headingText}".`;
    fileRow.appendChild(p);

    this.container.appendChild(fileRow);
  }

  createJsonTextarea(defaultData) {
    const ta = document.createElement("textarea");
    ta.style.width = "100%";
    ta.style.height = "150px";
    ta.style.fontFamily = "monospace";
    ta.value = JSON.stringify(defaultData, null, 2);
    this.container.appendChild(ta);
    this.jsonTextarea = ta;
  }

  createParseButton() {
    const parseBtn = document.createElement("button");
    parseBtn.textContent = "Parse JSON";
    parseBtn.addEventListener("click", () => {
      try {
        this.dataObject = JSON.parse(this.jsonTextarea.value);
        alert("Parsed JSON successfully.");
      } catch (e) {
        alert("Failed to parse JSON: " + e.message);
      }
    });
    this.container.appendChild(parseBtn);
  }

  createListFilesButton(listDir, labelText = "List Files") {
    const listBtn = document.createElement("button");
    listBtn.textContent = labelText;
    listBtn.style.marginLeft = "10px";
    listBtn.addEventListener("click", async () => {
      const files = await listFiles(listDir);
      if (!files.length) {
        alert(`No files found in ${listDir}`);
      } else {
        alert(`${listDir} files:\n` + files.join("\n"));
      }
    });
    this.container.appendChild(listBtn);
  }

  /**
   * generateExportString(baseName, dataObject, suffix="Config")
   *
   * Produces valid JS code like:
   *   export const droneConfig = {...};
   *
   * Suffix defaults to "Config", but for levels you can pass "Data" etc.
   *
   * If you have no Windows/backslash issues, you can skip special escaping.
   */
  static generateExportString(baseName, dataObject, suffix = "Config") {
    let jsonStr = JSON.stringify(dataObject, null, 2);
    return `export const ${baseName}${suffix} = ${jsonStr};`;
  }
}
