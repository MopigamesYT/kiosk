/**
 * Import/Export Manager - Handles configuration import and export functionality
 */

import { UIHelpers } from '../helpers/UIHelpers.js';
import { getAvailableThemes, isValidTheme } from '../constants/themeConstants.js';

export class ImportExportManager {
  constructor(kioskManager, settingsManager) {
    this.kioskManager = kioskManager;
    this.settingsManager = settingsManager;
    this.initializeElements();
    this.attachEventListeners();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements = {
      exportConfigBtn: document.getElementById('export-config'),
      importConfigBtn: document.getElementById('import-config'),
      importConfigInput: document.getElementById('import-config-input')
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (this.elements.exportConfigBtn) {
      this.elements.exportConfigBtn.addEventListener('click', () => this.exportConfig());
    }

    if (this.elements.importConfigBtn) {
      this.elements.importConfigBtn.addEventListener('click', () => {
        this.elements.importConfigInput?.click();
      });
    }

    if (this.elements.importConfigInput) {
      this.elements.importConfigInput.addEventListener('change', (e) => this.importConfig(e));
    }
  }

  /**
   * Export current configuration
   */
  async exportConfig() {
    try {
      const configData = await UIHelpers.apiRequest('/kiosk.json');
      
      // Create filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `kiosk-config-${dateStr}.json`;
      
      // Create and trigger download
      this.downloadJson(configData, filename);
      
      UIHelpers.showNotification('Configuration exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting configuration:', error);
      UIHelpers.showNotification('Failed to export configuration', 'error');
    }
  }

  /**
   * Import configuration from file
   * @param {Event} event - File input change event
   */
  async importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset the input value
    event.target.value = '';

    try {
      const configText = await this.readFileAsText(file);
      const config = JSON.parse(configText);
      
      // Validate configuration
      const validationResult = this.validateConfig(config);
      if (!validationResult.isValid) {
        UIHelpers.showNotification(
          `Invalid configuration: ${validationResult.errors.join(', ')}`, 
          'error'
        );
        return;
      }

      // Confirm import
      if (!(await this.confirmImport(validationResult))) {
        return;
      }

      // Send to server
      const result = await UIHelpers.apiRequest('/import-config', {
        method: 'POST',
        body: JSON.stringify(config)
      });

      if (result.success) {
        UIHelpers.showNotification('Configuration imported successfully', 'success');
        
        // Reload data
        await this.kioskManager.loadSlides();
        await this.settingsManager.loadSettings();
      }
    } catch (error) {
      console.error('Error importing configuration:', error);
      
      if (error instanceof SyntaxError) {
        UIHelpers.showNotification('Invalid JSON file format', 'error');
      } else {
        UIHelpers.showNotification('Failed to import configuration', 'error');
      }
    }
  }

  /**
   * Read file as text
   * @param {File} file - File to read
   * @returns {Promise<string>} File content as text
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Download JSON data as file
   * @param {Object} data - Data to download
   * @param {string} filename - Filename for download
   */
  downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Validate imported configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];

    try {
      // Basic structure validation
      if (!config || typeof config !== 'object') {
        errors.push('Configuration must be a valid object');
        return { isValid: false, errors, warnings };
      }

      // Check for required properties
      if (!config.globalSettings) {
        errors.push('Missing globalSettings');
      }

      if (!config.slides || !Array.isArray(config.slides)) {
        errors.push('Missing or invalid slides array');
      }

      // Validate global settings
      if (config.globalSettings) {
        const settingsValidation = this.validateGlobalSettings(config.globalSettings);
        errors.push(...settingsValidation.errors);
        warnings.push(...settingsValidation.warnings);
      }

      // Validate slides
      if (config.slides && Array.isArray(config.slides)) {
        const slidesValidation = this.validateSlides(config.slides);
        errors.push(...slidesValidation.errors);
        warnings.push(...slidesValidation.warnings);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        slidesCount: config.slides ? config.slides.length : 0,
        hasWatermark: config.globalSettings?.watermark?.enabled || false
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate global settings
   * @param {Object} settings - Global settings to validate
   * @returns {Object} Validation result
   */
  validateGlobalSettings(settings) {
    const errors = [];
    const warnings = [];

    // Theme validation - use dynamic theme list
    const validThemes = getAvailableThemes();
    if (settings.theme && !validThemes.includes(settings.theme)) {
      warnings.push(`Unknown theme: ${settings.theme}`);
    }

    // Font size validation
    if (settings.titleFontSize) {
      if (typeof settings.titleFontSize !== 'number' || 
          settings.titleFontSize < 32 || 
          settings.titleFontSize > 72) {
        errors.push('Title font size must be between 32 and 72');
      }
    }

    if (settings.descriptionFontSize) {
      if (typeof settings.descriptionFontSize !== 'number' || 
          settings.descriptionFontSize < 16 || 
          settings.descriptionFontSize > 36) {
        errors.push('Description font size must be between 16 and 36');
      }
    }

    // Watermark validation
    if (settings.watermark) {
      const watermarkValidation = this.validateWatermarkSettings(settings.watermark);
      errors.push(...watermarkValidation.errors);
      warnings.push(...watermarkValidation.warnings);
    }

    return { errors, warnings };
  }

  /**
   * Validate watermark settings
   * @param {Object} watermark - Watermark settings to validate
   * @returns {Object} Validation result
   */
  validateWatermarkSettings(watermark) {
    const errors = [];
    const warnings = [];

    const validPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    if (watermark.position && !validPositions.includes(watermark.position)) {
      errors.push(`Invalid watermark position: ${watermark.position}`);
    }

    if (watermark.size) {
      if (typeof watermark.size !== 'number' || watermark.size < 20 || watermark.size > 200) {
        errors.push('Watermark size must be between 20 and 200');
      }
    }

    if (watermark.opacity) {
      if (typeof watermark.opacity !== 'number' || watermark.opacity < 1 || watermark.opacity > 100) {
        errors.push('Watermark opacity must be between 1 and 100');
      }
    }

    if (watermark.enabled && !watermark.image) {
      warnings.push('Watermark is enabled but no image is specified');
    }

    return { errors, warnings };
  }

  /**
   * Validate slides array
   * @param {Array} slides - Slides to validate
   * @returns {Object} Validation result
   */
  validateSlides(slides) {
    const errors = [];
    const warnings = [];

    slides.forEach((slide, index) => {
      const slideNum = index + 1;

      // ID validation
      if (slide.id === undefined || slide.id === null) {
        warnings.push(`Slide ${slideNum}: Missing ID (will be auto-assigned)`);
      }

      // Content validation
      if (!slide.text && !slide.image) {
        errors.push(`Slide ${slideNum}: Must have either text or image`);
      }

      // Time validation
      if (slide.time !== null && slide.time !== undefined) {
        if (typeof slide.time !== 'number' || slide.time < 4000) {
          errors.push(`Slide ${slideNum}: Time must be at least 4000ms (4 seconds)`);
        }
      }

      // Accent color validation
      if (slide.accentColor && !/^#[0-9A-Fa-f]{6}$/.test(slide.accentColor)) {
        warnings.push(`Slide ${slideNum}: Invalid accent color format`);
      }

      // Visibility validation
      if (slide.visibility !== undefined && typeof slide.visibility !== 'boolean') {
        warnings.push(`Slide ${slideNum}: Visibility should be boolean`);
      }
    });

    return { errors, warnings };
  }

  /**
   * Show confirmation dialog for import
   * @param {Object} validationResult - Validation result
   * @returns {Promise<boolean>} Whether user confirmed
   */
  async confirmImport(validationResult) {
    let message = `Import configuration with ${validationResult.slidesCount} slides?`;
    
    if (validationResult.hasWatermark) {
      message += '\\n\\nThis configuration includes watermark settings.';
    }

    if (validationResult.warnings.length > 0) {
      message += `\\n\\nWarnings:\\n${validationResult.warnings.join('\\n')}`;
    }

    message += '\\n\\nThis will replace your current configuration. Continue?';

    return await this.showImportConfirmationModal('Import Configuration', message);
  }

  /**
   * Create configuration backup
   * @returns {Promise<Object>} Current configuration
   */
  async createBackup() {
    try {
      const config = await UIHelpers.apiRequest('/kiosk.json');
      
      // Save to localStorage as backup
      const backupKey = `kiosk-backup-${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(config));
      
      // Keep only last 5 backups
      this.cleanupBackups();
      
      return config;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Clean up old backups from localStorage
   */
  cleanupBackups() {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('kiosk-backup-'))
      .sort()
      .reverse();

    // Remove all but the latest 5 backups
    backupKeys.slice(5).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Get available backups
   * @returns {Array} List of available backups
   */
  getAvailableBackups() {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('kiosk-backup-'))
      .map(key => {
        const timestamp = parseInt(key.replace('kiosk-backup-', ''));
        return {
          key,
          date: new Date(timestamp),
          config: JSON.parse(localStorage.getItem(key))
        };
      })
      .sort((a, b) => b.date - a.date);
  }

  /**
   * Show import confirmation modal
   * @param {string} title - Modal title
   * @param {string} message - Confirmation message
   * @returns {Promise<boolean>} True if confirmed
   */
  async showImportConfirmationModal(title, message) {
    return new Promise((resolve) => {
      // Create modal backdrop
      const backdrop = document.createElement('div');
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Create modal
      const modal = document.createElement('div');
      modal.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 500px;
        margin: 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      `;

      // Format message for HTML (replace \\n with <br>)
      const formattedMessage = message.replace(/\\n/g, '<br>');

      modal.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #333;">${title}</h3>
        <div style="margin: 0 0 20px 0; color: #666; line-height: 1.4;">${formattedMessage}</div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="cancel-btn" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button id="confirm-btn" style="padding: 8px 16px; border: none; background: #2196F3; color: white; border-radius: 4px; cursor: pointer;">Import</button>
        </div>
      `;

      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      // Handle buttons
      const cancelBtn = modal.querySelector('#cancel-btn');
      const confirmBtn = modal.querySelector('#confirm-btn');

      const cleanup = () => {
        document.body.removeChild(backdrop);
      };

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      confirmBtn.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      // Close on backdrop click
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          cleanup();
          resolve(false);
        }
      });
    });
  }
}
