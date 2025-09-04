/**
 * mapEditor.js
 * 
 * Map Editor for positioning level markers on the world map
 */

export class MapEditor {
  constructor(containerElement) {
    this.container = containerElement;
    this.levels = [];
    this.isDragging = false;
    this.dragElement = null;
    this.dragOffset = { x: 0, y: 0 };
    this.nextLevelId = 1;
    
    this.init();
  }
  
  init() {
    this.container.innerHTML = `
      <div class="map-editor-container">
        <h2>Map Editor - Level Positioning</h2>
        
        <div id="mapEditorControls" class="map-editor-controls">
          <button id="addLevelBtn" class="btn">Add Level</button>
          <button id="removeLevelBtn" class="btn">Remove Level</button>
          <button id="saveLevelPositionsBtn" class="btn primary">Save Positions</button>
          <button id="loadLevelPositionsBtn" class="btn">Load Positions</button>
        </div>
        
        <div id="mapEditorCanvas" class="map-editor-canvas"></div>
        
        <div id="mapEditorInfo" class="map-editor-info">
          <strong>Instructions:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Click "Add Level" to add a new level marker</li>
            <li>Click "Remove Level" to remove the last level</li>
            <li>Drag level markers to reposition them</li>
            <li>Click "Save Positions" to store the current layout</li>
            <li>Saved positions will be used on the main screen</li>
          </ul>
        </div>
      </div>
    `;
    
    this.canvas = this.container.querySelector('#mapEditorCanvas');
    this.setupEventListeners();
    this.loadSavedPositions();
  }
  
  setupEventListeners() {
    // Control buttons
    const addBtn = this.container.querySelector('#addLevelBtn');
    const removeBtn = this.container.querySelector('#removeLevelBtn');
    const saveBtn = this.container.querySelector('#saveLevelPositionsBtn');
    const loadBtn = this.container.querySelector('#loadLevelPositionsBtn');
    
    addBtn?.addEventListener('click', () => this.addLevel());
    removeBtn?.addEventListener('click', () => this.removeLevel());
    saveBtn?.addEventListener('click', () => this.savePositions());
    loadBtn?.addEventListener('click', () => this.loadSavedPositions());
    
    // Canvas drag events
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    
    // Prevent default drag behavior on images
    this.canvas.addEventListener('dragstart', (e) => e.preventDefault());
  }
  
  addLevel() {
    const levelId = this.nextLevelId++;
    
    // Create level marker element
    const marker = document.createElement('div');
    marker.className = 'map-editor-level';
    marker.dataset.levelId = levelId;
    // Only position coordinates need to be inline (dynamic data)
    marker.style.left = Math.random() * (800 - 60) + 'px';
    marker.style.top = Math.random() * (600 - 60) + 'px';
    marker.textContent = levelId;
    
    this.canvas.appendChild(marker);
    this.levels.push({
      id: levelId,
      element: marker,
      x: parseFloat(marker.style.left),
      y: parseFloat(marker.style.top)
    });
    
    console.log(`Added level ${levelId}`);
    this.updateControlButtons();
  }
  
  removeLevel() {
    if (this.levels.length === 0) return;
    
    const lastLevel = this.levels.pop();
    lastLevel.element.remove();
    this.nextLevelId = Math.max(1, this.nextLevelId - 1);
    
    console.log(`Removed level ${lastLevel.id}`);
    this.updateControlButtons();
  }
  
  updateControlButtons() {
    const removeBtn = this.container.querySelector('#removeLevelBtn');
    if (removeBtn) {
      removeBtn.disabled = this.levels.length === 0;
    }
  }
  
  handleMouseDown(e) {
    const target = e.target.closest('.map-editor-level');
    if (!target) return;
    
    this.isDragging = true;
    this.dragElement = target;
    
    const rect = this.canvas.getBoundingClientRect();
    const elementRect = target.getBoundingClientRect();
    
    this.dragOffset = {
      x: e.clientX - elementRect.left,
      y: e.clientY - elementRect.top
    };
    
    target.style.zIndex = '20';
    this.canvas.style.cursor = 'grabbing';
    
    e.preventDefault();
  }
  
  handleMouseMove(e) {
    if (!this.isDragging || !this.dragElement) return;
    
    const rect = this.canvas.getBoundingClientRect();
    let x = e.clientX - rect.left - this.dragOffset.x;
    let y = e.clientY - rect.top - this.dragOffset.y;
    
    // Constrain to canvas bounds
    x = Math.max(0, Math.min(x, 800 - 60));
    y = Math.max(0, Math.min(y, 600 - 60));
    
    this.dragElement.style.left = x + 'px';
    this.dragElement.style.top = y + 'px';
    
    // Update level data
    const levelId = parseInt(this.dragElement.dataset.levelId);
    const level = this.levels.find(l => l.id === levelId);
    if (level) {
      level.x = x;
      level.y = y;
    }
    
    e.preventDefault();
  }
  
  handleMouseUp(e) {
    if (this.isDragging && this.dragElement) {
      this.dragElement.style.zIndex = '10';
      this.dragElement = null;
    }
    
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  }
  
  savePositions() {
    const positions = this.levels.map(level => ({
      id: level.id,
      x: level.x,
      y: level.y
    }));
    
    localStorage.setItem('mapEditor_levelPositions', JSON.stringify(positions));
    
    // Show success message
    const saveBtn = this.container.querySelector('#saveLevelPositionsBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saved!';
    saveBtn.style.background = '#28a745';
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = '';
    }, 1500);
    
    console.log('Level positions saved:', positions);
  }
  
  loadSavedPositions() {
    try {
      const saved = localStorage.getItem('mapEditor_levelPositions');
      if (!saved) {
        console.log('No saved positions found, loading defaults');
        this.loadDefaultPositions();
        return;
      }
      
      const positions = JSON.parse(saved);
      
      // Clear existing levels
      this.levels.forEach(level => level.element.remove());
      this.levels = [];
      
      // Create levels from saved data
      positions.forEach(pos => {
        const marker = document.createElement('div');
        marker.className = 'map-editor-level';
        marker.dataset.levelId = pos.id;
        // Only position coordinates inline (dynamic data)
        marker.style.left = pos.x + 'px';
        marker.style.top = pos.y + 'px';
        marker.textContent = pos.id;
        
        this.canvas.appendChild(marker);
        this.levels.push({
          id: pos.id,
          element: marker,
          x: pos.x,
          y: pos.y
        });
      });
      
      this.nextLevelId = Math.max(1, ...this.levels.map(l => l.id)) + 1;
      this.updateControlButtons();
      
      console.log('Loaded saved positions:', positions);
      
    } catch (error) {
      console.error('Error loading saved positions:', error);
      this.loadDefaultPositions();
    }
  }
  
  loadDefaultPositions() {
    // Default positions based on the current main screen layout
    const defaultPositions = [
      { id: 1, x: 80, y: 480 },   // Bottom left (treehouse)
      { id: 2, x: 280, y: 400 },  // Middle bottom (village)
      { id: 3, x: 520, y: 280 },  // Middle right (mountains)
      { id: 4, x: 680, y: 80 }    // Top right (castle)
    ];
    
    // Clear existing levels
    this.levels.forEach(level => level.element.remove());
    this.levels = [];
    
    // Create default levels
    defaultPositions.forEach(pos => {
      const marker = document.createElement('div');
      marker.className = 'map-editor-level';
      marker.dataset.levelId = pos.id;
      // Only position coordinates inline (dynamic data)
      marker.style.left = pos.x + 'px';
      marker.style.top = pos.y + 'px';
      marker.textContent = pos.id;
      
      this.canvas.appendChild(marker);
      this.levels.push({
        id: pos.id,
        element: marker,
        x: pos.x,
        y: pos.y
      });
    });
    
    this.nextLevelId = 5;
    this.updateControlButtons();
    
    console.log('Loaded default positions');
  }
}