/**
 * Validation Service - Handles configuration validation
 */

const constants = require('../constants');

class ValidationService {
  /**
   * Configuration schema for validation
   */
  static get CONFIG_SCHEMA() {
    return {
      globalSettings: {
        type: 'object',
        properties: {
          theme: {
            type: 'string',
            enum: constants.SUPPORTED_THEMES
          },
          titleFontSize: { 
            type: 'number', 
            min: constants.MIN_TITLE_FONT_SIZE, 
            max: constants.MAX_TITLE_FONT_SIZE 
          },
          descriptionFontSize: { 
            type: 'number', 
            min: constants.MIN_DESCRIPTION_FONT_SIZE, 
            max: constants.MAX_DESCRIPTION_FONT_SIZE 
          },
          watermark: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              position: {
                type: 'string',
                enum: constants.WATERMARK_POSITIONS
              },
              size: { 
                type: 'number', 
                min: constants.MIN_WATERMARK_SIZE, 
                max: constants.MAX_WATERMARK_SIZE 
              },
              opacity: { 
                type: 'number', 
                min: constants.MIN_WATERMARK_OPACITY, 
                max: constants.MAX_WATERMARK_OPACITY 
              },
              image: { type: 'string' }
            }
          }
        }
      },
      slides: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            text: { type: 'string' },
            description: { type: 'string' },
            time: { type: ['number', 'null'] },
            image: { type: 'string' },
            accentColor: { type: 'string' },
            visibility: { type: 'boolean' }
          }
        }
      }
    };
  }

  /**
   * Validates a value against a schema type
   * @param {*} value - Value to validate
   * @param {Object} schema - Schema definition
   * @returns {boolean} True if valid
   */
  static validateType(value, schema) {
    // Handle null values
    if (value === null && Array.isArray(schema.type) && schema.type.includes('null')) {
      return true;
    }

    // Handle arrays
    if (schema.type === 'array' && Array.isArray(value)) {
      if (!schema.items) return true;
      return value.every(item => this.validateType(item, schema.items));
    }

    // Handle objects
    if (schema.type === 'object' && typeof value === 'object' && value !== null) {
      if (!schema.properties) return true;
      return Object.keys(schema.properties).every(key => {
        if (!value.hasOwnProperty(key)) return true; // Allow missing properties
        return this.validateType(value[key], schema.properties[key]);
      });
    }

    // Handle enums
    if (schema.enum && !schema.enum.includes(value)) {
      return false;
    }

    // Handle numbers with ranges
    if (schema.type === 'number' && typeof value === 'number') {
      if (schema.min !== undefined && value < schema.min) return false;
      if (schema.max !== undefined && value > schema.max) return false;
      return true;
    }

    // Handle basic types
    if (Array.isArray(schema.type)) {
      return schema.type.some(type => typeof value === type);
    }
    return typeof value === schema.type;
  }

  /**
   * Validates configuration against schema
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result with isValid and error properties
   */
  static validateConfig(config) {
    try {
      // Basic structure check
      if (!config || typeof config !== 'object') {
        return { isValid: false, error: 'Configuration must be an object' };
      }

      // Validate against schema
      if (!this.validateType(config, { type: 'object', properties: this.CONFIG_SCHEMA })) {
        return { isValid: false, error: 'Invalid configuration structure' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Validates slide time
   * @param {number} timeMs - Time in milliseconds
   * @returns {boolean} True if valid
   */
  static validateSlideTime(timeMs) {
    return timeMs === null || (typeof timeMs === 'number' && timeMs >= constants.MIN_SLIDE_TIME);
  }
}

module.exports = ValidationService;
