/**
 * Import/Export Controller - Handles configuration import and export
 */

const FileService = require('../services/FileService');
const ValidationService = require('../services/ValidationService');

class ImportExportController {
  /**
   * Import configuration from uploaded JSON
   */
  static async importConfig(req, res) {
    try {
      const newConfig = req.body;
      
      // Validate the incoming configuration
      if (!newConfig || !newConfig.slides || !newConfig.globalSettings) {
        return res.status(400).json({
          success: false,
          message: 'Invalid configuration format - missing slides or globalSettings'
        });
      }

      // Validate against schema
      const validationResult = ValidationService.validateConfig(newConfig);
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: `Configuration validation failed: ${validationResult.error}`
        });
      }

      // Write the new configuration to file
      await FileService.writeKioskData(newConfig);

      res.json({
        success: true,
        message: 'Configuration imported successfully',
        slidesCount: newConfig.slides.length
      });
    } catch (error) {
      console.error('Error importing configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import configuration'
      });
    }
  }

  /**
   * Export current configuration
   * Note: This endpoint returns the raw JSON data for client-side download
   */
  static async exportConfig(req, res) {
    try {
      const kioskData = await FileService.readKioskData();
      
      // Add metadata to export
      const exportData = {
        ...kioskData,
        exportMetadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          slidesCount: kioskData.slides.length
        }
      };
      
      res.json(exportData);
    } catch (error) {
      console.error('Error exporting configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export configuration'
      });
    }
  }

  /**
   * Validate imported configuration structure
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result with details
   */
  static validateImportedConfig(config) {
    const issues = [];
    
    try {
      // Check basic structure
      if (!config.globalSettings) {
        issues.push('Missing globalSettings');
      }
      
      if (!config.slides || !Array.isArray(config.slides)) {
        issues.push('Missing or invalid slides array');
      }
      
      // Validate slides
      if (config.slides) {
        config.slides.forEach((slide, index) => {
          if (!slide.id && slide.id !== 0) {
            issues.push(`Slide ${index}: Missing ID`);
          }
          if (!slide.text && !slide.image) {
            issues.push(`Slide ${index}: Must have either text or image`);
          }
          if (slide.time && slide.time < 4000) {
            issues.push(`Slide ${index}: Time must be at least 4 seconds`);
          }
        });
      }
      
      // Validate global settings
      if (config.globalSettings) {
        const settings = config.globalSettings;
        if (settings.titleFontSize && (settings.titleFontSize < 32 || settings.titleFontSize > 72)) {
          issues.push('Title font size must be between 32 and 72');
        }
        if (settings.descriptionFontSize && (settings.descriptionFontSize < 16 || settings.descriptionFontSize > 36)) {
          issues.push('Description font size must be between 16 and 36');
        }
      }
      
      return {
        isValid: issues.length === 0,
        issues: issues,
        slidesCount: config.slides ? config.slides.length : 0
      };
      
    } catch (error) {
      return {
        isValid: false,
        issues: [`Validation error: ${error.message}`],
        slidesCount: 0
      };
    }
  }
}

module.exports = ImportExportController;
