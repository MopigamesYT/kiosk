/**
 * Settings Routes - Define all settings-related endpoints
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const SettingsController = require('../controllers/SettingsController');
const FileService = require('../services/FileService');
const constants = require('../constants');

const router = express.Router();

// Configure multer for regular image uploads
const imageStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await FileService.ensureDirectory(constants.UPLOAD_DIR);
    cb(null, constants.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// Configure multer for watermark uploads
const watermarkStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await FileService.ensureDirectory(constants.WATERMARK_DIR);
    cb(null, constants.WATERMARK_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    cb(null, `watermark-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadImage = multer({ storage: imageStorage });
const uploadWatermark = multer({ storage: watermarkStorage });

// Global settings endpoints
router.get('/global-settings', SettingsController.getGlobalSettings);
router.post('/global-settings', SettingsController.updateGlobalSettings);

// Upload endpoints
router.post('/upload', uploadImage.single('image'), SettingsController.uploadImage);
router.post('/upload-watermark', uploadWatermark.single('watermark'), SettingsController.uploadWatermark);

module.exports = router;
