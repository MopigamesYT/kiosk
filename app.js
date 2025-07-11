/**
 * Main Application - Refactored Express server with modular structure
 */

const express = require('express');
const path = require('path');
const FileService = require('./src/services/FileService');
const constants = require('./src/constants');

// Import route modules
const kioskRoutes = require('./src/routes/kioskRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const importExportRoutes = require('./src/routes/importExportRoutes');

const app = express();
const PORT = process.env.PORT || constants.DEFAULT_PORT;

/**
 * Initialize application
 */
async function initializeApp() {
  try {
    // Ensure required directories exist
    await FileService.ensureDirectory(constants.UPLOAD_DIR);
    await FileService.ensureDirectory(constants.WATERMARK_DIR);
    
    console.log('Application directories initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application directories:', error);
    process.exit(1);
  }
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Static file serving
app.use('/upload', express.static(constants.UPLOAD_DIR));
app.use('/watermarks', express.static(constants.WATERMARK_DIR));

// API Routes
app.use('/kiosk', kioskRoutes);
app.use('/', settingsRoutes);
app.use('/', importExportRoutes);

// Page routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kiosk.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
async function startServer() {
  try {
    await initializeApp();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Kiosk server running at http://0.0.0.0:${PORT}`);
      console.log(`📊 Admin panel: http://0.0.0.0:${PORT}/admin`);
      console.log(`🖥️  Kiosk display: http://0.0.0.0:${PORT}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

startServer();
