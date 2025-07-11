// imageQualityManager.js
// Decide which image resolution to load based on performance and file size
export class ImageQualityManager {
    constructor({ maxSizeKB = 300, minSizeKB = 100, minWidth = 854, minHeight = 480 } = {}) {
        this.maxSizeKB = maxSizeKB;
        this.minSizeKB = minSizeKB;
        this.minWidth = minWidth;
        this.minHeight = minHeight;
        this.processedImages = new Map(); // Cache processed images
    }

    // Create a compressed/resized version of an image
    async createLowQualityVersion(originalUrl, targetWidth = 854, targetHeight = 480, quality = 0.7) {
        const cacheKey = `${originalUrl}_${targetWidth}x${targetHeight}_${quality}`;
        
        if (this.processedImages.has(cacheKey)) {
            return this.processedImages.get(cacheKey);
        }

        try {
            // Load the original image
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            const loadPromise = new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
            });
            
            img.src = originalUrl;
            await loadPromise;

            // Create canvas for processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Calculate new dimensions maintaining aspect ratio
            const aspectRatio = img.width / img.height;
            let newWidth = targetWidth;
            let newHeight = targetHeight;

            if (aspectRatio > newWidth / newHeight) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
            }

            // Only downscale if original is larger
            if (img.width > newWidth || img.height > newHeight) {
                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
            } else {
                // Use original size if it's already small
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            }

            // Convert to compressed data URL - use PNG for transparency, JPEG for photos
            let compressedDataUrl;
            if (this.hasTransparency(ctx, canvas.width, canvas.height)) {
                // Use PNG for images with transparency
                compressedDataUrl = canvas.toDataURL('image/png');
            } else {
                // Use JPEG for opaque images (better compression)
                compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            }
            
            // Cache the result
            this.processedImages.set(cacheKey, compressedDataUrl);
            
            return compressedDataUrl;
        } catch (error) {
            console.warn('Failed to create low quality version:', error);
            return originalUrl; // Fallback to original
        }
    }

    // Check if canvas has any transparent pixels
    hasTransparency(ctx, width, height) {
        try {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            // Check alpha channel (every 4th value) for any non-255 values
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] < 255) {
                    return true; // Found transparency
                }
            }
            return false; // No transparency found
        } catch (error) {
            // If we can't read image data (CORS issues), assume no transparency
            console.warn('Could not check transparency, assuming opaque:', error);
            return false;
        }
    }
    // Get appropriate image URL based on performance state
    async getImageUrl(originalUrl, isLowPerformance) {
        if (!isLowPerformance) {
            return originalUrl; // Use original high-quality image
        }

        // Create and return low-quality version
        return await this.createLowQualityVersion(originalUrl);
    }
}