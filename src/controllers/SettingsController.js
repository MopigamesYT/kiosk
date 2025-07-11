/**
 * Settings Controller - Handles global settings and watermark operations
 */

const FileService = require('../services/FileService');
const ValidationService = require('../services/ValidationService');
const constants = require('../constants');

class SettingsController {
  /**
   * Get global settings
   */
  static async getGlobalSettings(req, res) {
    try {
      const kioskData = await FileService.readKioskData();
      res.json(kioskData.globalSettings);
    } catch (error) {
      console.error('Error reading kiosk data for /global-settings:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve global settings.' });
    }
  }

  /**
   * Update global settings
   */
  static async updateGlobalSettings(req, res) {
    try {
      const kioskData = await FileService.readKioskData();
      const newSettings = { ...kioskData.globalSettings, ...req.body };
      
      // Validate settings
      const validationResult = SettingsController.validateGlobalSettings(newSettings);
      if (!validationResult.isValid) {
        return res.status(400).json({ 
          success: false, 
          message: validationResult.error 
        });
      }
      
      kioskData.globalSettings = newSettings;
      await FileService.writeKioskData(kioskData);
      res.json({ success: true, globalSettings: kioskData.globalSettings });
    } catch (error) {
      console.error('Error in /global-settings:', error);
      res.status(500).json({ success: false, message: 'Failed to update global settings.' });
    }
  }

  /**
   * Handle watermark upload
   */
  static async uploadWatermark(req, res) {
    try {
      if (req.file) {
        res.json({ 
          success: true, 
          imagePath: `/watermarks/${req.file.filename}` 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }
    } catch (error) {
      console.error('Error uploading watermark:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload watermark' 
      });
    }
  }

  /**
   * Handle regular image upload
   */
  static async uploadImage(req, res) {
    try {
      if (req.file) {
        res.json({ 
          success: true, 
          imagePath: `/upload/${req.file.filename}` 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload image' 
      });
    }
  }

  /**
   * Validate global settings
   * @param {Object} settings - Settings to validate
   * @returns {Object} Validation result
   */
  static validateGlobalSettings(settings) {
    try {
      // Validate theme
      if (settings.theme && !constants.SUPPORTED_THEMES.includes(settings.theme)) {
        return { isValid: false, error: 'Invalid theme selected' };
      }

      // Validate font sizes
      if (settings.titleFontSize && 
          (settings.titleFontSize < constants.MIN_TITLE_FONT_SIZE || 
           settings.titleFontSize > constants.MAX_TITLE_FONT_SIZE)) {
        return { isValid: false, error: 'Title font size out of range' };
      }

      if (settings.descriptionFontSize && 
          (settings.descriptionFontSize < constants.MIN_DESCRIPTION_FONT_SIZE || 
           settings.descriptionFontSize > constants.MAX_DESCRIPTION_FONT_SIZE)) {
        return { isValid: false, error: 'Description font size out of range' };
      }

      // Validate watermark settings
      if (settings.watermark) {
        const watermark = settings.watermark;
        
        if (watermark.position && !constants.WATERMARK_POSITIONS.includes(watermark.position)) {
          return { isValid: false, error: 'Invalid watermark position' };
        }

        if (watermark.size && 
            (watermark.size < constants.MIN_WATERMARK_SIZE || 
             watermark.size > constants.MAX_WATERMARK_SIZE)) {
          return { isValid: false, error: 'Watermark size out of range' };
        }

        if (watermark.opacity && 
            (watermark.opacity < constants.MIN_WATERMARK_OPACITY || 
             watermark.opacity > constants.MAX_WATERMARK_OPACITY)) {
          return { isValid: false, error: 'Watermark opacity out of range' };
        }
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }
}

module.exports = SettingsController;
