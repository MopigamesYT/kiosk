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
        this.preloadedImages = new Map();
        this.isPreloading = false;
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

// Content Loading
async function loadContent() {
    if (state.isInitialLoad) {
        showLoading();
    }

    try {
        const response = await fetch(`kiosk.json?t=${Date.now()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        await handleContentUpdate(data);
    } catch (error) {
        console.error('Error loading kiosk data:', error);
        showNoSlidesMessage(error.message);
        hideLoading();
    }
}

async function handleContentUpdate(data) {
    const oldFontSettings = {
        titleFontSize: state.globalSettings.titleFontSize,
        descriptionFontSize: state.globalSettings.descriptionFontSize
    };

    state.globalSettings = data.globalSettings || {};
    
    if (fontSettingsChanged(oldFontSettings)) {
        await updateSlides(data.slides || []);
    }

    DEFAULTS.TITLE_SIZE = state.globalSettings.titleFontSize || DEFAULTS.TITLE_SIZE;
    DEFAULTS.DESCRIPTION_SIZE = state.globalSettings.descriptionFontSize || DEFAULTS.DESCRIPTION_SIZE;
    
    applyTheme(state.globalSettings.theme, state.previousTheme, elements.themeContainer);
    state.previousTheme = state.globalSettings.theme;
    updateWatermark();
    await updateSlides(data.slides || []);
    
    // Only hide loading after everything is ready
    if (state.isInitialLoad) {
        hideLoading();
        state.isInitialLoad = false;
    }
}

// Loading state management
function showLoading() {
    elements.loading.style.display = 'flex';
    updateLoadingMessage('Loading...');
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

function updateLoadingMessage(message) {
    const loadingText = elements.loading.querySelector('p');
    if (loadingText) {
        loadingText.textContent = message;
    }
}

// Image preloading functions
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        // Check if already preloaded
        if (state.preloadedImages.has(src)) {
            resolve(state.preloadedImages.get(src));
            return;
        }

        const img = new Image();
        img.onload = () => {
            state.preloadedImages.set(src, img);
            resolve(img);
        };
        img.onerror = () => {
            console.warn(`Failed to preload image: ${src}`);
            // Don't reject, just resolve with null so slideshow continues
            resolve(null);
        };
        img.src = src;
    });
}

async function preloadAllImages(slides) {
    if (state.isPreloading) return;
    state.isPreloading = true;

    const imageUrls = [];
    
    // Collect all image URLs from slides
    slides.forEach(slide => {
        if (slide.image) {
            imageUrls.push(slide.image);
        }
    });

    // Add watermark image if present
    const watermarkSettings = state.globalSettings.watermark;
    if (watermarkSettings?.enabled && watermarkSettings.image) {
        imageUrls.push(watermarkSettings.image);
    }

    if (imageUrls.length === 0) {
        state.isPreloading = false;
        return;
    }

    updateLoadingMessage(`Preloading images (0/${imageUrls.length})...`);

    // Preload images with progress updates
    let loadedCount = 0;
    const preloadPromises = imageUrls.map(async (url) => {
        const result = await preloadImage(url);
        loadedCount++;
        updateLoadingMessage(`Preloading images (${loadedCount}/${imageUrls.length})...`);
        return result;
    });

    try {
        await Promise.all(preloadPromises);
        updateLoadingMessage('Images loaded, starting slideshow...');
        // Small delay to show completion message
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
        console.error('Error preloading images:', error);
    } finally {
        state.isPreloading = false;
    }
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
        // Use preloaded image if available
        const preloadedImg = state.preloadedImages.get(watermarkSettings.image);
        if (preloadedImg) {
            const imgElement = preloadedImg.cloneNode(true);
            imgElement.alt = 'Watermark';
            imgElement.style.width = `${watermarkSettings.size}px`;
            imgElement.style.opacity = watermarkSettings.opacity / 100;
            watermark.innerHTML = '';
            watermark.appendChild(imgElement);
        } else {
            // Fallback to regular img tag
            watermark.innerHTML = `<img src="${watermarkSettings.image}" alt="Watermark">`;
            const img = watermark.querySelector('img');
            if (img) {
                img.style.width = `${watermarkSettings.size}px`;
                img.style.opacity = watermarkSettings.opacity / 100;
            }
        }
        
        watermark.style.display = 'block';
        watermark.className = `watermark ${watermarkSettings.position}`;
    } else {
        watermark.style.display = 'none';
    }
}

// Slideshow Management
async function updateSlides(data) {
    const visibleSlides = data.filter(item => item.visibility !== false);

    if (visibleSlides.length === 0) {
        showNoSlidesMessage('No visible slides available');
        return;
    }

    const newSlides = visibleSlides.map(formatSlideData);
    updateFontSizes();

    if (JSON.stringify(newSlides) !== JSON.stringify(state.slides)) {
        state.slides = newSlides;
        
        // Preload images before showing slides
        if (state.isInitialLoad) {
            await preloadAllImages(state.slides);
        }
        
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
        slide.description ? `<p class="slide-description" style="font-size: ${DEFAULTS.DESCRIPTION_SIZE}px">${slide.description}</p>` : ''
    ];

    // Use preloaded image if available, otherwise create normal img tag
    if (slide.image) {
        const preloadedImg = state.preloadedImages.get(slide.image);
        if (preloadedImg) {
            // Clone the preloaded image for better performance
            const imgElement = preloadedImg.cloneNode(true);
            imgElement.className = 'slide-image';
            imgElement.alt = slide.text;
            content.push(imgElement.outerHTML);
        } else {
            // Fallback to regular img tag
            content.push(`<img class="slide-image" src="${slide.image}" alt="${slide.text}">`);
        }
    }

    slideElement.innerHTML = content.join('');
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