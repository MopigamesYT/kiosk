/**
 * Performance Monitor - Detects frame rate drops and rendering stutter
 * Uses requestAnimationFrame timing to monitor performance in real-time
 */

class PerformanceMonitor {
    constructor(options = {}) {
        // Configuration options
        this.targetFPS = options.targetFPS || 60;
        this.minAcceptableFPS = options.minAcceptableFPS || 30;
        this.sampleSize = options.sampleSize || 60; // Number of frames to average
        this.stutterThreshold = options.stutterThreshold || 5; // Consecutive bad frames
        this.recoveryThreshold = options.recoveryThreshold || 30; // Consecutive good frames
        
        // Internal state
        this.frameTimes = [];
        this.lastFrameTime = performance.now();
        this.consecutiveBadFrames = 0;
        this.consecutiveGoodFrames = 0;
        this.isMonitoring = false;
        this.animationId = null;
        
        // Performance state
        this.currentFPS = this.targetFPS;
        this.isPerformancePoor = false;
        this.performanceLevel = 'high'; // 'high', 'medium', 'low'
        
        // Event callbacks
        this.onPerformanceChange = options.onPerformanceChange || (() => {});
        this.onStutterDetected = options.onStutterDetected || (() => {});
        this.onPerformanceRecovered = options.onPerformanceRecovered || (() => {});
        
        // Bind methods
        this.tick = this.tick.bind(this);
    }

    /**
     * Start monitoring performance
     */
    start() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.lastFrameTime = performance.now();
        this.frameTimes = [];
        this.consecutiveBadFrames = 0;
        this.consecutiveGoodFrames = 0;
        
        console.log('🔍 Performance monitoring started');
        this.tick();
    }

    /**
     * Stop monitoring performance
     */
    stop() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        console.log('⏹️ Performance monitoring stopped');
    }

    /**
     * Main monitoring loop using requestAnimationFrame
     */
    tick() {
        if (!this.isMonitoring) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        
        // Calculate current FPS
        const currentFPS = deltaTime > 0 ? 1000 / deltaTime : this.targetFPS;
        
        // Add to rolling average
        this.frameTimes.push(currentFPS);
        if (this.frameTimes.length > this.sampleSize) {
            this.frameTimes.shift();
        }
        
        // Calculate average FPS
        this.currentFPS = this.frameTimes.reduce((sum, fps) => sum + fps, 0) / this.frameTimes.length;
        
        // Detect performance issues
        this.detectPerformanceChanges(currentFPS);
        
        this.lastFrameTime = currentTime;
        this.animationId = requestAnimationFrame(this.tick);
    }

    /**
     * Analyze frame rate and detect performance changes
     */
    detectPerformanceChanges(currentFPS) {
        const isBadFrame = currentFPS < this.minAcceptableFPS;
        
        if (isBadFrame) {
            this.consecutiveBadFrames++;
            this.consecutiveGoodFrames = 0;
            
            // Detect stutter pattern
            if (this.consecutiveBadFrames >= this.stutterThreshold && !this.isPerformancePoor) {
                this.isPerformancePoor = true;
                this.updatePerformanceLevel();
                
                console.warn(`⚠️ Performance stutter detected! FPS: ${this.currentFPS.toFixed(1)}`);
                this.onStutterDetected({
                    fps: this.currentFPS,
                    performanceLevel: this.performanceLevel,
                    consecutiveBadFrames: this.consecutiveBadFrames
                });
            }
        } else {
            this.consecutiveGoodFrames++;
            this.consecutiveBadFrames = 0;
            
            // Detect recovery
            if (this.consecutiveGoodFrames >= this.recoveryThreshold && this.isPerformancePoor) {
                this.isPerformancePoor = false;
                this.updatePerformanceLevel();
                
                console.log(`✅ Performance recovered! FPS: ${this.currentFPS.toFixed(1)}`);
                this.onPerformanceRecovered({
                    fps: this.currentFPS,
                    performanceLevel: this.performanceLevel,
                    consecutiveGoodFrames: this.consecutiveGoodFrames
                });
            }
        }
    }

    /**
     * Update performance level based on current FPS
     */
    updatePerformanceLevel() {
        const previousLevel = this.performanceLevel;
        
        if (this.currentFPS >= this.targetFPS * 0.9) {
            this.performanceLevel = 'high';
        } else if (this.currentFPS >= this.minAcceptableFPS) {
            this.performanceLevel = 'medium';
        } else {
            this.performanceLevel = 'low';
        }
        
        if (previousLevel !== this.performanceLevel) {
            console.log(`📊 Performance level changed: ${previousLevel} → ${this.performanceLevel}`);
            this.onPerformanceChange({
                previousLevel,
                currentLevel: this.performanceLevel,
                fps: this.currentFPS,
                isPerformancePoor: this.isPerformancePoor
            });
        }
    }

    /**
     * Get current performance metrics
     */
    getMetrics() {
        return {
            fps: this.currentFPS,
            targetFPS: this.targetFPS,
            minAcceptableFPS: this.minAcceptableFPS,
            performanceLevel: this.performanceLevel,
            isPerformancePoor: this.isPerformancePoor,
            consecutiveBadFrames: this.consecutiveBadFrames,
            consecutiveGoodFrames: this.consecutiveGoodFrames,
            isMonitoring: this.isMonitoring
        };
    }

    /**
     * Temporarily increase monitoring sensitivity (useful during image loading)
     */
    increaseSensitivity() {
        this.stutterThreshold = Math.max(2, this.stutterThreshold / 2);
        this.recoveryThreshold = Math.max(10, this.recoveryThreshold / 2);
        console.log('🔬 Increased performance monitoring sensitivity');
    }

    /**
     * Reset monitoring sensitivity to default values
     */
    resetSensitivity() {
        this.stutterThreshold = 5;
        this.recoveryThreshold = 30;
        console.log('🔄 Reset performance monitoring sensitivity');
    }

    /**
     * Force a performance check (useful for testing)
     */
    forceCheck() {
        if (!this.isMonitoring) return this.getMetrics();
        
        // Trigger immediate analysis
        this.detectPerformanceChanges(this.currentFPS);
        return this.getMetrics();
    }
}

// Export for use in other modules
window.PerformanceMonitor = PerformanceMonitor;
