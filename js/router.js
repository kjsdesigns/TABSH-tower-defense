/**
 * Simple client-side router for TABSH game
 * Handles URL changes and navigation between game states
 */

export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    
    // Listen for popstate events (back/forward button)
    window.addEventListener('popstate', (e) => {
      this.handleRoute(window.location.pathname + window.location.search);
    });
    
    // Initialize router
    this.init();
  }
  
  init() {
    // Register default routes
    this.addRoute('/', () => this.showMainScreen());
    this.addRoute('/level', (params) => this.showLevel(params.get('level')));
    this.addRoute('/editor', () => this.showEditor());
    
    // Handle initial page load
    this.handleRoute(window.location.pathname + window.location.search);
  }
  
  addRoute(path, handler) {
    this.routes.set(path, handler);
  }
  
  navigate(path, replace = false) {
    if (replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
    this.handleRoute(path);
  }
  
  handleRoute(fullPath) {
    const [path, query] = fullPath.split('?');
    const params = new URLSearchParams(query || '');
    
    // Find matching route
    const handler = this.routes.get(path);
    if (handler) {
      this.currentRoute = path;
      handler(params);
    } else {
      // Default to main screen for unknown routes
      this.navigate('/', true);
    }
  }
  
  showMainScreen() {
    const mainScreen = document.getElementById('mainScreen');
    const gameContainer = document.getElementById('gameContainer');
    const editorHub = document.getElementById('editorHub');
    
    if (mainScreen) mainScreen.style.display = 'block';
    if (gameContainer) gameContainer.style.display = 'none';
    if (editorHub) editorHub.style.display = 'none';
    
    // Stop any background music when returning to main
    if (window.soundManager) {
      window.soundManager.stopMusic();
    }
  }
  
  showLevel(levelName) {
    if (!levelName) {
      // No level specified, redirect to main
      this.navigate('/');
      return;
    }
    
    // Store the chosen level for the game to load
    localStorage.setItem('kr_chosenLevel', levelName);
    
    // Show game container
    const mainScreen = document.getElementById('mainScreen');
    const gameContainer = document.getElementById('gameContainer');
    const editorHub = document.getElementById('editorHub');
    
    if (mainScreen) mainScreen.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'block';
    if (editorHub) editorHub.style.display = 'none';
    
    // Start the game if startGameFromMainScreen is available
    if (window.startGameFromMainScreen) {
      window.startGameFromMainScreen();
    }
  }
  
  showEditor() {
    const mainScreen = document.getElementById('mainScreen');
    const gameContainer = document.getElementById('gameContainer');
    const editorHub = document.getElementById('editorHub');
    
    if (mainScreen) mainScreen.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'none';
    if (editorHub) editorHub.style.display = 'block';
    
    // Show editor hub if function is available
    if (window.showEditorHub) {
      window.showEditorHub();
    }
  }
  
  getCurrentRoute() {
    return this.currentRoute;
  }
}

// Create global router instance
export const router = new Router();

// Make router globally accessible for debugging
window.router = router;