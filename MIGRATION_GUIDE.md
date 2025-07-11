# Kiosk Application Refactoring - Migration Guide

## Overview
This document outlines the complete refactoring of the Kiosk application from monolithic files to a modular, maintainable architecture.

## New Project Structure

```
/home/mopi/dev/kiosk/
├── app.js                          # New main application file (replaces index.js)
├── src/                           # Backend source code
│   ├── constants.js               # Application constants
│   ├── controllers/               # Route handlers
│   │   ├── KioskController.js     # CRUD operations for slides
│   │   ├── SettingsController.js  # Global settings & uploads
│   │   └── ImportExportController.js # Config import/export
│   ├── services/                  # Business logic
│   │   ├── FileService.js         # Atomic file operations
│   │   └── ValidationService.js   # Data validation
│   └── routes/                    # Express route definitions
│       ├── kioskRoutes.js         # Slide-related routes
│       ├── settingsRoutes.js      # Settings & upload routes
│       └── importExportRoutes.js  # Import/export routes
├── public/                        # Frontend files
│   ├── js/                        # Modular JavaScript
│   │   ├── app.js                 # Main frontend application
│   │   ├── managers/              # Feature managers
│   │   │   ├── KioskManager.js    # Slide CRUD operations
│   │   │   ├── DragDropManager.js # Drag & drop functionality
│   │   │   ├── SettingsManager.js # Settings management
│   │   │   └── ImportExportManager.js # Import/export features
│   │   └── helpers/               # Utility functions
│   │       └── UIHelpers.js       # DOM utilities & API helpers
│   ├── admin.html                 # Updated to use modules
│   ├── kiosk.html                 # Display interface
│   └── [other static files...]
└── [config files...]
```

## Key Improvements

### Backend Improvements
1. **Atomic File Writes**: Using `write-file-atomic` to prevent JSON corruption
2. **Write Queuing**: Serialized writes to prevent race conditions
3. **Modular Controllers**: Separated concerns into focused controllers
4. **Validation Service**: Centralized data validation with schema checking
5. **Error Handling**: Comprehensive error handling throughout the application
6. **Constants**: Centralized configuration values

### Frontend Improvements
1. **ES6 Modules**: Clean import/export structure
2. **Class-based Architecture**: Object-oriented approach for better organization
3. **Separation of Concerns**: Each manager handles specific functionality
4. **Utility Helpers**: Reusable functions for common operations
5. **Error Handling**: Graceful error handling with user feedback
6. **Async/Await**: Modern JavaScript patterns

## Migration Steps

### 1. Install Dependencies
```bash
pnpm add write-file-atomic
```

### 2. Start New Server
The new modular server can be started with:
```bash
npm start           # or node app.js
npm run dev         # or nodemon app.js (for development)
```

### 3. File Changes Summary

#### New Files Created:
- `app.js` - New main server file
- `src/constants.js` - Application constants
- `src/services/FileService.js` - Atomic file operations
- `src/services/ValidationService.js` - Data validation
- `src/controllers/KioskController.js` - Slide CRUD operations
- `src/controllers/SettingsController.js` - Settings management
- `src/controllers/ImportExportController.js` - Import/export functionality
- `src/routes/kioskRoutes.js` - Slide routes
- `src/routes/settingsRoutes.js` - Settings routes
- `src/routes/importExportRoutes.js` - Import/export routes
- `public/js/app.js` - Main frontend application
- `public/js/managers/KioskManager.js` - Slide management
- `public/js/managers/DragDropManager.js` - Drag & drop
- `public/js/managers/SettingsManager.js` - Settings management
- `public/js/managers/ImportExportManager.js` - Import/export
- `public/js/helpers/UIHelpers.js` - Utility functions

#### Modified Files:
- `package.json` - Updated main file and scripts
- `public/admin.html` - Updated to use ES6 modules

#### Files to Keep (unchanged):
- `public/kiosk.html` - Display interface
- `public/kiosk.js` - Display logic
- `public/kiosk.css` - Styles
- `public/styles.css` - Admin styles
- `public/themes.js` - Theme definitions
- All other static assets

#### Files that can be archived/removed after testing:
- `index.js` - Replaced by `app.js`
- `public/script.js` - Replaced by modular structure

## API Endpoints Remain the Same

All existing API endpoints continue to work as before:
- `GET /kiosk` - Get slides
- `POST /kiosk` - Create slide
- `PUT /kiosk/:id` - Update slide
- `DELETE /kiosk/:id` - Delete slide
- `POST /kiosk/reorder` - Reorder slides
- `POST /kiosk/:id/toggle-visibility` - Toggle visibility
- `GET /global-settings` - Get settings
- `POST /global-settings` - Update settings
- `POST /upload` - Upload image
- `POST /upload-watermark` - Upload watermark
- `POST /import-config` - Import configuration
- `GET /kiosk.json` - Export configuration

## Benefits of the New Architecture

1. **Maintainability**: Code is organized into logical modules
2. **Scalability**: Easy to add new features without affecting existing code
3. **Testability**: Each module can be tested independently
4. **Reliability**: Atomic writes prevent data corruption
5. **Performance**: Better error handling and resource management
6. **Developer Experience**: Clear separation of concerns and documentation

## Testing the Migration

1. **Backup**: Ensure you have a backup of your current `kiosk.json`
2. **Start Server**: Run `npm start` to use the new server
3. **Test Functionality**: 
   - Create, edit, delete slides
   - Drag and drop reordering
   - Global settings changes
   - Watermark upload
   - Import/export configuration
4. **Monitor Logs**: Check for any errors in the console
5. **File Integrity**: Verify that `kiosk.json` remains uncorrupted

## Future Enhancements

With the new modular structure, future improvements can include:
- TypeScript migration for better type safety
- Unit tests for each module
- Real-time updates using WebSockets
- Plugin system for custom themes/features
- API rate limiting and authentication
- Database storage option
- Multi-language support

## Rollback Plan

If issues arise, you can quickly rollback by:
1. Stopping the new server
2. Starting the old server: `node index.js`
3. Reverting `admin.html` to use `script.js`

The old files remain intact, so rollback is safe and immediate.
