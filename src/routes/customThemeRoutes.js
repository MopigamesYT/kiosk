const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

const USER_THEMES_DIR = path.join(__dirname, '../../public/userthemes');

/**
 * Save a custom theme
 */
router.post('/save', async (req, res) => {
    try {
        const { name, html } = req.body;
        
        if (!name || !html) {
            return res.status(400).json({
                success: false,
                message: 'Theme name and HTML content are required'
            });
        }
        
        // Sanitize filename
        const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, '_');
        const fileName = `${sanitizedName}.html`;
        const filePath = path.join(USER_THEMES_DIR, fileName);
        
        // Ensure directory exists
        await fs.mkdir(USER_THEMES_DIR, { recursive: true });
        
        // Save the theme file
        await fs.writeFile(filePath, html, 'utf8');
        
        res.json({
            success: true,
            message: 'Theme saved successfully',
            fileName: fileName,
            themeId: sanitizedName
        });
        
    } catch (error) {
        console.error('Error saving custom theme:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save theme'
        });
    }
});

/**
 * Get all custom themes
 */
router.get('/list', async (req, res) => {
    try {
        // Ensure directory exists
        await fs.mkdir(USER_THEMES_DIR, { recursive: true });
        
        const files = await fs.readdir(USER_THEMES_DIR);
        const themes = files
            .filter(file => file.endsWith('.html'))
            .map(file => ({
                id: file.replace('.html', ''),
                name: file.replace('.html', '').replace(/_/g, ' '),
                fileName: file
            }));
        
        res.json({
            success: true,
            themes
        });
        
    } catch (error) {
        console.error('Error listing custom themes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list themes'
        });
    }
});

/**
 * Get a specific custom theme
 */
router.get('/:themeId', async (req, res) => {
    try {
        const { themeId } = req.params;
        const fileName = `${themeId}.html`;
        const filePath = path.join(USER_THEMES_DIR, fileName);
        
        const html = await fs.readFile(filePath, 'utf8');
        
        res.json({
            success: true,
            html,
            themeId,
            name: themeId.replace(/_/g, ' ')
        });
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                message: 'Theme not found'
            });
        }
        
        console.error('Error getting custom theme:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get theme'
        });
    }
});

/**
 * Update an existing custom theme
 */
router.put('/update', async (req, res) => {
    try {
        const { id, name, html } = req.body;
        
        if (!id || !name || !html) {
            return res.status(400).json({
                success: false,
                message: 'Theme ID, name and HTML content are required'
            });
        }
        
        // Check if the theme exists
        const oldFileName = `${id}.html`;
        const oldFilePath = path.join(USER_THEMES_DIR, oldFileName);
        
        try {
            await fs.access(oldFilePath);
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'Theme not found'
            });
        }
        
        // Sanitize new filename
        const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, '_');
        const newFileName = `${sanitizedName}.html`;
        const newFilePath = path.join(USER_THEMES_DIR, newFileName);
        
        // Save the updated theme
        await fs.writeFile(newFilePath, html, 'utf8');
        
        // If the filename changed, delete the old file
        if (oldFileName !== newFileName) {
            await fs.unlink(oldFilePath);
        }
        
        res.json({
            success: true,
            message: 'Theme updated successfully',
            fileName: newFileName,
            themeId: sanitizedName
        });
        
    } catch (error) {
        console.error('Error updating custom theme:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update theme'
        });
    }
});

/**
 * Delete a custom theme
 */
router.delete('/:themeId', async (req, res) => {
    try {
        const { themeId } = req.params;
        const fileName = `${themeId}.html`;
        const filePath = path.join(USER_THEMES_DIR, fileName);
        
        await fs.unlink(filePath);
        
        res.json({
            success: true,
            message: 'Theme deleted successfully'
        });
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                message: 'Theme not found'
            });
        }
        
        console.error('Error deleting custom theme:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete theme'
        });
    }
});

module.exports = router;
