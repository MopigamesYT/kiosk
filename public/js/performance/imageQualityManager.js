/**
 * Image Quality Manager - Intelligently manages image quality based on performance
 * Automatically switches between high/medium/low quality variants
 */

class ImageQualityManager {
    constructor(options = {}) {
        // Configuration
        this.maxFileSize = options.maxFileSize || 300 * 1024; // 300KB
        this.maxResolution = options.maxResolution || { width: 1920, height: 1080 };
        this.minResolution = options.minResolution || { width: 854, height: 480 }; // ~480p
        this.minFileSize = options.minFileSize || 100 * 1024; // 100KB minimum
        
        // Quality levels configuration
        this.qualityLevels = {
            high: { scale: 1.0, quality: 0.95, suffix: '' },
            medium: { scale: 0.75, quality: 0.85, suffix: '_medium' },
            low: { scale: 0.5, quality: 0.75, suffix: '_low' }
        };
        
        // Current state
        this.currentQualityLevel = 'high';
        this.imageCache = new Map(); // Cache for processed images
        this.loadingImages = new Map(); // Track images being processed
        this.performanceMonitor = null;
        
        // Statistics
        this.stats = {
            imagesProcessed: 0,
            qualityDowngrades: 0,
            qualityUpgrades: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        // Bind methods
        this.handlePerformanceChange = this.handlePerformanceChange.bind(this);
        this.handleStutterDetected = this.handleStutterDetected.bind(this);
        this.handlePerformanceRecovered = this.handlePerformanceRecovered.bind(this);
    }

    /**
     * Initialize with performance monitor
     */
    init(performanceMonitor) {
        this.performanceMonitor = performanceMonitor;
        
        // Listen to performance events
        this.performanceMonitor.onPerformanceChange = this.handlePerformanceChange;
        this.performanceMonitor.onStutterDetected = this.handleStutterDetected;
        this.performanceMonitor.onPerformanceRecovered = this.handlePerformanceRecovered;
        
        console.log('🖼️ Image Quality Manager initialized');
    }

    /**
     * Handle performance level changes
     */
    handlePerformanceChange(event) {
        const newQualityLevel = this.mapPerformanceLevelToQuality(event.currentLevel);
        
        if (newQualityLevel !== this.currentQualityLevel) {
            console.log(`🎚️ Adjusting image quality: ${this.currentQualityLevel} → ${newQualityLevel}`);
            this.currentQualityLevel = newQualityLevel;
            
            if (newQualityLevel !== 'high') {
                this.stats.qualityDowngrades++;
            } else {
                this.stats.qualityUpgrades++;
            }
        }
    }

    /**
     * Handle stutter detection - immediately reduce quality
     */
    handleStutterDetected(event) {
        if (this.currentQualityLevel === 'high') {
            this.currentQualityLevel = 'medium';
            console.log('⚠️ Stutter detected, reducing image quality to medium');
            this.stats.qualityDowngrades++;
        } else if (this.currentQualityLevel === 'medium') {
            this.currentQualityLevel = 'low';
            console.log('⚠️ Continued stutter, reducing image quality to low');
            this.stats.qualityDowngrades++;
        }
    }

    /**
     * Handle performance recovery - gradually increase quality
     */
    handlePerformanceRecovered(event) {
        if (this.currentQualityLevel === 'low') {
            this.currentQualityLevel = 'medium';
            console.log('✅ Performance recovered, increasing image quality to medium');
            this.stats.qualityUpgrades++;
        } else if (this.currentQualityLevel === 'medium' && event.fps >= 55) {
            this.currentQualityLevel = 'high';
            console.log('✅ Excellent performance, restoring high image quality');
            this.stats.qualityUpgrades++;
        }
    }

    /**
     * Map performance level to image quality level
     */
    mapPerformanceLevelToQuality(performanceLevel) {
        const mapping = {
            'high': 'high',
            'medium': 'medium',
            'low': 'low'
        };
        return mapping[performanceLevel] || 'medium';
    }

    /**
     * Get the appropriate image source for current quality level
     */
    async getOptimalImageSrc(originalSrc, forceQuality = null) {
        const targetQuality = forceQuality || this.currentQualityLevel;
        const cacheKey = `${originalSrc}_${targetQuality}`;
        
        // Check cache first
        if (this.imageCache.has(cacheKey)) {
            this.stats.cacheHits++;
            return this.imageCache.get(cacheKey);
        }
        
        this.stats.cacheMisses++;
        
        // Check if image needs quality adjustment
        const imageInfo = await this.analyzeImage(originalSrc);
        
        if (!this.needsQualityAdjustment(imageInfo, targetQuality)) {
            // Image is already optimal, cache and return original
            this.imageCache.set(cacheKey, originalSrc);
            return originalSrc;
        }
        
        // Generate or find quality variant
        const optimizedSrc = await this.getQualityVariant(originalSrc, imageInfo, targetQuality);
        this.imageCache.set(cacheKey, optimizedSrc);
        this.stats.imagesProcessed++;
        
        return optimizedSrc;
    }

    /**
     * Analyze image properties (size, dimensions)
     */
    async analyzeImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            const startTime = performance.now();
            
            img.onload = () => {
                const loadTime = performance.now() - startTime;
                
                // Estimate file size based on dimensions (rough approximation)
                const estimatedSize = (img.width * img.height * 3) / 2; // Rough JPEG estimate
                
                resolve({
                    width: img.width,
                    height: img.height,
                    estimatedSize,
                    loadTime,
                    aspectRatio: img.width / img.height
                });
            };
            
            img.onerror = () => {
                resolve({
                    width: 0,
                    height: 0,
                    estimatedSize: 0,
                    loadTime: 0,
                    aspectRatio: 1,
                    error: true
                });
            };
            
            img.src = src;
        });
    }

    /**
     * Check if image needs quality adjustment
     */
    needsQualityAdjustment(imageInfo, targetQuality) {
        if (imageInfo.error) return false;
        
        // Don't downgrade if image is already small
        if (imageInfo.estimatedSize <= this.minFileSize && 
            imageInfo.width <= this.minResolution.width && 
            imageInfo.height <= this.minResolution.height) {
            return false;
        }
        
        // Don't adjust if already at target quality
        if (targetQuality === 'high') return false;
        
        // Needs adjustment if image is large
        return imageInfo.estimatedSize > this.maxFileSize || 
               imageInfo.width > this.maxResolution.width || 
               imageInfo.height > this.maxResolution.height;
    }

    /**
     * Get or generate quality variant of image
     */
    async getQualityVariant(originalSrc, imageInfo, targetQuality) {
        // First, try to find pre-generated variants
        const qualityConfig = this.qualityLevels[targetQuality];
        const variantSrc = this.generateVariantPath(originalSrc, qualityConfig.suffix);
        
        // Check if variant exists
        if (await this.imageExists(variantSrc)) {
            console.log(`📁 Using pre-generated variant: ${variantSrc}`);
            return variantSrc;
        }
        
        // Generate variant on-the-fly using canvas
        console.log(`🔄 Generating ${targetQuality} quality variant for: ${originalSrc}`);
        return await this.generateImageVariant(originalSrc, imageInfo, qualityConfig);
    }

    /**
     * Generate variant path based on original and suffix
     */
    generateVariantPath(originalSrc, suffix) {
        if (!suffix) return originalSrc;
        
        const lastDotIndex = originalSrc.lastIndexOf('.');
        const basePath = originalSrc.substring(0, lastDotIndex);
        const extension = originalSrc.substring(lastDotIndex);
        
        return `${basePath}${suffix}${extension}`;
    }

    /**
     * Check if image exists
     */
    async imageExists(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
        });
    }

    /**
     * Generate image variant using canvas
     */
    async generateImageVariant(originalSrc, imageInfo, qualityConfig) {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                try {
                    // Calculate new dimensions
                    const newWidth = Math.max(
                        Math.round(img.width * qualityConfig.scale),
                        this.minResolution.width
                    );
                    const newHeight = Math.max(
                        Math.round(img.height * qualityConfig.scale),
                        this.minResolution.height
                    );
                    
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    
                    // Enable smooth scaling
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Draw scaled image
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    
                    // Convert to blob URL with quality setting
                    canvas.toBlob((blob) => {
                        const blobUrl = URL.createObjectURL(blob);
                        console.log(`✅ Generated variant: ${newWidth}x${newHeight} (scale: ${qualityConfig.scale})`);
                        resolve(blobUrl);
                    }, 'image/jpeg', qualityConfig.quality);
                    
                } catch (error) {
                    console.error('Error generating image variant:', error);
                    resolve(originalSrc); // Fallback to original
                }
            };
            
            img.onerror = () => {
                console.error('Error loading image for variant generation:', originalSrc);
                resolve(originalSrc); // Fallback to original
            };
            
            // Enable CORS for canvas manipulation
            img.crossOrigin = 'anonymous';
            img.src = originalSrc;
        });
    }

    /**
     * Preload image with optimal quality
     */
    async preloadImage(src) {
        const optimalSrc = await this.getOptimalImageSrc(src);
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ src: optimalSrc, element: img });
            img.onerror = reject;
            img.src = optimalSrc;
        });
    }

    /**
     * Create optimized picture element with multiple sources
     */
    async createPictureElement(src, alt = '', className = '') {
        const picture = document.createElement('picture');
        picture.className = className;
        
        try {
            // Generate different quality sources
            const highSrc = await this.getOptimalImageSrc(src, 'high');
            const mediumSrc = await this.getOptimalImageSrc(src, 'medium');
            const lowSrc = await this.getOptimalImageSrc(src, 'low');
            
            // Create source elements (WebP preferred, JPEG fallback)
            if (this.supportsWebP()) {
                const webpSources = await Promise.all([
                    this.convertToWebP(highSrc, 'high'),
                    this.convertToWebP(mediumSrc, 'medium'),
                    this.convertToWebP(lowSrc, 'low')
                ]);
                
                // Add WebP sources
                const webpHigh = document.createElement('source');
                webpHigh.srcset = webpSources[0];
                webpHigh.media = '(min-width: 1200px)';
                webpHigh.type = 'image/webp';
                picture.appendChild(webpHigh);
                
                const webpMedium = document.createElement('source');
                webpMedium.srcset = webpSources[1];
                webpMedium.media = '(min-width: 768px)';
                webpMedium.type = 'image/webp';
                picture.appendChild(webpMedium);
                
                const webpLow = document.createElement('source');
                webpLow.srcset = webpSources[2];
                webpLow.type = 'image/webp';
                picture.appendChild(webpLow);
            }
            
            // Add JPEG sources as fallback
            const jpegHigh = document.createElement('source');
            jpegHigh.srcset = highSrc;
            jpegHigh.media = '(min-width: 1200px)';
            picture.appendChild(jpegHigh);
            
            const jpegMedium = document.createElement('source');
            jpegMedium.srcset = mediumSrc;
            jpegMedium.media = '(min-width: 768px)';
            picture.appendChild(jpegMedium);
            
            // Default img element
            const img = document.createElement('img');
            img.src = lowSrc;
            img.alt = alt;
            img.loading = 'lazy';
            picture.appendChild(img);
            
        } catch (error) {
            console.error('Error creating picture element:', error);
            
            // Fallback to simple img element
            const img = document.createElement('img');
            img.src = src;
            img.alt = alt;
            img.loading = 'lazy';
            picture.appendChild(img);
        }
        
        return picture;
    }

    /**
     * Check WebP support
     */
    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    /**
     * Convert image to WebP format
     */
    async convertToWebP(src, quality) {
        // For now, return original src
        // In a real implementation, you might use a server endpoint or service worker
        return src;
    }

    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.stats,
            currentQualityLevel: this.currentQualityLevel,
            cacheSize: this.imageCache.size,
            loadingCount: this.loadingImages.size
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        // Revoke blob URLs to free memory
        for (const [key, value] of this.imageCache.entries()) {
            if (value.startsWith('blob:')) {
                URL.revokeObjectURL(value);
            }
        }
        
        this.imageCache.clear();
        console.log('🗑️ Image cache cleared');
    }
}

// Export for use in other modules
window.ImageQualityManager = ImageQualityManager;
