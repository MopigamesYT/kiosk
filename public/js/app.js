/**
 * Admin Application - Main application module that coordinates all managers
 */

import { KioskManager } from './managers/KioskManager.js';
import { DragDropManager } from './managers/DragDropManager.js';
import { SettingsManager } from './managers/SettingsManager.js';
import { ImportExportManager } from './managers/ImportExportManager.js';

class AdminApplication {
  constructor() {
    this.managers = {};
    this.initialize();
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Initialize managers in order
      this.managers.settings = new SettingsManager();
      this.managers.kiosk = new KioskManager();
      this.managers.dragDrop = new DragDropManager(this.managers.kiosk);
      this.managers.importExport = new ImportExportManager(
        this.managers.kiosk, 
        this.managers.settings
      );

      // Initialize theme
      this.managers.settings.initializeTheme();

      // Load initial data
      await this.loadInitialData();

      // Setup visual enhancements
      this.managers.dragDrop.addDragVisualFeedback();

      console.log('🚀 Admin application initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize admin application:', error);
      this.showErrorMessage('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    try {
      // Load slides and settings in parallel
      await Promise.all([
        this.managers.kiosk.loadSlides(),
        this.managers.settings.loadSettings()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      throw error;
    }
  }

  /**
   * Show error message to user
   * @param {string} message - Error message
   */
  showErrorMessage(message) {
    // Create error banner if it doesn't exist
    let errorBanner = document.getElementById('error-banner');
    if (!errorBanner) {
      errorBanner = document.createElement('div');
      errorBanner.id = 'error-banner';
      errorBanner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f44336;
        color: white;
        padding: 10px;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;
      document.body.prepend(errorBanner);
    }
    
    errorBanner.textContent = message;
    errorBanner.style.display = 'block';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      errorBanner.style.display = 'none';
    }, 10000);
  }

  /**
   * Refresh all data
   */
  async refreshAll() {
    try {
      await this.loadInitialData();
      console.log('🔄 Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      this.showErrorMessage('Failed to refresh data');
    }
  }

  /**
   * Get manager instance
   * @param {string} name - Manager name
   * @returns {Object} Manager instance
   */
  getManager(name) {
    return this.managers[name];
  }

  /**
   * Handle application errors
   * @param {Error} error - Error object
   * @param {string} context - Error context
   */
  handleError(error, context = 'Unknown') {
    console.error(`Application error in ${context}:`, error);
    this.showErrorMessage(`Error in ${context}. Please try again.`);
  }
}

// Initialize application when DOM is ready
let app;

function initializeApp() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      app = new AdminApplication();
    });
  } else {
    app = new AdminApplication();
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (app) {
    app.handleError(event.error, 'Global');
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (app) {
    app.handleError(event.reason, 'Promise');
  }
});

// Export for global access
window.AdminApp = {
  getInstance: () => app,
  refresh: () => app?.refreshAll()
};

// Start the application
initializeApp();
