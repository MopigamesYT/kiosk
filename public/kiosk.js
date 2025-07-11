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
        this.preloadedImages = new Set(); // Track preloaded image URLs
    }
}

const state = new KioskState();

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

// Image Preloading Helper
async function preloadImages(slides, options = {}) {
    const { maxConcurrency = 3, timeout = 10000, globalSettings } = options;
    
    // Extract unique image URLs from slides that aren't already preloaded
    const slideImageUrls = slides
        .filter(slide => slide.image && slide.visibility !== false)
        .map(slide => slide.image);
    
    // Add watermark image if enabled and not already preloaded
    const watermarkUrls = [];
    if (globalSettings?.watermark?.enabled && globalSettings.watermark.image) {
        watermarkUrls.push(globalSettings.watermark.image);
    }
    
    const allUrls = [...slideImageUrls, ...watermarkUrls];
    const imageUrls = [...new Set(allUrls)].filter(url => !state.preloadedImages.has(url));

    if (imageUrls.length === 0) {
        console.log('📸 No new images to preload');
        return [];
    }

    console.log(`📸 Starting preload of ${imageUrls.length} new images...`);
    
    // Show progress UI
    const loadingProgress = document.getElementById('loading-progress');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.getElementById('progress-text');
    const loadingText = document.getElementById('loading-text');
    
    loadingText.textContent = 'Loading images...';
    loadingProgress.style.display = 'block';
    progressText.textContent = `0 / ${imageUrls.length} images loaded`;
    
    let loadedCount = 0;
    
    // Update progress
    const updateProgress = () => {
        const percentage = (loadedCount / imageUrls.length) * 100;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${loadedCount} / ${imageUrls.length} images loaded`;
    };
    
    // Preload single image with timeout
    const preloadSingleImage = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const timeoutId = setTimeout(() => {
                console.warn(`⚠️ Image timeout: ${url}`);
                reject(new Error(`Timeout loading image: ${url}`));
            }, timeout);

            img.onload = () => {
                clearTimeout(timeoutId);
                loadedCount++;
                updateProgress();
                console.log(`✅ Preloaded (${loadedCount}/${imageUrls.length}): ${url}`);
                resolve(img);
            };

            img.onerror = () => {
                clearTimeout(timeoutId);
                loadedCount++;
                updateProgress();
                console.warn(`❌ Failed to load (${loadedCount}/${imageUrls.length}): ${url}`);
                reject(new Error(`Failed to load image: ${url}`));
            };

            img.src = url;
        });
    };

    // Limit concurrency to avoid overwhelming the Raspberry Pi
    const preloadWithLimit = async (urls) => {
        const results = [];
        const executing = [];

        for (const url of urls) {
            const promise = preloadSingleImage(url).catch(error => {
                console.warn(`Skipping failed image: ${url}`, error.message);
                return null; // Don't fail the whole process for one bad image
            });

            results.push(promise);

            if (urls.length >= maxConcurrency) {
                executing.push(promise);

                if (executing.length >= maxConcurrency) {
                    await Promise.race(executing);
                    executing.splice(executing.findIndex(p => p === promise), 1);
                }
            }
        }

        return Promise.all(results);
    };

    try {
        const preloadedImages = await preloadWithLimit(imageUrls);
        const successCount = preloadedImages.filter(img => img !== null).length;
        console.log(`🎉 Preloaded ${successCount}/${imageUrls.length} images successfully`);
        
        // Hide progress UI
        loadingProgress.style.display = 'none';
        loadingText.textContent = 'Starting slideshow...';
        
        return preloadedImages.filter(img => img !== null);
    } catch (error) {
        console.error('Error during image preloading:', error);
        loadingProgress.style.display = 'none';
        return [];
    }
}

// Content Loading
async function loadContent() {
    if (state.isInitialLoad) {
        showLoading();
    }

    try {
        console.log('🔄 Fetching kiosk data...');
        const response = await fetch(`kiosk.json?t=${Date.now()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        console.log('✅ Kiosk data loaded');

        // Check if we need to preload any new images
        const shouldPreload = state.isInitialLoad || hasNewImages(data.slides) || hasNewWatermark(data.globalSettings);
        
        if (shouldPreload && (data.slides?.length > 0 || data.globalSettings?.watermark?.image)) {
            const loadType = state.isInitialLoad ? 'Initial load' : 'New content detected';
            console.log(`🖼️ ${loadType} - preloading images...`);
            
            const preloadedImages = await preloadImages(data.slides || [], {
                maxConcurrency: 2, // Conservative for Raspberry Pi
                timeout: 15000,    // Longer timeout for slow connections
                globalSettings: data.globalSettings // Pass settings for watermark
            });
            
            // Track successfully preloaded images
            preloadedImages.forEach(img => {
                if (img && img.src) {
                    state.preloadedImages.add(img.src);
                }
            });
            
            console.log('🚀 All images preloaded - ready to start slideshow!');
        }

        handleContentUpdate(data);
    } catch (error) {
        console.error('Error loading kiosk data:', error);
        showNoSlidesMessage(error.message);
    } finally {
        if (state.isInitialLoad) {
            hideLoading();
            state.isInitialLoad = false;
        }
    }
}

// Helper function to check if there are new images to preload
function hasNewImages(slides) {
    if (!slides) return false;
    
    const currentImageUrls = slides
        .filter(slide => slide.image && slide.visibility !== false)
        .map(slide => slide.image);
    
    return currentImageUrls.some(url => !state.preloadedImages.has(url));
}

// Helper function to check if there's a new watermark to preload
function hasNewWatermark(globalSettings) {
    if (!globalSettings?.watermark?.enabled || !globalSettings.watermark.image) {
        return false;
    }
    
    return !state.preloadedImages.has(globalSettings.watermark.image);
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
    
    applyTheme(state.globalSettings.theme, state.previousTheme, elements.themeContainer);
    state.previousTheme = state.globalSettings.theme;
    updateWatermark();
    updateSlides(data.slides || []);
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

    const content = [
        `<h2 class="slide-title" style="font-size: ${DEFAULTS.TITLE_SIZE}px">${slide.text}</h2>`,
        slide.description ? `<p class="slide-description" style="font-size: ${DEFAULTS.DESCRIPTION_SIZE}px">${slide.description}</p>` : '',
        slide.image ? `<img class="slide-image" src="${slide.image}" alt="${slide.text}">` : ''
    ].join('');

    slideElement.innerHTML = content;
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
            elements.slideshow.style.backgroundColor = nextSlide.dataset.accentColor;
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
    const themeScript = document.createElement('script');
    themeScript.src = 'themes.js';
    document.head.appendChild(themeScript);

    initializeEventListeners();
    loadContent();
    setInterval(loadContent, DEFAULTS.SLIDE_CHECK_INTERVAL);
}

window.onload = init;