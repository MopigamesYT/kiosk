/**
 * Image Quality Manager - Decides which image version to load based on performance
 * Manages image resizing, compression, and quality adaptation
 */

class ImageQualityManager {
    constructor(options = {}) {
        this.options = {
            maxFileSize: 300 * 1024,        // 300KB threshold for "heavy" images
            minFileSize: 100 * 1024,        // 100KB minimum file size
            maxDimension: 1920,             // Max width/height for high quality
            minDimension: 480,              // Min width/height (480p minimum)
            compressionQuality: 0.8,        // JPEG compression quality (0-1)
            webpQuality: 0.75,              // WebP compression quality (0-1)
            preloadTimeout: 10000,          // Timeout for image preloading
            cacheSize: 50,                  // Maximum number of cached images
            ...options
        };

        this.imageCache = new Map();
        this.performanceLevel = 'high';
        this.conversionCanvas = null;
        this.conversionContext = null;
        
        // Statistics
        this.stats = {
            imagesProcessed: 0,
            compressions: 0,
            cacheHits: 0,
            cacheMisses: 0,
            byteSavings: 0
        };

        this.initCanvas();
    }

    /**
     * Initialize canvas for image processing
     */
    initCanvas() {
        this.conversionCanvas = document.createElement('canvas');
        this.conversionContext = this.conversionCanvas.getContext('2d');
        this.conversionCanvas.style.display = 'none';
        document.body.appendChild(this.conversionCanvas);
    }

    /**
     * Update performance level from performance monitor
     */
    setPerformanceLevel(level) {
        if (this.performanceLevel !== level) {
            const oldLevel = this.performanceLevel;
            this.performanceLevel = level;
            console.log(`🎯 Performance level changed: ${oldLevel} → ${level}`);
            
            // Clear cache when switching to lower quality to free memory
            if (level === 'low' && oldLevel !== 'low') {
                this.clearCache();
            }
        }
    }

    /**
     * Get optimal image source based on current performance level
     */
    async getOptimalImageSrc(originalSrc, element = null) {
        try {
            // Check cache first
            const cacheKey = `${originalSrc}_${this.performanceLevel}`;
            if (this.imageCache.has(cacheKey)) {
                this.stats.cacheHits++;
                return this.imageCache.get(cacheKey);
            }

            this.stats.cacheMisses++;
            
            // Load and analyze original image
            const imageInfo = await this.analyzeImage(originalSrc);
            
            // Determine if we need to optimize based on performance and image size
            const needsOptimization = this.shouldOptimizeImage(imageInfo);
            
            if (!needsOptimization) {
                // Use original image
                this.cacheImage(cacheKey, originalSrc);
                return originalSrc;
            }

            // Create optimized version
            const optimizedSrc = await this.createOptimizedImage(imageInfo);
            this.cacheImage(cacheKey, optimizedSrc);
            
            return optimizedSrc;
            
        } catch (error) {
            console.warn(`⚠️ Failed to optimize image ${originalSrc}:`, error);
            return originalSrc; // Fallback to original
        }
    }

    /**
     * Analyze image properties (size, dimensions, format)
     */
    async analyzeImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Enable CORS for canvas processing
            
            img.onload = async () => {
                try {
                    // Get file size by fetching the image
                    const response = await fetch(src);
                    const blob = await response.blob();
                    
                    const info = {
                        src,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        fileSize: blob.size,
                        mimeType: blob.type,
                        element: img
                    };
                    
                    console.log(`📏 Image analysis: ${info.width}×${info.height}, ${(info.fileSize / 1024).toFixed(1)}KB, ${info.mimeType}`);
                    resolve(info);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    /**
     * Determine if image needs optimization based on performance and size
     */
    shouldOptimizeImage(imageInfo) {
        const { width, height, fileSize, mimeType } = imageInfo;
        
        // Always optimize if performance is poor
        if (this.performanceLevel === 'low') {
            return fileSize > this.options.minFileSize || 
                   Math.max(width, height) > this.options.minDimension * 2;
        }
        
        // Optimize medium performance if image is heavy
        if (this.performanceLevel === 'medium') {
            return fileSize > this.options.maxFileSize || 
                   Math.max(width, height) > this.options.maxDimension;
        }
        
        // High performance: only optimize extremely large images
        return fileSize > this.options.maxFileSize * 2 || 
               Math.max(width, height) > this.options.maxDimension * 1.5;
    }

    /**
     * Create optimized version of an image
     */
    async createOptimizedImage(imageInfo) {
        const { width, height, fileSize, element } = imageInfo;
        
        // Calculate target dimensions based on performance level
        const targetDimensions = this.calculateTargetDimensions(width, height);
        
        // Skip if already small enough
        if (targetDimensions.width === width && 
            targetDimensions.height === height && 
            fileSize <= this.getTargetFileSize()) {
            return imageInfo.src;
        }

        console.log(`🔧 Optimizing image: ${width}×${height} → ${targetDimensions.width}×${targetDimensions.height}`);
        
        // Resize and compress using canvas
        const optimizedDataUrl = await this.resizeAndCompress(
            element, 
            targetDimensions.width, 
            targetDimensions.height
        );
        
        this.stats.imagesProcessed++;
        this.stats.compressions++;
        
        // Estimate byte savings (rough calculation)
        const originalSize = fileSize;
        const estimatedNewSize = optimizedDataUrl.length * 0.75; // Rough base64 to binary ratio
        this.stats.byteSavings += Math.max(0, originalSize - estimatedNewSize);
        
        return optimizedDataUrl;
    }

    /**
     * Calculate target dimensions based on performance level
     */
    calculateTargetDimensions(originalWidth, originalHeight) {
        let maxDimension;
        
        switch (this.performanceLevel) {
            case 'low':
                maxDimension = Math.max(this.options.minDimension, this.options.maxDimension * 0.5);
                break;
            case 'medium':
                maxDimension = this.options.maxDimension * 0.75;
                break;
            case 'high':
            default:
                maxDimension = this.options.maxDimension;
                break;
        }
        
        // Calculate aspect ratio
        const aspectRatio = originalWidth / originalHeight;
        let targetWidth, targetHeight;
        
        if (originalWidth > originalHeight) {
            // Landscape
            targetWidth = Math.min(originalWidth, maxDimension);
            targetHeight = targetWidth / aspectRatio;
        } else {
            // Portrait or square
            targetHeight = Math.min(originalHeight, maxDimension);
            targetWidth = targetHeight * aspectRatio;
        }
        
        // Ensure minimum dimensions
        if (Math.max(targetWidth, targetHeight) < this.options.minDimension) {
            if (targetWidth > targetHeight) {
                targetWidth = this.options.minDimension;
                targetHeight = targetWidth / aspectRatio;
            } else {
                targetHeight = this.options.minDimension;
                targetWidth = targetHeight * aspectRatio;
            }
        }
        
        return {
            width: Math.round(targetWidth),
            height: Math.round(targetHeight)
        };
    }

    /**
     * Get target file size based on performance level
     */
    getTargetFileSize() {
        switch (this.performanceLevel) {
            case 'low':
                return this.options.minFileSize;
            case 'medium':
                return this.options.maxFileSize * 0.7;
            case 'high':
            default:
                return this.options.maxFileSize;
        }
    }

    /**
     * Resize and compress image using canvas
     */
    async resizeAndCompress(imageElement, targetWidth, targetHeight) {
        return new Promise((resolve) => {
            // Set canvas dimensions
            this.conversionCanvas.width = targetWidth;
            this.conversionCanvas.height = targetHeight;
            
            // Clear canvas
            this.conversionContext.clearRect(0, 0, targetWidth, targetHeight);
            
            // Enable image smoothing for better quality
            this.conversionContext.imageSmoothingEnabled = true;
            this.conversionContext.imageSmoothingQuality = 'high';
            
            // Draw resized image
            this.conversionContext.drawImage(
                imageElement,
                0, 0, imageElement.naturalWidth, imageElement.naturalHeight,
                0, 0, targetWidth, targetHeight
            );
            
            // Get compression quality based on performance level
            const quality = this.getCompressionQuality();
            
            // Convert to optimized format
            let dataUrl;
            
            // Try WebP first if supported, otherwise use JPEG
            if (this.supportsWebP()) {
                dataUrl = this.conversionCanvas.toDataURL('image/webp', this.options.webpQuality);
            } else {
                dataUrl = this.conversionCanvas.toDataURL('image/jpeg', quality);
            }
            
            resolve(dataUrl);
        });
    }

    /**
     * Get compression quality based on performance level
     */
    getCompressionQuality() {
        switch (this.performanceLevel) {
            case 'low':
                return 0.6;
            case 'medium':
                return 0.75;
            case 'high':
            default:
                return this.options.compressionQuality;
        }
    }

    /**
     * Check if browser supports WebP
     */
    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    /**
     * Cache optimized image
     */
    cacheImage(key, src) {
        // Implement LRU-style cache
        if (this.imageCache.size >= this.options.cacheSize) {
            // Remove oldest entry
            const firstKey = this.imageCache.keys().next().value;
            this.imageCache.delete(firstKey);
        }
        
        this.imageCache.set(key, src);
    }

    /**
     * Clear image cache
     */
    clearCache() {
        const cacheSize = this.imageCache.size;
        this.imageCache.clear();
        console.log(`🗑️ Cleared image cache (${cacheSize} items)`);
    }

    /**
     * Preload images with quality adaptation
     */
    async preloadImages(imageSrcs, options = {}) {
        const { onProgress, concurrency = 2 } = options;
        const results = [];
        let completed = 0;
        
        console.log(`🚀 Preloading ${imageSrcs.length} images with quality adaptation...`);
        
        // Process images in batches to limit concurrency
        for (let i = 0; i < imageSrcs.length; i += concurrency) {
            const batch = imageSrcs.slice(i, i + concurrency);
            
            const batchPromises = batch.map(async (src) => {
                try {
                    const optimizedSrc = await this.getOptimalImageSrc(src);
                    
                    // Preload the optimized image
                    await this.preloadSingleImage(optimizedSrc);
                    
                    completed++;
                    if (onProgress) {
                        onProgress(completed, imageSrcs.length);
                    }
                    
                    return { original: src, optimized: optimizedSrc, success: true };
                } catch (error) {
                    console.warn(`❌ Failed to preload image: ${src}`, error);
                    completed++;
                    if (onProgress) {
                        onProgress(completed, imageSrcs.length);
                    }
                    return { original: src, optimized: src, success: false, error };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        
        console.log(`✅ Preloaded ${results.filter(r => r.success).length}/${imageSrcs.length} images`);
        return results;
    }

    /**
     * Preload a single image
     */
    preloadSingleImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout preloading image: ${src}`));
            }, this.options.preloadTimeout);

            img.onload = () => {
                clearTimeout(timeoutId);
                resolve(img);
            };

            img.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error(`Failed to preload image: ${src}`));
            };

            img.src = src;
        });
    }

    /**
     * Get performance statistics
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.imageCache.size,
            performanceLevel: this.performanceLevel
        };
    }

    /**
     * Log performance statistics
     */
    logStats() {
        console.log('🖼️ Image Quality Manager Statistics:');
        console.log(`  Images processed: ${this.stats.imagesProcessed}`);
        console.log(`  Compressions: ${this.stats.compressions}`);
        console.log(`  Cache hits: ${this.stats.cacheHits}`);
        console.log(`  Cache misses: ${this.stats.cacheMisses}`);
        console.log(`  Bytes saved: ${(this.stats.byteSavings / 1024).toFixed(1)}KB`);
        console.log(`  Cache size: ${this.imageCache.size}/${this.options.cacheSize}`);
        console.log(`  Performance level: ${this.performanceLevel}`);
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.clearCache();
        if (this.conversionCanvas) {
            this.conversionCanvas.remove();
        }
    }
}

// Export for use in other modules
window.ImageQualityManager = ImageQualityManager;
