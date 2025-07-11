/**
 * Dynamic Theme Service - Reads themes from themes.js file
 */

const fs = require('fs');
const path = require('path');

class ThemeService {
  constructor() {
    this.themesCache = null;
    this.lastCacheTime = 0;
    this.CACHE_DURATION = 5000; // 5 seconds cache
    this.themesPath = path.join(__dirname, '../../public/themes.js');
    this.lastModified = 0;
    
    // Check file modification time to invalidate cache
    this.checkFileModification();
  }

  /**
   * Check if themes.js file has been modified
   */
  checkFileModification() {
    try {
      const stats = fs.statSync(this.themesPath);
      const currentModified = stats.mtime.getTime();
      
      if (currentModified > this.lastModified) {
        this.lastModified = currentModified;
        this.clearCache();
      }
    } catch (error) {
      // File doesn't exist or can't be accessed, ignore
    }
  }

  /**
   * Load themes from themes.js file
   * @returns {Object} Theme registry
   */
  loadThemesFromFile() {
    try {
      const themesContent = fs.readFileSync(this.themesPath, 'utf8');
      
      // Extract the THEME_REGISTRY object using regex
      const registryMatch = themesContent.match(/const THEME_REGISTRY\s*=\s*(\{[\s\S]*?\});/);
      if (registryMatch) {
        // Use eval to parse the object (safe since it's our own file)
        const registryCode = registryMatch[1];
        const themeRegistry = eval('(' + registryCode + ')');
        return themeRegistry;
      }
    } catch (error) {
      console.error('Failed to load themes from file:', error);
    }
    
    // Fallback themes
    return {
      default: { name: 'Par défaut', category: 'basic' }
    };
  }

  /**
   * Get available themes with caching
   * @returns {Object} Theme registry
   */
  getThemes() {
    const now = Date.now();
    
    // Check for file modifications
    this.checkFileModification();
    
    // Return cached themes if still valid
    if (this.themesCache && (now - this.lastCacheTime) < this.CACHE_DURATION) {
      return this.themesCache;
    }
    
    // Load fresh themes
    this.themesCache = this.loadThemesFromFile();
    this.lastCacheTime = now;
    
    return this.themesCache;
  }

  /**
   * Get array of theme IDs
   * @returns {Array<string>} Theme IDs
   */
  getAvailableThemes() {
    return Object.keys(this.getThemes());
  }

  /**
   * Check if theme is valid
   * @param {string} themeId - Theme identifier
   * @returns {boolean} True if valid
   */
  isValidTheme(themeId) {
    return themeId in this.getThemes();
  }

  /**
   * Clear theme cache (useful for development)
   */
  clearCache() {
    this.themesCache = null;
    this.lastCacheTime = 0;
  }
}

// Export singleton instance
module.exports = new ThemeService();
