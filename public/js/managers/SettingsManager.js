/**
 * Settings Manager - Handles global settings, themes, and watermark configuration
 */

import { UIHelpers } from '../helpers/UIHelpers.js';

export class SettingsManager {
  constructor() {
    this.initializeElements();
    this.attachEventListeners();
    this.loadSettings();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements = {
      // Theme toggle
      themeToggle: document.getElementById('theme-toggle'),
      
      // Global settings modal
      globalSettingsButton: document.getElementById('global-settings'),
      globalSettingsModal: document.getElementById('global-settings-modal'),
      saveGlobalSettingsButton: document.getElementById('save-global-settings'),
      cancelGlobalSettingsButton: document.getElementById('cancel-global-settings'),
      
      // Settings controls
      kioskThemeSelect: document.getElementById('kiosk-theme'),
      titleFontSize: document.getElementById('title-font-size'),
      descriptionFontSize: document.getElementById('description-font-size'),
      titleSizeDisplay: document.getElementById('title-size-display'),
      descriptionSizeDisplay: document.getElementById('description-size-display'),
      
      // Watermark controls
      watermarkEnabled: document.getElementById('watermark-enabled'),
      watermarkUpload: document.getElementById('watermarkUpload'),
      watermarkPosition: document.getElementById('watermark-position'),
      watermarkSize: document.getElementById('watermark-size'),
      watermarkOpacity: document.getElementById('watermark-opacity'),
      watermarkSizeDisplay: document.getElementById('watermark-size-display'),
      watermarkOpacityDisplay: document.getElementById('watermark-opacity-display'),
      currentWatermarkImg: document.querySelector('#current-watermark img'),
      noWatermarkText: document.querySelector('.no-watermark')
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Theme toggle
    if (this.elements.themeToggle) {
      this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Global settings modal
    if (this.elements.globalSettingsButton) {
      this.elements.globalSettingsButton.addEventListener('click', () => this.showGlobalSettings());
    }

    if (this.elements.saveGlobalSettingsButton) {
      this.elements.saveGlobalSettingsButton.addEventListener('click', () => this.saveGlobalSettings());
    }

    if (this.elements.cancelGlobalSettingsButton) {
      this.elements.cancelGlobalSettingsButton.addEventListener('click', () => this.hideGlobalSettings());
    }

    // Font size displays
    if (this.elements.titleFontSize) {
      this.elements.titleFontSize.addEventListener('input', () => {
        this.elements.titleSizeDisplay.textContent = `${this.elements.titleFontSize.value}px`;
      });
    }

    if (this.elements.descriptionFontSize) {
      this.elements.descriptionFontSize.addEventListener('input', () => {
        this.elements.descriptionSizeDisplay.textContent = `${this.elements.descriptionFontSize.value}px`;
      });
    }

    // Watermark controls
    this.attachWatermarkEventListeners();
  }

  /**
   * Attach watermark-specific event listeners
   */
  attachWatermarkEventListeners() {
    // Watermark size and opacity displays
    if (this.elements.watermarkSize) {
      this.elements.watermarkSize.addEventListener('input', () => {
        this.elements.watermarkSizeDisplay.textContent = `${this.elements.watermarkSize.value}px`;
      });
    }

    if (this.elements.watermarkOpacity) {
      this.elements.watermarkOpacity.addEventListener('input', () => {
        this.elements.watermarkOpacityDisplay.textContent = `${this.elements.watermarkOpacity.value}%`;
      });
    }

    // Watermark upload
    if (this.elements.watermarkUpload) {
      this.elements.watermarkUpload.addEventListener('change', (e) => this.handleWatermarkUpload(e));
    }

    // Auto-save watermark settings on change
    const watermarkControls = [
      this.elements.watermarkEnabled,
      this.elements.watermarkPosition,
      this.elements.watermarkSize,
      this.elements.watermarkOpacity
    ].filter(Boolean);

    watermarkControls.forEach(control => {
      control.addEventListener('change', () => this.saveWatermarkSettings());
      if (control.type === 'range') {
        control.addEventListener('input', () => this.saveWatermarkSettings());
      }
    });
  }

  /**
   * Load global settings from server
   */
  async loadSettings() {
    try {
      const settings = await UIHelpers.apiRequest('/global-settings');
      this.populateSettingsForm(settings);
    } catch (error) {
      console.error('Error loading global settings:', error);
      UIHelpers.showNotification('Failed to load settings', 'error');
    }
  }

  /**
   * Populate settings form with data
   * @param {Object} settings - Settings data
   */
  populateSettingsForm(settings) {
    // Theme and font settings
    if (this.elements.kioskThemeSelect) {
      this.elements.kioskThemeSelect.value = settings.theme || 'default';
    }

    if (this.elements.titleFontSize) {
      this.elements.titleFontSize.value = settings.titleFontSize || 48;
      this.elements.titleSizeDisplay.textContent = `${this.elements.titleFontSize.value}px`;
    }

    if (this.elements.descriptionFontSize) {
      this.elements.descriptionFontSize.value = settings.descriptionFontSize || 24;
      this.elements.descriptionSizeDisplay.textContent = `${this.elements.descriptionFontSize.value}px`;
    }

    // Watermark settings
    if (settings.watermark) {
      this.populateWatermarkSettings(settings.watermark);
    }
  }

  /**
   * Populate watermark settings
   * @param {Object} watermark - Watermark settings
   */
  populateWatermarkSettings(watermark) {
    if (this.elements.watermarkEnabled) {
      this.elements.watermarkEnabled.checked = watermark.enabled || false;
    }

    if (this.elements.watermarkPosition) {
      this.elements.watermarkPosition.value = watermark.position || 'bottom-right';
    }

    if (this.elements.watermarkSize) {
      this.elements.watermarkSize.value = watermark.size || 100;
      this.elements.watermarkSizeDisplay.textContent = `${this.elements.watermarkSize.value}px`;
    }

    if (this.elements.watermarkOpacity) {
      this.elements.watermarkOpacity.value = watermark.opacity || 50;
      this.elements.watermarkOpacityDisplay.textContent = `${this.elements.watermarkOpacity.value}%`;
    }

    // Current watermark image
    if (watermark.image && this.elements.currentWatermarkImg) {
      this.elements.currentWatermarkImg.src = watermark.image;
      this.elements.currentWatermarkImg.style.display = 'inline';
      if (this.elements.noWatermarkText) {
        this.elements.noWatermarkText.style.display = 'none';
      }
    }
  }

  /**
   * Show global settings modal
   */
  showGlobalSettings() {
    this.loadSettings();
    UIHelpers.showModal(this.elements.globalSettingsModal);
  }

  /**
   * Hide global settings modal
   */
  hideGlobalSettings() {
    UIHelpers.hideModal(this.elements.globalSettingsModal);
  }

  /**
   * Save global settings
   */
  async saveGlobalSettings() {
    try {
      const settings = {
        theme: this.elements.kioskThemeSelect?.value || 'default',
        titleFontSize: parseInt(this.elements.titleFontSize?.value || 48),
        descriptionFontSize: parseInt(this.elements.descriptionFontSize?.value || 24)
      };

      // Add watermark settings if they exist
      const watermarkSettings = this.collectWatermarkSettings();
      if (watermarkSettings) {
        settings.watermark = watermarkSettings;
      }

      const result = await UIHelpers.apiRequest('/global-settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });

      if (result.success) {
        this.hideGlobalSettings();
        UIHelpers.showNotification('Settings saved successfully', 'success');
      }
    } catch (error) {
      console.error('Error saving global settings:', error);
      UIHelpers.showNotification('Failed to save settings', 'error');
    }
  }

  /**
   * Handle watermark upload
   * @param {Event} e - File input change event
   */
  async handleWatermarkUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const result = await UIHelpers.uploadFile(file, '/upload-watermark', 'watermark');
      
      if (result.success) {
        // Update watermark image display
        if (this.elements.currentWatermarkImg) {
          this.elements.currentWatermarkImg.src = result.imagePath;
          this.elements.currentWatermarkImg.style.display = 'inline';
        }
        
        if (this.elements.noWatermarkText) {
          this.elements.noWatermarkText.style.display = 'none';
        }

        // Save watermark settings with new image
        await this.saveWatermarkSettings(result.imagePath);
        UIHelpers.showNotification('Watermark uploaded successfully', 'success');
      }
    } catch (error) {
      console.error('Error uploading watermark:', error);
      UIHelpers.showNotification('Failed to upload watermark', 'error');
    }
  }

  /**
   * Save watermark settings
   * @param {string|null} imagePath - Optional new image path
   */
  async saveWatermarkSettings(imagePath = null) {
    try {
      const settings = {
        theme: this.elements.kioskThemeSelect?.value || 'default',
        titleFontSize: parseInt(this.elements.titleFontSize?.value || 48),
        descriptionFontSize: parseInt(this.elements.descriptionFontSize?.value || 24),
        watermark: this.collectWatermarkSettings(imagePath)
      };

      const result = await UIHelpers.apiRequest('/global-settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });

      return result.success;
    } catch (error) {
      console.error('Error saving watermark settings:', error);
      return false;
    }
  }

  /**
   * Collect watermark settings from form
   * @param {string|null} imagePath - Optional image path
   * @returns {Object} Watermark settings
   */
  collectWatermarkSettings(imagePath = null) {
    const settings = {
      enabled: this.elements.watermarkEnabled?.checked || false,
      position: this.elements.watermarkPosition?.value || 'bottom-right',
      size: parseInt(this.elements.watermarkSize?.value || 100),
      opacity: parseInt(this.elements.watermarkOpacity?.value || 50)
    };

    if (imagePath) {
      settings.image = imagePath;
    } else if (this.elements.currentWatermarkImg?.src) {
      settings.image = this.elements.currentWatermarkImg.src.split(window.location.origin).pop();
    }

    return settings;
  }

  /**
   * Toggle dark/light theme
   */
  toggleTheme() {
    const isDark = !document.body.classList.contains('dark-theme');
    document.body.classList.toggle('dark-theme', isDark);
    localStorage.setItem('darkTheme', isDark);
  }

  /**
   * Initialize theme from localStorage
   */
  initializeTheme() {
    const savedTheme = localStorage.getItem('darkTheme');
    if (savedTheme !== null) {
      const isDark = savedTheme === 'true';
      document.body.classList.toggle('dark-theme', isDark);
    }
  }

  /**
   * Validate settings before saving
   * @param {Object} settings - Settings to validate
   * @returns {Object} Validation result
   */
  validateSettings(settings) {
    const errors = [];

    // Font size validation
    if (settings.titleFontSize < 32 || settings.titleFontSize > 72) {
      errors.push('Title font size must be between 32 and 72 pixels');
    }

    if (settings.descriptionFontSize < 16 || settings.descriptionFontSize > 36) {
      errors.push('Description font size must be between 16 and 36 pixels');
    }

    // Watermark validation
    if (settings.watermark) {
      const watermark = settings.watermark;
      
      if (watermark.size < 20 || watermark.size > 200) {
        errors.push('Watermark size must be between 20 and 200 pixels');
      }

      if (watermark.opacity < 1 || watermark.opacity > 100) {
        errors.push('Watermark opacity must be between 1 and 100 percent');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
