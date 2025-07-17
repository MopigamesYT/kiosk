// Import performance and image quality modules
import { PerformanceMonitor } from './js/performance/performanceMonitor.js';
import { ImageQualityManager } from './js/managers/imageQualityManager.js';

// Top-level instances
let perfMonitor, imgQualityManager;
// Generate simple image variants: original and a lower-resolution fallback
function generateVariants(url) {
    // No longer needed - we'll generate compressed versions dynamically
    return url;
}
// Update image sources based on performance state
async function updateImageQuality(isLow) {
    const imgs = elements.slideshow.getElementsByClassName('slide-image');
    const promises = Array.from(imgs).map(async (img) => {
        if (!img._originalUrl) {
            img._originalUrl = img.src; // Store original URL
        }
        
        // Force low quality if global setting is enabled or performance is low
        const performance = state.globalSettings.performance || {};
        let shouldUseLowQuality = isLow;
        
        // If we have new performance settings, use them
        if (state.globalSettings.performance) {
            shouldUseLowQuality = shouldUseLowQuality || performance.forceLowQualityImages;
        } else {
            // Fallback to legacy mode only if no new performance settings
            shouldUseLowQuality = shouldUseLowQuality || state.globalSettings.lowPerformanceMode;
        }
        
        const newSrc = await imgQualityManager.getImageUrl(img._originalUrl, shouldUseLowQuality);
        if (img.src !== newSrc) {
            img.src = newSrc;
        }
    });
    
    await Promise.all(promises);
}

// Apply individual performance settings
function applyPerformanceSettings() {
    const container = document.getElementById('container');
    const performance = state.globalSettings.performance || {};
    
    // Remove all performance classes first
    container.classList.remove(
        'perf-no-animations',
        'perf-fast-transitions', 
        'perf-no-image-effects',
        'perf-no-themes',
        'perf-no-cursor-trails',
        'low-performance'
    );
    
    // Hide FPS counter by default
    if (elements.fpsCounter) {
        elements.fpsCounter.style.display = 'none';
    }

    // If we have new performance settings, use them (ignore legacy mode)
    if (state.globalSettings.performance) {
        // Apply classes based on individual settings
        if (performance.disableAnimations) {
            container.classList.add('perf-no-animations');
        }
        
        if (performance.fastTransitions) {
            container.classList.add('perf-fast-transitions');
        }
        
        if (performance.disableImageEffects) {
            container.classList.add('perf-no-image-effects');
        }
        
        if (performance.disableThemes) {
            container.classList.add('perf-no-themes');
        }
        
        if (performance.disableCursorTrails) {
            container.classList.add('perf-no-cursor-trails');
        }
        if (performance.fastTransitions) container.classList.add('perf-fast-transitions');
        
        // Show/hide FPS counter
        if (performance.showFpsCounter && elements.fpsCounter) {
            elements.fpsCounter.style.display = 'block';
        }

    } else {
        // Legacy low performance mode
        const legacyMode = state.globalSettings.lowPerformanceMode;
        if (legacyMode) {
            container.classList.add('low-performance');
        }
    }
}
// Constants and state management
const DEFAULTS = {
    TITLE_SIZE: 48,
    DESCRIPTION_SIZE: 24,
    SLIDE_CHECK_INTERVAL: 2000,
    CURSOR_FADE_DELAY: 1000,
    MOUSE_ACTIVATION_DELAY: 2000,
    TRANSITION_DELAY: 1000
};

class KioskState {
    constructor() {
        this.slides = [];
        this.currentSlideIndex = 0;
        this.slideshowInterval = null;
        this.isInitialLoad = true;
        this.previousTheme = '';
        this.globalSettings = {};
        this.cursorVisible = false;
        this.mouseActive = false;
        this.cursorTimeout = null;
    }
}

const state = new KioskState();

// Theme loading promise
let themesLoadedPromise = null;

// Create a promise that resolves when themes are loaded
function createThemesPromise() {
    return new Promise((resolve) => {
        if (typeof window.applyTheme === 'function') {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (typeof window.applyTheme === 'function') {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('Themes failed to load within 5 seconds');
                resolve(); // Resolve anyway to not block the app
            }, 5000);
        }
    });
}

// DOM Elements
const elements = {
    cursor: null, // Will be created in init()
    adminButton: null, // Will be set in init()
    slideshow: null, // Will be set in init()
    loading: null, // Will be set in init()
    themeContainer: null, // Will be set in init()
    fpsCounter: null // Will be created in init()
};

// Initialize cursor
function createCursor() {
    const cursor = document.createElement('div');
    Object.assign(cursor.style, {
        width: '10px',
        height: '10px',
        backgroundColor: '#fff',
        borderRadius: '50%',
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: '9999',
        boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.6)'
    });
    // Append to container instead of body so it's visible in fullscreen
    document.getElementById('container').appendChild(cursor);
    return cursor;
}

/**
 * Create and style the FPS counter element
 * @returns {HTMLElement} The FPS counter element
 */
function createFpsCounter() {
    const fpsCounter = document.createElement('div');
    fpsCounter.id = 'fps-counter';
    Object.assign(fpsCounter.style, {
        position: 'fixed',
        top: '10px',
        left: '10px',
        padding: '5px 10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: '16px',
        borderRadius: '5px',
        zIndex: '10001', // Higher than cursor
        display: 'none' // Initially hidden
    });
    document.getElementById('container').appendChild(fpsCounter);
    return fpsCounter;
}

// Event Listeners
function initializeEventListeners() {
    elements.adminButton.style.display = 'none';
    elements.adminButton.addEventListener('click', () => window.location.href = '/admin');
    
    document.addEventListener('mousemove', handleMouseMove);
    
    setTimeout(() => {
        state.mouseActive = true;
    }, DEFAULTS.MOUSE_ACTIVATION_DELAY);
}

function handleMouseMove(event) {
    if (!state.mouseActive) return;

    if (!state.cursorVisible) {
        elements.cursor.style.animation = 'fadeInUp 0.5s forwards';
        elements.adminButton.style.animation = 'fadeInUp 0.5s forwards';
    }
    
    state.cursorVisible = true;
    Object.assign(elements.cursor.style, {
        left: `${event.clientX}px`,
        top: `${event.clientY}px`,
        opacity: '1'
    });

    const slidesElements = elements.slideshow.getElementsByClassName('slide');
    if (slidesElements.length > 0) {
        elements.adminButton.style.display = 'block';
        elements.adminButton.style.opacity = '1';
    }

    clearTimeout(state.cursorTimeout);
    state.cursorTimeout = setTimeout(hideCursor, DEFAULTS.CURSOR_FADE_DELAY);
}

function hideCursor() {
    elements.cursor.style.animation = 'fadeOut 0.5s forwards';
    elements.adminButton.style.animation = 'fadeOut 0.5s forwards';
    
    setTimeout(() => {
        elements.cursor.style.opacity = '0';
        state.cursorVisible = false;
        elements.cursor.style.animation = 'none';
        elements.adminButton.style.display = 'none';
    }, 500);
}

// Fullscreen handling
function toggleFullScreen(element) {
    if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// Color utilities
function hexToRgb(hex) {
    if (!hex) return null;
    
    // Remove the hash if present
    hex = hex.replace('#', '');
    
    // Parse r, g, b values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    
    return { r, g, b };
}

// Content Loading
async function loadContent() {
    if (state.isInitialLoad) {
        showLoading();
    }

    try {
        const response = await fetch(`kiosk.json?t=${Date.now()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        handleContentUpdate(data);
    } catch (error) {
        console.error('Error loading kiosk data:', error);
        showNoSlidesMessage(error.message);
    } finally {
        hideLoading();
        state.isInitialLoad = false;
    }
}

function handleContentUpdate(data) {
    const oldFontSettings = {
        titleFontSize: state.globalSettings.titleFontSize,
        descriptionFontSize: state.globalSettings.descriptionFontSize
    };

    state.globalSettings = data.globalSettings || {};
    
    // Apply performance mode styling based on individual settings
    applyPerformanceSettings();
    
    if (fontSettingsChanged(oldFontSettings)) {
        updateSlides(data.slides || []);
    }

    DEFAULTS.TITLE_SIZE = state.globalSettings.titleFontSize || DEFAULTS.TITLE_SIZE;
    DEFAULTS.DESCRIPTION_SIZE = state.globalSettings.descriptionFontSize || DEFAULTS.DESCRIPTION_SIZE;
    
    // Apply theme safely using the promise
    applyThemeSafely();
    
    updateWatermark();
    updateSlides(data.slides || []);
}

// Safe theme application function
async function applyThemeSafely() {
    try {
        await themesLoadedPromise;
        
        if (typeof window.applyTheme === 'function') {
            applyTheme(state.globalSettings.theme, state.previousTheme, elements.themeContainer);
            state.previousTheme = state.globalSettings.theme;
        } else {
            console.warn('Theme functions not available even after waiting');
            // Clear any existing theme content as fallback
            if (elements.themeContainer) {
                elements.themeContainer.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Error applying theme:', error);
    }
}

// Loading state management
function showLoading() {
    elements.loading.style.display = 'flex';
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

function fontSettingsChanged(oldSettings) {
    return oldSettings.titleFontSize !== state.globalSettings.titleFontSize ||
           oldSettings.descriptionFontSize !== state.globalSettings.descriptionFontSize;
}

// Watermark Management
function updateWatermark() {
    let watermark = document.getElementById('watermark');
    if (!watermark) {
        watermark = document.createElement('div');
        watermark.id = 'watermark';
        watermark.className = 'watermark';
        // Append to container instead of body so it's visible in fullscreen
        document.getElementById('container').appendChild(watermark);
    }

    const watermarkSettings = state.globalSettings.watermark;
    if (watermarkSettings?.enabled && watermarkSettings.image) {
        watermark.innerHTML = `<img src="${watermarkSettings.image}" alt="Watermark">`;
        watermark.style.display = 'block';
        watermark.className = `watermark ${watermarkSettings.position}`;
        
        const img = watermark.querySelector('img');
        if (img) {
            img.style.width = `${watermarkSettings.size}px`;
            img.style.opacity = watermarkSettings.opacity / 100;
        }
    } else {
        watermark.style.display = 'none';
    }
}

// Slideshow Management
function updateSlides(data) {
    const visibleSlides = data.filter(item => item.visibility !== false);

    if (visibleSlides.length === 0) {
        showNoSlidesMessage('No visible slides available');
        return;
    }

    const newSlides = visibleSlides.map(formatSlideData);
    updateFontSizes();

    if (JSON.stringify(newSlides) !== JSON.stringify(state.slides)) {
        state.slides = newSlides;
        rebuildSlideshow();
    }
}

function formatSlideData(item) {
    return {
        text: item.text,
        description: item.description,
        image: item.image,
        accentColor: item.accentColor,
        time: item.time || 8000
    };
}

function updateFontSizes() {
    const slideElements = document.getElementsByClassName('slide');
    Array.from(slideElements).forEach(updateSlideFontSizes);
}

function updateSlideFontSizes(slideElement) {
    const titleElement = slideElement.querySelector('.slide-title');
    const descriptionElement = slideElement.querySelector('.slide-description');
    
    if (titleElement) {
        titleElement.style.fontSize = `${state.globalSettings.titleFontSize || DEFAULTS.TITLE_SIZE}px`;
    }
    if (descriptionElement) {
        descriptionElement.style.fontSize = `${state.globalSettings.descriptionFontSize || DEFAULTS.DESCRIPTION_SIZE}px`;
    }
}

function rebuildSlideshow() {
    elements.slideshow.innerHTML = '';
    state.slides.forEach((slide, index) => {
        elements.slideshow.appendChild(createSlideElement(slide, index));
    });
    state.currentSlideIndex = 0;
    startSlideshow();
}

function createSlideElement(slide, index) {
    const slideElement = document.createElement('div');
    slideElement.className = 'slide';
    slideElement.style.opacity = index === state.currentSlideIndex ? '1' : '0';
    slideElement.dataset.accentColor = slide.accentColor;

    const content = [
        `<h2 class="slide-title" style="font-size: ${DEFAULTS.TITLE_SIZE}px">${slide.text}</h2>`,
        slide.description ? `<p class="slide-description" style="font-size: ${DEFAULTS.DESCRIPTION_SIZE}px">${slide.description}</p>` : '',
        slide.image ? `<img class="slide-image" src="${slide.image}" alt="${slide.text}">` : ''
    ].join('');

    slideElement.innerHTML = content;
    
    // Store original URL and apply performance mode if needed
    const imgEl = slideElement.querySelector('.slide-image');
    if (imgEl) {
        imgEl._originalUrl = slide.image;
        
        // Apply low quality images if enabled in settings
        const performance = state.globalSettings.performance || {};
        let shouldUseLowQuality = false;
        
        // If we have new performance settings, use them
        if (state.globalSettings.performance) {
            shouldUseLowQuality = performance.forceLowQualityImages;
        } else {
            // Fallback to legacy mode only if no new performance settings
            shouldUseLowQuality = state.globalSettings.lowPerformanceMode;
        }
        
        console.log(`🎯 Slide ${slide.text}: shouldUseLowQuality = ${shouldUseLowQuality}`, performance);
        
        if (shouldUseLowQuality) {
            console.log(`🔄 Processing image for slide: ${slide.text}`);
            imgQualityManager.getImageUrl(slide.image, true).then(lowQualityUrl => {
                console.log(`✨ Applied low quality to slide ${slide.text}:`, lowQualityUrl.substring(0, 50) + '...');
                if (imgEl.src !== lowQualityUrl) {
                    imgEl.src = lowQualityUrl;
                }
            }).catch(error => {
                console.error(`❌ Failed to process image for slide ${slide.text}:`, error);
            });
        } else {
            console.log(`✅ Using original quality for slide: ${slide.text}`);
        }
    }
    
    return slideElement;
}

function showNoSlidesMessage(errorMessage) {
    elements.slideshow.innerHTML = `
        <div class="no-slides-message">
            <h1>No slides available</h1>
            <p>Error: ${errorMessage}</p>
            <button onclick="goToAdminPanel()">Go to admin panel</button>
        </div>
    `;
}

function goToAdminPanel() {
    window.location.href = '/admin';
}

// Slide Navigation
function showSlide(index) {
    const slidesElements = elements.slideshow.getElementsByClassName('slide');
    const currentSlide = slidesElements[state.currentSlideIndex];
    const nextSlide = slidesElements[index];

    currentSlide.style.opacity = '0';

    setTimeout(() => {
        Array.from(slidesElements).forEach(slide => slide.style.display = 'none');
        
        nextSlide.style.display = 'flex';
        nextSlide.style.opacity = '0';
        
        requestAnimationFrame(() => {
            nextSlide.style.opacity = '1';
            
            // Check if current theme has background elements
            const currentTheme = state.globalSettings.theme;
            const hasThemeBackground = typeof window.themeHasBackground === 'function' && 
                                     window.themeHasBackground(currentTheme);
            
            // Themes known to have backgrounds (fallback if function not available)
            const themesWithBackgrounds = ['space', 'ocean', 'neon', 'forest', 'cyberpunk', 'retro', 'galaxy', 'desert', 'summer'];
            const hasBgFallback = themesWithBackgrounds.includes(currentTheme);
            
            if (hasThemeBackground || hasBgFallback) {
                // Use semi-transparent overlay instead of solid background
                const accentColor = nextSlide.dataset.accentColor;
                const rgb = hexToRgb(accentColor);
                if (rgb) {
                    elements.slideshow.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
                } else {
                    elements.slideshow.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                }
            } else {
                // Use solid background for themes without backgrounds
                elements.slideshow.style.backgroundColor = nextSlide.dataset.accentColor;
            }
        });
        
        state.currentSlideIndex = index;
    }, DEFAULTS.TRANSITION_DELAY);
}

function startSlideshow() {
    clearInterval(state.slideshowInterval);

    const nextSlide = () => {
        const nextIndex = (state.currentSlideIndex + 1) % state.slides.length;
        showSlide(nextIndex);
    };

    showSlide(state.currentSlideIndex);
    state.slideshowInterval = setInterval(nextSlide, state.slides[state.currentSlideIndex].time);
}

// CSS Animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(styleSheet);

// Initialization
function init() {
    // DOM element references
    elements.adminButton = document.getElementById('admin-button');
    elements.slideshow = document.getElementById('slideshow');
    elements.loading = document.getElementById('loading');
    elements.themeContainer = document.getElementById('theme-container');
    elements.cursor = createCursor();
    elements.fpsCounter = createFpsCounter();

    // Initialize performance monitoring
    perfMonitor = new PerformanceMonitor();
    perfMonitor.onLowFPS(updateFpsDisplay);
    perfMonitor.onHighFPS(updateFpsDisplay);
    perfMonitor.start();

    // Initialize image quality manager
    imgQualityManager = new ImageQualityManager();

    // Set up event listeners
    initializeEventListeners();

    // Initial content load
    loadContent();

    // Set up periodic check for content updates
    setInterval(loadContent, DEFAULTS.SLIDE_CHECK_INTERVAL);
}

/**
 * Updates the FPS counter display
 * @param {number} fps - The current frames per second
 */
function updateFpsDisplay(fps) {
    if (elements.fpsCounter) {
        elements.fpsCounter.textContent = `FPS: ${Math.round(fps)}`;
    }
}

// Global debugging helper for console
window.KioskDebug = {
    getState: () => state,
    getElements: () => elements,
    getImgQualityManager: () => imgQualityManager,
    getPerfMonitor: () => perfMonitor,
    testImageQuality: async (url, forceLow = true) => {
        console.log(`Testing image quality for: ${url}`);
        console.log(`Force low quality: ${forceLow}`);
        const result = await imgQualityManager.getImageUrl(url, forceLow);
        console.log(`Result URL (first 100 chars): ${result.substring(0, 100)}...`);
        return result;
    },
    updateAllImageQuality: async (forceLow = true) => {
        console.log(`Updating all images with forceLow: ${forceLow}`);
        await updateImageQuality(forceLow);
        console.log('All images updated');
    }
};

window.onload = init;
// Expose functions for inline handlers
window.toggleFullScreen = toggleFullScreen;
window.goToAdminPanel = goToAdminPanel;