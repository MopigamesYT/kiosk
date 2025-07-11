/**
 * Import/Export Routes - Define configuration import/export endpoints
 */

const express = require('express');
const ImportExportController = require('../controllers/ImportExportController');

const router = express.Router();

// Import configuration
router.post('/import-config', ImportExportController.importConfig);

// Export configuration (returns JSON for client-side download)
router.get('/kiosk.json', ImportExportController.exportConfig);

module.exports = router;
