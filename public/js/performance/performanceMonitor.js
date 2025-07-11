/**
 * Performance Monitor - Detects frame rate drops and rendering stutter
 * Uses requestAnimationFrame timing to monitor FPS and performance
 */

class PerformanceMonitor {
    constructor(options = {}) {
        this.options = {
            targetFPS: 30,           // Target FPS (lower threshold for low-power devices)
            minFPS: 20,             // Critical FPS threshold
            sampleSize: 60,         // Number of frames to average
            stutterThreshold: 5,    // Number of consecutive bad frames to trigger stutter
            memoryCheckInterval: 5000, // Check memory usage every 5 seconds
            ...options
        };

        this.frameTimestamps = [];
        this.currentFPS = 0;
        this.isMonitoring = false;
        this.consecutiveBadFrames = 0;
        this.listeners = {
            stutter: [],
            smooth: [],
            fpsChange: []
        };

        this.memoryPressure = 'normal'; // 'normal', 'high', 'critical'
        this.lastMemoryCheck = 0;

        // Performance statistics
        this.stats = {
            averageFPS: 0,
            worstFPS: Infinity,
            bestFPS: 0,
            stutterEvents: 0,
            totalFrames: 0
        };

        this.rafId = null;
    }

    /**
     * Start monitoring performance
     */
    start() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.frameTimestamps = [];
        this.consecutiveBadFrames = 0;
        
        console.log('🔍 Starting performance monitoring...');
        this.monitorFrame();
        this.startMemoryMonitoring();
    }

    /**
     * Stop monitoring performance
     */
    stop() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        console.log('⏹️ Stopped performance monitoring');
        this.logStats();
    }

    /**
     * Monitor frame timing using requestAnimationFrame
     */
    monitorFrame() {
        if (!this.isMonitoring) return;

        const timestamp = performance.now();
        this.frameTimestamps.push(timestamp);
        this.stats.totalFrames++;

        // Keep only the last N frames for FPS calculation
        if (this.frameTimestamps.length > this.options.sampleSize) {
            this.frameTimestamps.shift();
        }

        // Calculate FPS if we have enough samples
        if (this.frameTimestamps.length >= 2) {
            this.calculateFPS();
            this.checkForStutter();
        }

        // Check memory pressure periodically
        this.checkMemoryPressure(timestamp);

        this.rafId = requestAnimationFrame(() => this.monitorFrame());
    }

    /**
     * Calculate current FPS based on frame timestamps
     */
    calculateFPS() {
        const timestamps = this.frameTimestamps;
        const frameCount = timestamps.length - 1;
        const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
        
        this.currentFPS = Math.round((frameCount / timeSpan) * 1000);
        
        // Update statistics
        this.stats.averageFPS = Math.round(
            (this.stats.averageFPS * (this.stats.totalFrames - 1) + this.currentFPS) / this.stats.totalFrames
        );
        this.stats.worstFPS = Math.min(this.stats.worstFPS, this.currentFPS);
        this.stats.bestFPS = Math.max(this.stats.bestFPS, this.currentFPS);

        // Notify FPS change listeners
        this.emit('fpsChange', {
            current: this.currentFPS,
            average: this.stats.averageFPS,
            worst: this.stats.worstFPS,
            best: this.stats.bestFPS
        });
    }

    /**
     * Check for stutter based on FPS thresholds
     */
    checkForStutter() {
        const isBadFrame = this.currentFPS < this.options.targetFPS;
        const isCriticalFrame = this.currentFPS < this.options.minFPS;

        if (isBadFrame) {
            this.consecutiveBadFrames++;
        } else {
            // Reset counter if we have a good frame
            if (this.consecutiveBadFrames > 0) {
                this.consecutiveBadFrames = 0;
                this.emit('smooth', {
                    fps: this.currentFPS,
                    memoryPressure: this.memoryPressure
                });
            }
        }

        // Trigger stutter event if we have too many consecutive bad frames
        if (this.consecutiveBadFrames >= this.options.stutterThreshold || isCriticalFrame) {
            this.stats.stutterEvents++;
            this.emit('stutter', {
                fps: this.currentFPS,
                consecutiveBadFrames: this.consecutiveBadFrames,
                memoryPressure: this.memoryPressure,
                severity: isCriticalFrame ? 'critical' : 'moderate'
            });
            
            // Reset to avoid spam
            this.consecutiveBadFrames = 0;
        }
    }

    /**
     * Check memory pressure using Performance API
     */
    checkMemoryPressure(timestamp) {
        if (timestamp - this.lastMemoryCheck < this.options.memoryCheckInterval) {
            return;
        }

        this.lastMemoryCheck = timestamp;

        // Check if performance.memory is available (Chrome/Edge)
        if ('memory' in performance) {
            const memory = performance.memory;
            const usedMB = memory.usedJSHeapSize / 1024 / 1024;
            const totalMB = memory.totalJSHeapSize / 1024 / 1024;
            const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
            
            const memoryUsagePercent = (totalMB / limitMB) * 100;
            
            if (memoryUsagePercent > 80) {
                this.memoryPressure = 'critical';
            } else if (memoryUsagePercent > 60) {
                this.memoryPressure = 'high';
            } else {
                this.memoryPressure = 'normal';
            }

            console.log(`💾 Memory: ${usedMB.toFixed(1)}MB used, ${totalMB.toFixed(1)}MB total (${memoryUsagePercent.toFixed(1)}%) - ${this.memoryPressure}`);
        }
    }

    /**
     * Start monitoring memory usage
     */
    startMemoryMonitoring() {
        // Additional memory monitoring for devices that support it
        if ('deviceMemory' in navigator) {
            console.log(`📱 Device memory: ${navigator.deviceMemory}GB`);
            
            // Adjust thresholds for low-memory devices
            if (navigator.deviceMemory <= 2) {
                this.options.targetFPS = Math.min(this.options.targetFPS, 24);
                this.options.minFPS = Math.min(this.options.minFPS, 15);
                console.log('⚡ Low-memory device detected, adjusted FPS thresholds');
            }
        }

        // Check for hardware concurrency (CPU cores)
        if ('hardwareConcurrency' in navigator) {
            console.log(`🔧 CPU cores: ${navigator.hardwareConcurrency}`);
            
            // Adjust for single-core or dual-core devices
            if (navigator.hardwareConcurrency <= 2) {
                this.options.targetFPS = Math.min(this.options.targetFPS, 20);
                console.log('🐌 Low-power CPU detected, adjusted FPS targets');
            }
        }
    }

    /**
     * Get current performance metrics
     */
    getMetrics() {
        return {
            currentFPS: this.currentFPS,
            averageFPS: this.stats.averageFPS,
            worstFPS: this.stats.worstFPS,
            bestFPS: this.stats.bestFPS,
            memoryPressure: this.memoryPressure,
            stutterEvents: this.stats.stutterEvents,
            totalFrames: this.stats.totalFrames,
            isStuttering: this.consecutiveBadFrames > 0
        };
    }

    /**
     * Check if performance is currently poor
     */
    isPerformancePoor() {
        return this.currentFPS < this.options.targetFPS || 
               this.memoryPressure === 'critical' ||
               this.consecutiveBadFrames > 0;
    }

    /**
     * Get performance quality level
     */
    getPerformanceLevel() {
        if (this.memoryPressure === 'critical' || this.currentFPS < this.options.minFPS) {
            return 'low';
        } else if (this.memoryPressure === 'high' || this.currentFPS < this.options.targetFPS) {
            return 'medium';
        } else {
            return 'high';
        }
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    /**
     * Emit event to listeners
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Log performance statistics
     */
    logStats() {
        console.log('📊 Performance Statistics:');
        console.log(`  Current FPS: ${this.currentFPS}`);
        console.log(`  Average FPS: ${this.stats.averageFPS}`);
        console.log(`  Worst FPS: ${this.stats.worstFPS}`);
        console.log(`  Best FPS: ${this.stats.bestFPS}`);
        console.log(`  Stutter events: ${this.stats.stutterEvents}`);
        console.log(`  Total frames: ${this.stats.totalFrames}`);
        console.log(`  Memory pressure: ${this.memoryPressure}`);
    }

    /**
     * Reset statistics
     */
    reset() {
        this.stats = {
            averageFPS: 0,
            worstFPS: Infinity,
            bestFPS: 0,
            stutterEvents: 0,
            totalFrames: 0
        };
        this.frameTimestamps = [];
        this.consecutiveBadFrames = 0;
        console.log('🔄 Performance statistics reset');
    }
}

// Export for use in other modules
window.PerformanceMonitor = PerformanceMonitor;
