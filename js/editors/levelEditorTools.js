/**
 * levelEditorTools.js
 *
 * This version:
 *  - Adds a background image selector in levelEditor.js (separately).
 *  - Fixes “null is not an object” by checking addPathPointBtn existence.
 *  - Adds a "Delete Path" button that removes the selected path.
 */

export class LevelEditorTools {
  constructor(canvas, dataObject, toolbarContainer) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.data = dataObject;

    // If no paths array, init empty
    if (!this.data.paths) {
      this.data.paths = [];
    }

    this.activePathIndex = -1;  // -1 means "None"

    // background image
    this.bgImage = null;

    // For highlighting active tool
    this.currentTool = null;
    this.activeToolButton = null;

    // For selection
    this.selectedObject = null;  // { type: 'hero'|'spot'|'path', pathIndex?, pointIndex? }
    this.isDragging = false;

    // We'll store references to the new path selector and the "Add Path Point" button so we can disable it as needed.
    this.pathSelect = null;
    this.addPathPointBtn = null;
    this.deletePathBtn = null;
    this.deleteButton = null;

    // Render loop
    requestAnimationFrame(() => this.draw());

    // Canvas event handling
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));

    this.buildToolbar(toolbarContainer);
  }

  setBackground(bgPath) {
    if (!bgPath) {
      this.bgImage = null;
      this.draw();
      return;
    }
    const img = new Image();
    img.src = bgPath;
    img.onload = () => {
      this.bgImage = img;
      this.draw();
    };
    img.onerror = () => {
      console.warn("Failed to load background:", bgPath);
      this.bgImage = null;
      this.draw();
    };
  }

  buildToolbar(toolbarContainer) {
    if (!toolbarContainer) return;
    toolbarContainer.innerHTML = "";

    //
    // 1) "Select" button
    //
    const selectBtn = document.createElement("button");
    selectBtn.textContent = "Select";
    selectBtn.style.marginRight = "6px";
    selectBtn.addEventListener("click", () => {
      this.setActiveTool(selectBtn, "select");
    });
    toolbarContainer.appendChild(selectBtn);

    //
    // 2) "Add Hero Start" button
    //
    const addHeroBtn = document.createElement("button");
    addHeroBtn.textContent = "Add Hero Start";
    addHeroBtn.style.marginRight = "6px";
    // Hide if hero already exists
    if (this.data.heroStart) {
      addHeroBtn.style.display = "none";
    }
    addHeroBtn.addEventListener("click", () => {
      this.setActiveTool(addHeroBtn, "addHeroStart");
    });
    toolbarContainer.appendChild(addHeroBtn);

    //
    // 3) Path selector
    //
    const pathLabel = document.createElement("span");
    pathLabel.textContent = "Path: ";
    pathLabel.style.marginLeft = "6px";
    toolbarContainer.appendChild(pathLabel);

    this.pathSelect = document.createElement("select");
    this.pathSelect.style.marginRight = "6px";
    this.pathSelect.addEventListener("change", () => this.onPathSelectionChange());
    toolbarContainer.appendChild(this.pathSelect);

    // Fill the pathSelect options now
    this.refreshPathSelect();

    //
    // 4) "Add Path Point" button (disabled if no path selected)
    //
    this.addPathPointBtn = document.createElement("button");
    this.addPathPointBtn.textContent = "Add Path Point";
    this.addPathPointBtn.style.marginRight = "6px";
    this.addPathPointBtn.disabled = (this.activePathIndex < 0); // if no path selected
    this.addPathPointBtn.addEventListener("click", () => {
      this.setActiveTool(this.addPathPointBtn, "addPathPoint");
    });
    toolbarContainer.appendChild(this.addPathPointBtn);

    //
    // 4.5) "Delete Path" button
    //
    this.deletePathBtn = document.createElement("button");
    this.deletePathBtn.textContent = "Delete Path";
    this.deletePathBtn.style.marginRight = "6px";
    this.deletePathBtn.disabled = (this.activePathIndex < 0);
    this.deletePathBtn.addEventListener("click", () => {
      this.deleteSelectedPath();
    });
    toolbarContainer.appendChild(this.deletePathBtn);

    //
    // 5) "Add Tower Spot" button
    //
    const addSpotBtn = document.createElement("button");
    addSpotBtn.textContent = "Add Tower Spot";
    addSpotBtn.style.marginRight = "6px";
    addSpotBtn.addEventListener("click", () => {
      this.setActiveTool(addSpotBtn, "addSpot");
    });
    toolbarContainer.appendChild(addSpotBtn);

    //
    // 6) "Delete" button for selected item
    //
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.disabled = true; // no selection yet
    deleteBtn.style.marginLeft = "6px";
    deleteBtn.addEventListener("click", () => {
      this.handleDeleteSelection();
    });
    toolbarContainer.appendChild(deleteBtn);
    this.deleteButton = deleteBtn;
  }

  refreshPathSelect() {
    if (!this.pathSelect) return;
    this.pathSelect.innerHTML = "";

    // Option "None" if no selection
    const noneOpt = document.createElement("option");
    noneOpt.value = "-1";
    noneOpt.textContent = "None";
    this.pathSelect.appendChild(noneOpt);

    // For each path, e.g. "Path 0", "Path 1", ...
    for (let i = 0; i < this.data.paths.length; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = "Path " + i;
      this.pathSelect.appendChild(opt);
    }

    // Final "Add path" option
    const addOpt = document.createElement("option");
    addOpt.value = "add";
    addOpt.textContent = "Add path";
    this.pathSelect.appendChild(addOpt);

    // Attempt to set the select to the current activePathIndex, or default to -1
    if (this.activePathIndex >= 0 && this.activePathIndex < this.data.paths.length) {
      this.pathSelect.value = String(this.activePathIndex);
    } else {
      this.pathSelect.value = "-1";
      this.activePathIndex = -1;
    }

    // If activePathIndex < 0, disable "Add Path Point" & "Delete Path"
    if (this.addPathPointBtn) {
      this.addPathPointBtn.disabled = (this.activePathIndex < 0);
    }
    if (this.deletePathBtn) {
      this.deletePathBtn.disabled = (this.activePathIndex < 0);
    }
  }

  onPathSelectionChange() {
    const val = this.pathSelect.value;
    if (val === "add") {
      // user chose "Add path"
      this.addNewPath();
    } else {
      this.activePathIndex = parseInt(val, 10);
      if (isNaN(this.activePathIndex)) {
        this.activePathIndex = -1;
      }
      // set the button enabled/disabled
      if (this.addPathPointBtn) {
        this.addPathPointBtn.disabled = (this.activePathIndex < 0);
      }
      if (this.deletePathBtn) {
        this.deletePathBtn.disabled = (this.activePathIndex < 0);
      }
    }
  }

  addNewPath() {
    if (!this.data.paths) {
      this.data.paths = [];
    }
    this.data.paths.push([]);
    // The newly created path is at index = length - 1
    this.activePathIndex = this.data.paths.length - 1;
    this.refreshPathSelect();
    this.pathSelect.value = String(this.activePathIndex);
    if (this.addPathPointBtn) {
      this.addPathPointBtn.disabled = false;
    }
    if (this.deletePathBtn) {
      this.deletePathBtn.disabled = false;
    }
  }

  deleteSelectedPath() {
    if (this.activePathIndex < 0 || this.activePathIndex >= this.data.paths.length) return;
    this.data.paths.splice(this.activePathIndex, 1);
    this.activePathIndex = -1;
    this.refreshPathSelect();
  }

  // Tools
  setActiveTool(button, toolName) {
    // Un-highlight any previously active button
    if (this.activeToolButton && this.activeToolButton !== button) {
      this.activeToolButton.style.backgroundColor = "";
    }
    // If you clicked the same button that’s active, no special toggling needed.
    if (this.currentTool === toolName) {
      button.style.backgroundColor = "#444";
      return;
    }

    // Otherwise highlight the newly clicked button
    button.style.backgroundColor = "#444";
    this.activeToolButton = button;
    this.currentTool = toolName;

    // Clear selection if we switch tools
    this.selectedObject = null;
    if (this.deleteButton) {
      this.deleteButton.disabled = true;
    }
  }

  // MOUSE
  handleMouseDown(e) {
    const [mx, my] = this.getMousePos(e);

    switch (this.currentTool) {
      case "select":
        // pick object if any
        this.selectObjectUnderMouse(mx, my);
        if (this.selectedObject) {
          this.isDragging = true;
        }
        break;
      case "addHeroStart":
      case "addPathPoint":
      case "addSpot":
        // do action immediately
        this.handleClickAction(mx, my);
        break;
      default:
        // no-op
        break;
    }
  }

  handleMouseMove(e) {
    if (this.currentTool === "select" && this.isDragging && this.selectedObject) {
      const [mx, my] = this.getMousePos(e);
      this.moveSelectedObject(mx, my);
    }
  }

  handleMouseUp(e) {
    if (this.currentTool === "select" && this.isDragging) {
      this.isDragging = false;
    }
  }

  handleClickAction(mx, my) {
    switch (this.currentTool) {
      case "addHeroStart":
        this.addHeroStart(mx, my);
        break;
      case "addPathPoint":
        this.addPathPoint(mx, my);
        break;
      case "addSpot":
        this.addTowerSpot(mx, my);
        break;
    }
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    return [mx, my];
  }

  selectObjectUnderMouse(mx, my) {
    // check hero
    if (this.data.heroStart) {
      const dx = mx - this.data.heroStart.x;
      const dy = my - this.data.heroStart.y;
      if (Math.sqrt(dx*dx + dy*dy) < 12) {
        this.selectedObject = { type: "hero" };
        this.enableDeleteButton();
        return;
      }
    }
    // check tower spots
    if (Array.isArray(this.data.towerSpots)) {
      for (let i = 0; i < this.data.towerSpots.length; i++) {
        const spot = this.data.towerSpots[i];
        const dx = mx - spot.x;
        const dy = my - spot.y;
        if (Math.sqrt(dx*dx + dy*dy) < 12) {
          this.selectedObject = { type: "spot", index: i };
          this.enableDeleteButton();
          return;
        }
      }
    }
    // check path points
    if (Array.isArray(this.data.paths)) {
      for (let pIndex = 0; pIndex < this.data.paths.length; pIndex++) {
        const path = this.data.paths[pIndex];
        for (let ptIndex = 0; ptIndex < path.length; ptIndex++) {
          const pt = path[ptIndex];
          const dx = mx - pt.x;
          const dy = my - pt.y;
          if (Math.sqrt(dx*dx + dy*dy) < 8) {
            this.selectedObject = { type: "path", pathIndex: pIndex, pointIndex: ptIndex };
            this.enableDeleteButton();
            return;
          }
        }
      }
    }
    // if none found
    this.selectedObject = null;
    if (this.deleteButton) {
      this.deleteButton.disabled = true;
    }
  }

  enableDeleteButton() {
    if (this.deleteButton) {
      this.deleteButton.disabled = false;
    }
  }

  // DRAG
  moveSelectedObject(mx, my) {
    // Clamp within canvas
    const clampedX = Math.max(0, Math.min(mx, this.canvas.width));
    const clampedY = Math.max(0, Math.min(my, this.canvas.height));

    if (!this.selectedObject) return;
    switch (this.selectedObject.type) {
      case "hero":
        this.data.heroStart.x = clampedX;
        this.data.heroStart.y = clampedY;
        break;
      case "spot":
        this.data.towerSpots[this.selectedObject.index].x = clampedX;
        this.data.towerSpots[this.selectedObject.index].y = clampedY;
        break;
      case "path":
        const path = this.data.paths[this.selectedObject.pathIndex];
        if (path) {
          const pt = path[this.selectedObject.pointIndex];
          pt.x = clampedX;
          pt.y = clampedY;
        }
        break;
    }
  }

  handleDeleteSelection() {
    if (!this.selectedObject) return;
    switch (this.selectedObject.type) {
      case "hero":
        this.data.heroStart = null;
        // Re-show the "Add Hero Start" button if it was hidden
        const toolbar = this.canvas.parentElement.querySelector("div");
        if (toolbar) {
          const btns = toolbar.querySelectorAll("button");
          btns.forEach(b => {
            if (b.textContent === "Add Hero Start") {
              b.style.display = "inline-block";
            }
          });
        }
        break;
      case "spot":
        this.data.towerSpots.splice(this.selectedObject.index, 1);
        break;
      case "path":
        const path = this.data.paths[this.selectedObject.pathIndex];
        path.splice(this.selectedObject.pointIndex, 1);
        // if path is now empty, remove it
        if (path.length === 0) {
          this.data.paths.splice(this.selectedObject.pathIndex, 1);
          if (this.activePathIndex === this.selectedObject.pathIndex) {
            this.activePathIndex = -1;
          }
          this.refreshPathSelect();
        }
        break;
    }
    this.selectedObject = null;
    if (this.deleteButton) this.deleteButton.disabled = true;
  }

  // ACTIONS
  addHeroStart(mx, my) {
    if (!this.data.heroStart) {
      const clampedX = Math.max(0, Math.min(mx, this.canvas.width));
      const clampedY = Math.max(0, Math.min(my, this.canvas.height));
      this.data.heroStart = { x: clampedX, y: clampedY };

      // hide the button
      const toolbar = this.canvas.parentElement.querySelector("div");
      if (toolbar) {
        const btns = toolbar.querySelectorAll("button");
        btns.forEach(b => {
          if (b.textContent === "Add Hero Start") {
            b.style.display = "none";
          }
        });
      }
    }
  }

  addPathPoint(mx, my) {
    if (this.activePathIndex < 0 || this.activePathIndex >= this.data.paths.length) return;

    const path = this.data.paths[this.activePathIndex];
    const clampedX = Math.max(0, Math.min(mx, this.canvas.width));
    const clampedY = Math.max(0, Math.min(my, this.canvas.height));

    path.push({ x: clampedX, y: clampedY });
  }

  addTowerSpot(mx, my) {
    if (!this.data.towerSpots) {
      this.data.towerSpots = [];
    }
    const clampedX = Math.max(0, Math.min(mx, this.canvas.width));
    const clampedY = Math.max(0, Math.min(my, this.canvas.height));
    this.data.towerSpots.push({ x: clampedX, y: clampedY });
  }

  // DRAW LOOP
  draw = () => {
    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw BG if present
    if (this.bgImage) {
      this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = "darkgray";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw hero start
    if (this.data.heroStart) {
      const hx = this.data.heroStart.x;
      const hy = this.data.heroStart.y;
      this.ctx.fillStyle = this.isSelected("hero") ? "white" : "red";
      this.ctx.beginPath();
      this.ctx.arc(hx, hy, 10, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = "black";
      this.ctx.fillText("H", hx - 3, hy + 4);
    }

    // Draw paths
    if (this.data.paths) {
      this.ctx.lineWidth = 2;
      this.data.paths.forEach((path, pIndex) => {
        const isActive = (pIndex === this.activePathIndex);
        this.ctx.strokeStyle = isActive ? "yellow" : "blue";

        if (path.length > 0) {
          this.ctx.beginPath();
          path.forEach((pt, i) => {
            if (i === 0) {
              this.ctx.moveTo(pt.x, pt.y);
            } else {
              this.ctx.lineTo(pt.x, pt.y);
            }
          });
          this.ctx.stroke();
          // draw small circles
          path.forEach((pt, ptIndex) => {
            const selected = this.isSelected("path", pIndex, ptIndex);
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = selected ? "white" : (isActive ? "yellow" : "blue");
            this.ctx.fill();
          });
        }
      });
    }

    // Draw tower spots
    if (this.data.towerSpots) {
      this.data.towerSpots.forEach((spot, i) => {
        const selected = this.isSelected("spot", i);
        this.ctx.beginPath();
        this.ctx.arc(spot.x, spot.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = selected ? "white" : "green";
        this.ctx.fill();
      });
    }

    // schedule next frame
    requestAnimationFrame(this.draw);
  };

  isSelected(type, idxA = null, idxB = null) {
    if (!this.selectedObject) return false;
    if (this.selectedObject.type !== type) return false;

    if (type === "hero") {
      return true; // no extra indices
    }
    if (type === "spot") {
      return this.selectedObject.index === idxA;
    }
    if (type === "path") {
      return (this.selectedObject.pathIndex === idxA && this.selectedObject.pointIndex === idxB);
    }
    return false;
  }
}
