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

// Performance monitoring and image quality management
let performanceMonitor = null;
let imageQualityManager = null;
let performanceScriptsLoaded = false;
let performanceIndicator = null;

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

// Performance monitoring initialization
function initializePerformanceMonitoring() {
    return new Promise((resolve) => {
        if (performanceScriptsLoaded) {
            resolve();
            return;
        }

        // Load performance monitoring scripts
        const scripts = [
            'js/performance/performanceMonitor.js',
            'js/performance/imageQualityManager.js'
        ];

        let loadedCount = 0;

        scripts.forEach(scriptSrc => {
            const script = document.createElement('script');
            script.src = scriptSrc;
            
            script.onload = () => {
                loadedCount++;
                if (loadedCount === scripts.length) {
                    // Add a small delay to ensure classes are fully loaded
                    setTimeout(() => {
                        try {
                            // Check if classes are available
                            if (typeof window.PerformanceMonitor === 'undefined') {
                                console.error('PerformanceMonitor class not available');
                                resolve();
                                return;
                            }
                            
                            if (typeof window.ImageQualityManager === 'undefined') {
                                console.error('ImageQualityManager class not available');
                                resolve();
                                return;
                            }
                            
                            // Initialize performance monitoring
                            performanceMonitor = new PerformanceMonitor({
                                targetFPS: 60,
                                minAcceptableFPS: 30,
                                stutterThreshold: 3,
                                recoveryThreshold: 20,
                                onPerformanceChange: (event) => {
                                    console.log(`📊 Performance level: ${event.currentLevel} (${event.fps.toFixed(1)} FPS)`);
                                    updatePerformanceIndicator(event.currentLevel, event.fps);
                                },
                                onStutterDetected: (event) => {
                                    console.warn(`⚠️ Performance stutter detected! FPS: ${event.fps.toFixed(1)}`);
                                    showPerformanceIndicator();
                                },
                                onPerformanceRecovered: (event) => {
                                    console.log(`✅ Performance recovered! FPS: ${event.fps.toFixed(1)}`);
                                    updatePerformanceIndicator('high', event.fps);
                                }
                            });

                            // Initialize image quality manager
                            imageQualityManager = new ImageQualityManager({
                                maxFileSize: 300 * 1024, // 300KB
                                maxResolution: { width: 1920, height: 1080 },
                                minResolution: { width: 854, height: 480 },
                                minFileSize: 100 * 1024 // 100KB
                            });

                            // Connect them together
                            imageQualityManager.init(performanceMonitor);
                            
                            // Start monitoring
                            performanceMonitor.start();
                            
                            // Create performance indicator
                            createPerformanceIndicator();
                            
                            performanceScriptsLoaded = true;
                            console.log('🚀 Performance monitoring system initialized');
                            resolve();
                            
                        } catch (error) {
                            console.error('Error initializing performance monitoring:', error);
                            console.warn('⚠️ Performance monitoring unavailable, continuing without optimization');
                            resolve();
                        }
                    }, 100); // 100ms delay to ensure classes are loaded
                }
            };
            
            script.onerror = () => {
                console.warn(`Failed to load performance script: ${scriptSrc}`);
                loadedCount++;
                if (loadedCount === scripts.length) {
                    console.warn('⚠️ Performance monitoring unavailable, continuing without optimization');
                    resolve();
                }
            };
            
            document.head.appendChild(script);
        });
    });
}

// Performance indicator functions
function createPerformanceIndicator() {
    performanceIndicator = document.createElement('div');
    performanceIndicator.className = 'performance-indicator';
    performanceIndicator.textContent = 'Performance: Good';
    document.body.appendChild(performanceIndicator);
    
    // Show indicator briefly on startup, then hide
    setTimeout(() => {
        showPerformanceIndicator();
        setTimeout(hidePerformanceIndicator, 3000);
    }, 1000);
}

function updatePerformanceIndicator(level, fps) {
    if (!performanceIndicator) return;
    
    performanceIndicator.className = `performance-indicator ${level}`;
    performanceIndicator.textContent = `Performance: ${level.toUpperCase()} (${fps.toFixed(1)} FPS)`;
}

function showPerformanceIndicator() {
    if (!performanceIndicator) return;
    performanceIndicator.classList.add('visible');
}

function hidePerformanceIndicator() {
    if (!performanceIndicator) return;
    performanceIndicator.classList.remove('visible');
}

// Toggle performance indicator visibility (for debugging)
function togglePerformanceIndicator() {
    if (!performanceIndicator) return;
    
    if (performanceIndicator.classList.contains('visible')) {
        hidePerformanceIndicator();
    } else {
        showPerformanceIndicator();
    }
}

// DOM Elements
const elements = {
    cursor: createCursor(),
    adminButton: document.getElementById('admin-button'),
    slideshow: document.getElementById('slideshow'),
    loading: document.getElementById('loading'),
    themeContainer: document.getElementById('theme-container')
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
        zIndex: '9999'
    });
    document.body.appendChild(cursor);
    return cursor;
}

// Event Listeners
function initializeEventListeners() {
    elements.adminButton.style.display = 'none';
    elements.adminButton.addEventListener('click', () => window.location.href = '/admin');
    
    document.addEventListener('mousemove', handleMouseMove);
    
    // Add keyboard shortcut for performance indicator (P key)
    document.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'p' && performanceIndicator) {
            togglePerformanceIndicator();
        }
    });
    
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
        document.body.appendChild(watermark);
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

    // Create title and description
    const titleHtml = `<h2 class="slide-title" style="font-size: ${DEFAULTS.TITLE_SIZE}px">${slide.text}</h2>`;
    const descriptionHtml = slide.description ? 
        `<p class="slide-description" style="font-size: ${DEFAULTS.DESCRIPTION_SIZE}px">${slide.description}</p>` : '';

    // Handle images with performance optimization
    if (slide.image && imageQualityManager && performanceScriptsLoaded) {
        // Create optimized image asynchronously
        createOptimizedImage(slide.image, slide.text).then(imageElement => {
            const existingImage = slideElement.querySelector('.slide-image-container');
            if (existingImage) {
                existingImage.replaceWith(imageElement);
            } else {
                slideElement.appendChild(imageElement);
            }
        }).catch(error => {
            console.error('Error creating optimized image:', error);
            // Fallback to basic image
            const fallbackImg = document.createElement('img');
            fallbackImg.className = 'slide-image';
            fallbackImg.src = slide.image;
            fallbackImg.alt = slide.text;
            fallbackImg.loading = 'lazy';
            
            const container = document.createElement('div');
            container.className = 'slide-image-container';
            container.appendChild(fallbackImg);
            
            // Replace loading container
            const existingContainer = slideElement.querySelector('.slide-image-container.loading');
            if (existingContainer) {
                existingContainer.replaceWith(container);
            } else {
                slideElement.appendChild(container);
            }
        });

        // Set initial content without image (will be added asynchronously)
        slideElement.innerHTML = titleHtml + descriptionHtml + '<div class="slide-image-container loading">Loading image...</div>';
    } else if (slide.image) {
        // Fallback for when performance monitoring is not available or failed
        console.log('🔄 Using basic image loading (performance monitoring unavailable)');
        const imageHtml = `<img class="slide-image" src="${slide.image}" alt="${slide.text}" loading="lazy">`;
        slideElement.innerHTML = titleHtml + descriptionHtml + imageHtml;
        slideElement.innerHTML = titleHtml + descriptionHtml + imageHtml;
    } else {
        // No image
        slideElement.innerHTML = titleHtml + descriptionHtml;
    }

    return slideElement;
}

// Create optimized image element
async function createOptimizedImage(imageSrc, altText) {
    try {
        // Temporarily increase monitoring sensitivity during image loading
        if (performanceMonitor) {
            performanceMonitor.increaseSensitivity();
        }

        // Get optimal image source based on current performance
        const optimalSrc = await imageQualityManager.getOptimalImageSrc(imageSrc);
        
        // Create container for the image
        const container = document.createElement('div');
        container.className = 'slide-image-container';
        
        // Preload the image
        const preloadResult = await imageQualityManager.preloadImage(optimalSrc);
        
        // Create the actual image element
        const img = document.createElement('img');
        img.className = 'slide-image';
        img.src = preloadResult.src;
        img.alt = altText;
        img.loading = 'lazy';
        
        // Add load event listener to monitor performance impact
        img.onload = () => {
            console.log(`✅ Image loaded successfully: ${img.src}`);
            container.classList.remove('loading');
            
            // Reset monitoring sensitivity after image loads
            if (performanceMonitor) {
                setTimeout(() => {
                    performanceMonitor.resetSensitivity();
                }, 1000);
            }
        };
        
        img.onerror = () => {
            console.error(`❌ Failed to load image: ${img.src}`);
            container.classList.remove('loading');
            container.classList.add('error');
            container.innerHTML = '<div class="image-error">Failed to load image</div>';
        };
        
        container.appendChild(img);
        return container;
        
    } catch (error) {
        console.error('Error creating optimized image:', error);
        
        // Reset monitoring sensitivity on error
        if (performanceMonitor) {
            performanceMonitor.resetSensitivity();
        }
        
        // Create fallback image
        const container = document.createElement('div');
        container.className = 'slide-image-container error';
        
        const img = document.createElement('img');
        img.className = 'slide-image';
        img.src = imageSrc;
        img.alt = altText;
        img.loading = 'lazy';
        
        container.appendChild(img);
        return container;
    }
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
    console.log('🚀 Initializing Kiosk System...');
    
    // Initialize performance monitoring first
    initializePerformanceMonitoring().then(() => {
        // Then load themes
        const themeScript = document.createElement('script');
        themeScript.src = 'themes.js';
        
        // Create themes promise
        themesLoadedPromise = createThemesPromise();
        
        // Wait for themes.js to load before starting
        themeScript.onload = () => {
            console.log('🎨 Themes loaded successfully');
            startKioskApplication();
        };
        
        // Fallback in case themes.js fails to load
        themeScript.onerror = () => {
            console.warn('⚠️ Failed to load themes.js, continuing without themes');
            startKioskApplication();
        };
        
        document.head.appendChild(themeScript);
    });
}

// Start the main kiosk application
function startKioskApplication() {
    initializeEventListeners();
    
    // Load initial content
    loadContent();
    
    // Set up periodic content updates
    setInterval(loadContent, DEFAULTS.SLIDE_CHECK_INTERVAL);
    
    console.log('✨ Kiosk system fully initialized!');
}

window.onload = init;