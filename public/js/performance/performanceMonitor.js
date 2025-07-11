// performanceMonitor.js
// Detect rendering performance and emit low/high FPS events
export class PerformanceMonitor {
    constructor({ fpsThreshold = 24, sampleInterval = 1000 } = {}) {
        this.fpsThreshold = fpsThreshold;
        this.sampleInterval = sampleInterval;
        this.frameTimes = [];
        this.lowFpsListeners = [];
        this.highFpsListeners = [];
        this.monitoring = false;
        this.prevTime = 0;
    }
    start() {
        if (this.monitoring) return;
        this.monitoring = true;
        this.prevTime = performance.now();
        this.frameTimes = [];
        this._tick();
        this._intervalId = setInterval(() => this._checkFPS(), this.sampleInterval);
    }
    stop() {
        this.monitoring = false;
        clearInterval(this._intervalId);
    }
    onLowFPS(callback) {
        this.lowFpsListeners.push(callback);
    }
    onHighFPS(callback) {
        this.highFpsListeners.push(callback);
    }
    _tick() {
        if (!this.monitoring) return;
        requestAnimationFrame((time) => {
            const delta = time - this.prevTime;
            this.prevTime = time;
            this.frameTimes.push(delta);
            this._tick();
        });
    }
    _checkFPS() {
        if (this.frameTimes.length === 0) return;
        const sum = this.frameTimes.reduce((a, b) => a + b, 0);
        const avg = sum / this.frameTimes.length;
        const fps = 1000 / avg;
        this.frameTimes = [];
        if (fps < this.fpsThreshold) {
            this.lowFpsListeners.forEach(cb => cb(fps));
        } else {
            this.highFpsListeners.forEach(cb => cb(fps));
        }
    }
}