/**
 * Kiosk Controller - Handles CRUD operations for kiosk items
 */

const FileService = require('../services/FileService');
const ValidationService = require('../services/ValidationService');

class KioskController {
  /**
   * Get all kiosk slides
   */
  static async getSlides(req, res) {
    try {
      const kioskData = await FileService.readKioskData();
      res.json(kioskData.slides);
    } catch (error) {
      console.error('Error reading kiosk data for /kiosk:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve slides.' });
    }
  }

  /**
   * Get complete kiosk data (slides + global settings)
   */
  static async getKioskData(req, res) {
    try {
      const kioskData = await FileService.readKioskData();
      res.json(kioskData);
    } catch (error) {
      console.error('Error reading kiosk.json:', error);
      res.status(500).json({ success: false, message: 'Failed to read kiosk data.' });
    }
  }

  /**
   * Create a new kiosk item
   */
  static async createSlide(req, res) {
    try {
      const kioskData = await FileService.readKioskData();
      const newItem = { id: kioskData.slides.length + 1, ...req.body };
      
      // Validate slide time if provided
      if (newItem.time && !ValidationService.validateSlideTime(newItem.time)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Slide time must be at least 4 seconds' 
        });
      }
      
      kioskData.slides.push(newItem);
      await FileService.writeKioskData(kioskData);
      res.json({ success: true, updatedData: kioskData.slides });
    } catch (error) {
      console.error('Error in /kiosk (POST):', error);
      res.status(500).json({ success: false, message: 'Failed to add new item.' });
    }
  }

  /**
   * Update an existing kiosk item
   */
  static async updateSlide(req, res) {
    try {
      const id = parseInt(req.params.id);
      const kioskData = await FileService.readKioskData();
      const index = kioskData.slides.findIndex(item => item.id === id);

      if (index !== -1) {
        // Validate slide time if provided
        if (req.body.time && !ValidationService.validateSlideTime(req.body.time)) {
          return res.status(400).json({ 
            success: false, 
            message: 'Slide time must be at least 4 seconds' 
          });
        }
        
        kioskData.slides[index] = { ...kioskData.slides[index], ...req.body };
        await FileService.writeKioskData(kioskData);
        res.json({ success: true, updatedEntry: kioskData.slides[index] });
      } else {
        res.status(404).json({ success: false, message: 'Entry not found' });
      }
    } catch (error) {
      console.error('Error in /kiosk/:id (PUT):', error);
      res.status(500).json({ success: false, message: 'Failed to update item.' });
    }
  }

  /**
   * Delete a kiosk item
   */
  static async deleteSlide(req, res) {
    try {
      const id = parseInt(req.params.id);
      const kioskData = await FileService.readKioskData();
      const itemIndex = kioskData.slides.findIndex(item => item.id === id);

      if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      kioskData.slides.splice(itemIndex, 1);
      kioskData.slides = KioskController.reorganizeIds(kioskData.slides);
      await FileService.writeKioskData(kioskData);

      res.json({ success: true, updatedData: kioskData.slides });
    } catch (error) {
      console.error('Error in /kiosk/:id (DELETE):', error);
      res.status(500).json({ success: false, message: 'Failed to delete item.' });
    }
  }

  /**
   * Reorder slides
   */
  static async reorderSlides(req, res) {
    try {
      const newOrder = req.body;
      const kioskData = await FileService.readKioskData();

      if (!Array.isArray(newOrder)) {
        return res.status(400).json({ success: false, message: 'Invalid order format' });
      }

      const orderedSlides = newOrder.map(id => kioskData.slides.find(item => item.id === id)).filter(Boolean);
      if (orderedSlides.length !== newOrder.length) {
        return res.status(400).json({ success: false, message: 'Some items were not found' });
      }

      kioskData.slides = KioskController.reorganizeIds(orderedSlides);
      await FileService.writeKioskData(kioskData);
      res.json({ success: true, updatedData: kioskData.slides });
    } catch (error) {
      console.error('Error in /kiosk/reorder:', error);
      res.status(500).json({ success: false, message: 'Failed to reorder items.' });
    }
  }

  /**
   * Toggle slide visibility
   */
  static async toggleVisibility(req, res) {
    try {
      const id = parseInt(req.params.id);
      const kioskData = await FileService.readKioskData();
      const itemIndex = kioskData.slides.findIndex(item => item.id === id);

      if (itemIndex !== -1) {
        kioskData.slides[itemIndex].visibility = !kioskData.slides[itemIndex].visibility;
        await FileService.writeKioskData(kioskData);
        res.json({ success: true, updatedData: kioskData.slides });
      } else {
        res.status(404).json({ success: false, message: 'Item not found' });
      }
    } catch (error) {
      console.error('Error in /kiosk/:id/toggle-visibility:', error);
      res.status(500).json({ success: false, message: 'Failed to toggle visibility.' });
    }
  }

  /**
   * Reorganize slide IDs to be sequential
   * @param {Array} slides - Array of slides
   * @returns {Array} Slides with reorganized IDs
   */
  static reorganizeIds(slides) {
    return slides.map((item, index) => ({ ...item, id: index + 1 }));
  }
}

module.exports = KioskController;
