/**
 * Kiosk Routes - Define all kiosk-related endpoints
 */

const express = require('express');
const KioskController = require('../controllers/KioskController');

const router = express.Router();

// Get all slides
router.get('/', KioskController.getSlides);

// Get complete kiosk data (slides + settings)
router.get('/data', KioskController.getKioskData);

// Create new slide
router.post('/', KioskController.createSlide);

// Update existing slide
router.put('/:id', KioskController.updateSlide);

// Delete slide
router.delete('/:id', KioskController.deleteSlide);

// Reorder slides
router.post('/reorder', KioskController.reorderSlides);

// Toggle slide visibility
router.post('/:id/toggle-visibility', KioskController.toggleVisibility);

module.exports = router;
