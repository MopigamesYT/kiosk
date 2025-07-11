/**
 * File Service - Handles all file operations with atomic writes
 */

const fs = require('fs').promises;
const path = require('path');
const atomic = require('write-file-atomic');
const constants = require('../constants');

class FileService {
  constructor() {
    this.writeQueue = Promise.resolve();
  }

  /**
   * Reads the kiosk JSON data
   * @returns {Promise<Object>} The kiosk data
   */
  async readKioskData() {
    const filePath = path.join(process.cwd(), constants.KIOSK_JSON_PATH);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        const initialData = {
          globalSettings: { 
            theme: constants.DEFAULT_THEME,
            titleFontSize: constants.DEFAULT_TITLE_FONT_SIZE,
            descriptionFontSize: constants.DEFAULT_DESCRIPTION_FONT_SIZE
          },
          slides: []
        };
        await this.writeKioskData(initialData);
        return initialData;
      }
      throw error;
    }
  }

  /**
   * Writes kiosk data atomically with queuing to prevent race conditions
   * @param {Object} data - The data to write
   * @returns {Promise<void>}
   */
  writeKioskData(data) {
    const filePath = path.join(process.cwd(), constants.KIOSK_JSON_PATH);
    const stringifiedData = JSON.stringify(data, null, 2);

    // Basic validation before writing
    try {
      JSON.parse(stringifiedData);
    } catch (e) {
      console.error("Error: Invalid JSON data before writing.", e);
      return Promise.reject(new Error("Invalid JSON data provided to writeKioskData"));
    }

    const writePromise = async () => {
      try {
        await atomic(filePath, stringifiedData);
      } catch (error) {
        console.error('Failed to write kiosk data atomically:', error);
        throw error;
      }
    };

    // Chain the new write operation to the queue
    this.writeQueue = this.writeQueue.then(writePromise, writePromise);
    return this.writeQueue;
  }

  /**
   * Ensures a directory exists
   * @param {string} dirPath - Directory path to create
   */
  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dirPath}:`, error);
      throw error;
    }
  }
}

module.exports = new FileService();
