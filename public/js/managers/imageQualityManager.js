// imageQualityManager.js
// Decide which image resolution to load based on performance and file size
export class ImageQualityManager {
    constructor({ maxSizeKB = 300, minSizeKB = 100, minWidth = 854, minHeight = 480, lowQuality = 0.6 } = {}) {
        this.maxSizeKB = maxSizeKB;
        this.minSizeKB = minSizeKB;
        this.minWidth = minWidth;
        this.minHeight = minHeight;
        this.lowQuality = lowQuality; // Default quality for reduced quality images
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

    // Create a quality-compressed version while preserving original dimensions
    async createReducedQualityVersion(originalUrl, quality = null) {
        // Use instance default quality if not specified
        const actualQuality = quality !== null ? quality : this.lowQuality;
        const cacheKey = `${originalUrl}_quality_${actualQuality}`;
        
        console.log(`🎨 Creating reduced quality version: quality=${actualQuality}`);
        
        if (this.processedImages.has(cacheKey)) {
            console.log(`📦 Using cached version for: ${originalUrl}`);
            return this.processedImages.get(cacheKey);
        }

        try {
            console.log(`📥 Loading original image: ${originalUrl}`);
            // Load the original image
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            const loadPromise = new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
            });
            
            img.src = originalUrl;
            await loadPromise;
            
            console.log(`📐 Original dimensions: ${img.width}x${img.height}`);

            // Create canvas with original dimensions
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Keep original dimensions for display consistency
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);

            // Convert to compressed data URL using WebP for best compression + transparency
            let compressedDataUrl;
            
            // Try WebP first (best compression + transparency support)
            if (this.supportsWebP()) {
                if (this.hasTransparency(ctx, canvas.width, canvas.height)) {
                    console.log(`🎭✨ Image has transparency, using WebP with quality ${actualQuality} (keeps transparency!)`);
                } else {
                    console.log(`📷✨ Image is opaque, using WebP with quality ${actualQuality}`);
                }
                compressedDataUrl = canvas.toDataURL('image/webp', actualQuality);
            } else {
                // Fallback for browsers that don't support WebP
                if (this.hasTransparency(ctx, canvas.width, canvas.height)) {
                    console.log(`🎭⚠️ WebP not supported, using PNG (no compression)`);
                    compressedDataUrl = canvas.toDataURL('image/png');
                } else {
                    console.log(`📷⚠️ WebP not supported, using JPEG with quality ${actualQuality}`);
                    compressedDataUrl = canvas.toDataURL('image/jpeg', actualQuality);
                }
            }
            
            console.log(`💾 Compressed size: ${Math.round(compressedDataUrl.length / 1024)}KB`);
            
            // Cache the result
            this.processedImages.set(cacheKey, compressedDataUrl);
            
            return compressedDataUrl;
        } catch (error) {
            console.warn('❌ Failed to create reduced quality version:', error);
            return originalUrl; // Fallback to original
        }
    }

    // Check if browser supports WebP format
    supportsWebP() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const dataURL = canvas.toDataURL('image/webp');
            return dataURL.indexOf('data:image/webp') === 0;
        } catch (error) {
            return false;
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
        console.log(`🖼️ ImageQualityManager: Processing ${originalUrl}, lowPerf: ${isLowPerformance}`);
        
        if (!isLowPerformance) {
            console.log(`✅ Using original quality for: ${originalUrl}`);
            return originalUrl; // Use original high-quality image
        }

        console.log(`🔄 Creating reduced quality version for: ${originalUrl}`);
        // Create and return reduced quality version (preserves original dimensions)
        const reducedQualityUrl = await this.createReducedQualityVersion(originalUrl);
        console.log(`✨ Reduced quality created:`, reducedQualityUrl.substring(0, 50) + '...');
        return reducedQualityUrl;
    }
}