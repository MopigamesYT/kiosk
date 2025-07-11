/**
 * Theme constants - Dynamically loads from themes.js
 * This module ensures themes are available across all JavaScript modules
 */

/**
 * Get available themes dynamically
 * @returns {Array<string>} Array of theme IDs
 */
export function getAvailableThemes() {
  if (typeof window !== 'undefined' && typeof window.getAvailableThemes === 'function') {
    return window.getAvailableThemes();
  }
  
  // Fallback if themes.js not loaded yet
  return ['default'];
}

/**
 * Get theme display name
 * @param {string} themeId - Theme identifier
 * @returns {string} French display name
 */
export function getThemeName(themeId) {
  if (typeof window !== 'undefined' && typeof window.getThemeName === 'function') {
    return window.getThemeName(themeId);
  }
  
  // Fallback
  return themeId === 'default' ? 'Par défaut' : themeId;
}

/**
 * Check if a theme is valid
 * @param {string} themeId - Theme identifier
 * @returns {boolean} True if theme exists
 */
export function isValidTheme(themeId) {
  if (typeof window !== 'undefined' && typeof window.isValidTheme === 'function') {
    return window.isValidTheme(themeId);
  }
  
  // Fallback
  return themeId === 'default';
}

/**
 * Get all themes with metadata
 * @returns {Object} Theme registry
 */
export function getThemeRegistry() {
  if (typeof window !== 'undefined' && typeof window.getThemeRegistry === 'function') {
    return window.getThemeRegistry();
  }
  
  // Fallback
  return { default: { name: 'Par défaut', category: 'basic' } };
}
