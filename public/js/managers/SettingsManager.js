/**
 * Settings Manager - Handles global settings, themes, and watermark configuration
 */

import { UIHelpers } from '../helpers/UIHelpers.js';
import { getThemeRegistry } from '../constants/themeConstants.js';

export class SettingsManager {
  constructor() {
    this.initializeElements();
    this.populateThemeOptions();
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
      
      // Performance controls
      performanceHeader: document.getElementById('performance-header'),
      performanceArrow: document.getElementById('performance-arrow'),
      performanceDrawer: document.getElementById('performance-drawer'),
      forceLowQualityImages: document.getElementById('force-low-quality-images'),
      disableAnimations: document.getElementById('disable-animations'),
      disableThemes: document.getElementById('disable-themes'),
      disableImageEffects: document.getElementById('disable-image-effects'),
      disableCursorTrails: document.getElementById('disable-cursor-trails'),
      fastTransitions: document.getElementById('fast-transitions'),
      showFpsCounter: document.getElementById('show-fps-counter'),
      
      // Watermark drawer controls
      watermarkHeader: document.getElementById('watermark-header'),
      watermarkArrow: document.getElementById('watermark-arrow'),
      watermarkDrawer: document.getElementById('watermark-drawer'),
      
      // Config drawer controls
      configHeader: document.getElementById('config-header'),
      configArrow: document.getElementById('config-arrow'),
      configDrawer: document.getElementById('config-drawer'),
      
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
   * Dynamically populate theme options from themes.js
   */
  populateThemeOptions() {
    try {
      if (this.elements.kioskThemeSelect) {
        const themeRegistry = getThemeRegistry();
        
        // Clear existing options
        this.elements.kioskThemeSelect.innerHTML = '';
        
        // Add theme options
        Object.keys(themeRegistry).forEach(themeId => {
          const option = document.createElement('option');
          option.value = themeId;
          option.textContent = themeRegistry[themeId].name;
          this.elements.kioskThemeSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Failed to populate theme options:', error);
      
      // Fallback: add just the default theme
      if (this.elements.kioskThemeSelect) {
        this.elements.kioskThemeSelect.innerHTML = '<option value="default">Par défaut</option>';
      }
    }
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

    // Performance controls
    this.attachPerformanceEventListeners();

    // Drawer controls
    this.attachDrawerEventListeners();
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

    // Note: Watermark settings no longer auto-save on change
    // They will be saved only when the main "Save" button is clicked
  }

  /**
   * Attach performance-specific event listeners
   */
  attachPerformanceEventListeners() {
    // Collapsible drawer functionality
    if (this.elements.performanceHeader) {
      this.elements.performanceHeader.addEventListener('click', () => {
        this.togglePerformanceDrawer();
      });
    }

    // Note: Performance settings are no longer auto-saved
    // They will be saved only when the main "Save" button is clicked
  }

  /**
   * Attach drawer event listeners for collapsible sections
   */
  attachDrawerEventListeners() {
    // Watermark drawer
    if (this.elements.watermarkHeader) {
      this.elements.watermarkHeader.addEventListener('click', () => {
        this.toggleDrawer('watermark');
      });
    }

    // Config drawer
    if (this.elements.configHeader) {
      this.elements.configHeader.addEventListener('click', () => {
        this.toggleDrawer('config');
      });
    }
  }

  /**
   * Toggle performance drawer visibility
   */
  togglePerformanceDrawer() {
    this.toggleDrawer('performance');
  }

  /**
   * Generic method to toggle any drawer
   * @param {string} drawerType - 'performance', 'watermark', or 'config'
   */
  toggleDrawer(drawerType) {
    const drawerElement = this.elements[`${drawerType}Drawer`];
    const arrowElement = this.elements[`${drawerType}Arrow`];
    
    if (!drawerElement || !arrowElement) return;

    const isCollapsed = drawerElement.classList.contains('collapsed');
    
    if (isCollapsed) {
      // Expand
      drawerElement.classList.remove('collapsed');
      arrowElement.classList.remove('collapsed');
      arrowElement.textContent = '▼';
    } else {
      // Collapse
      drawerElement.classList.add('collapsed');
      arrowElement.classList.add('collapsed');
      arrowElement.textContent = '▶';
    }
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
      UIHelpers.showNotification('Échec du chargement des paramètres', 'error');
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

    // Performance settings
    if (settings.performance) {
      this.populatePerformanceSettings(settings.performance);
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
   * Populate performance settings
   * @param {Object} performance - Performance settings
   */
  populatePerformanceSettings(performance) {
    if (this.elements.forceLowQualityImages) {
      this.elements.forceLowQualityImages.checked = performance.forceLowQualityImages || false;
    }

    if (this.elements.disableAnimations) {
      this.elements.disableAnimations.checked = performance.disableAnimations || false;
    }

    if (this.elements.disableThemes) {
      this.elements.disableThemes.checked = performance.disableThemes || false;
    }

    if (this.elements.disableImageEffects) {
      this.elements.disableImageEffects.checked = performance.disableImageEffects || false;
    }

    if (this.elements.disableCursorTrails) {
      this.elements.disableCursorTrails.checked = performance.disableCursorTrails || false;
    }

    if (this.elements.fastTransitions) {
      this.elements.fastTransitions.checked = performance.fastTransitions || false;
    }
    if (this.elements.showFpsCounter) {
      this.elements.showFpsCounter.checked = performance.showFpsCounter || false;
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
        descriptionFontSize: parseInt(this.elements.descriptionFontSize?.value || 24),
        performance: this.collectPerformanceSettings()
        // Note: We explicitly don't include lowPerformanceMode here
        // to avoid conflicts with the new granular settings
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
        UIHelpers.showNotification('Paramètres sauvegardés avec succès', 'success');
      }
    } catch (error) {
      console.error('Error saving global settings:', error);
      UIHelpers.showNotification('Échec de la sauvegarde des paramètres', 'error');
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
        UIHelpers.showNotification('Filigrane téléchargé avec succès', 'success');
      }
    } catch (error) {
      console.error('Error uploading watermark:', error);
      UIHelpers.showNotification('Échec du téléchargement du filigrane', 'error');
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

      // Only include performance settings if they exist in current settings
      try {
        const currentSettings = await UIHelpers.apiRequest('/global-settings');
        if (currentSettings.performance) {
          settings.performance = currentSettings.performance;
        }
      } catch (error) {
        // If we can't get current settings, just proceed without performance
        console.warn('Could not fetch current performance settings:', error);
      }

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
   * Collect performance settings from form
   * @returns {Object} Performance settings
   */
  collectPerformanceSettings() {
    return {
      forceLowQualityImages: this.elements.forceLowQualityImages?.checked || false,
      disableAnimations: this.elements.disableAnimations?.checked || false,
      disableThemes: this.elements.disableThemes?.checked || false,
      disableImageEffects: this.elements.disableImageEffects?.checked || false,
      disableCursorTrails: this.elements.disableCursorTrails?.checked || false,
      fastTransitions: this.elements.fastTransitions?.checked || false,
      showFpsCounter: this.elements.showFpsCounter?.checked || false
    };
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
