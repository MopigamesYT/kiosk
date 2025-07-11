/**
 * Application constants
 */

const themeService = require('./services/ThemeService');

module.exports = {
  // File paths
  KIOSK_JSON_PATH: 'kiosk.json',
  UPLOAD_DIR: 'public/upload',
  WATERMARK_DIR: 'public/watermarks',
  
  // Server settings
  DEFAULT_PORT: 3000,
  
  // Default values
  DEFAULT_THEME: 'default',
  DEFAULT_TITLE_FONT_SIZE: 48,
  DEFAULT_DESCRIPTION_FONT_SIZE: 24,
  
  // Validation limits
  MIN_SLIDE_TIME: 4000, // 4 seconds in milliseconds
  MIN_TITLE_FONT_SIZE: 32,
  MAX_TITLE_FONT_SIZE: 72,
  MIN_DESCRIPTION_FONT_SIZE: 16,
  MAX_DESCRIPTION_FONT_SIZE: 36,
  MIN_WATERMARK_SIZE: 20,
  MAX_WATERMARK_SIZE: 200,
  MIN_WATERMARK_OPACITY: 1,
  MAX_WATERMARK_OPACITY: 100,
  
  // Dynamic supported themes
  get SUPPORTED_THEMES() {
    return themeService.getAvailableThemes();
  },
  
  // Watermark positions
  WATERMARK_POSITIONS: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  
  // Theme service
  themeService
};
