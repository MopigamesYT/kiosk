# Backup of Old Files

This directory contains the original monolithic files that were replaced during the refactoring process.

## Files in this backup:

### `index.js` (Backend)
- **Status**: ✅ REPLACED by `app.js` and modular backend
- **Safe to delete**: Yes, after confirming new backend works
- **Replaced by**: 
  - `app.js` (main server)
  - `src/controllers/` (route handlers)
  - `src/services/` (business logic)
  - `src/routes/` (route definitions)

### `script.js` (Frontend Admin)
- **Status**: ✅ REPLACED by modular frontend
- **Safe to delete**: Yes, after confirming new admin interface works
- **Replaced by**:
  - `public/js/app.js` (main application)
  - `public/js/managers/KioskManager.js`
  - `public/js/managers/DragDropManager.js`
  - `public/js/managers/SettingsManager.js`
  - `public/js/managers/ImportExportManager.js`
  - `public/js/helpers/UIHelpers.js`

## Files NOT in this backup (still in use):

### `public/kiosk.js` (Frontend Display)
- **Status**: ⚠️ STILL NEEDED
- **Purpose**: Handles the kiosk display interface (kiosk.html)
- **Action**: Keep as-is, not part of admin refactoring

## Testing Before Permanent Deletion

Before permanently deleting these backup files:

1. Test the new backend (`npm start`)
2. Test all admin functionality:
   - Create/edit/delete slides
   - Drag and drop reordering
   - Global settings
   - Watermark upload
   - Import/export configuration
3. Verify kiosk display still works (uses `public/kiosk.js`)
4. Test for at least a week in production

## Rollback Instructions

If issues arise with the new system:

1. Stop the new server
2. Copy files back: `cp backup-old-files/index.js ./ && cp backup-old-files/script.js public/`
3. Update `admin.html` to use `<script src="script.js"></script>`
4. Start old server: `node index.js`

## When to Delete

These files can be safely deleted after:
- [ ] 1 week of successful operation with new system
- [ ] No issues reported
- [ ] Confirmed all functionality works
- [ ] Team is comfortable with new architecture

Created: $(date)
