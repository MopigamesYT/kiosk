let slides = [];
let currentSlideIndex = 0;
let slideshowInterval;
let isInitialLoad = true;

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

function loadContent() {
    const timestamp = new Date().getTime();
    if (isInitialLoad) {
        showLoading();
    }
    
    fetch(`kiosk.json?t=${timestamp}`)
        .then(response => response.json())
        .then(data => {
            updateSlides(data);
            if (isInitialLoad) {
                hideLoading();
                isInitialLoad = false;
            }
        })
        .catch(error => {
            console.error('Error loading kiosk data:', error);
            showNoSlidesMessage();
            if (isInitialLoad) {
                hideLoading();
                isInitialLoad = false;
            }
        });
}

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function updateSlides(data) {
    if (data.length === 0) {
        showNoSlidesMessage();
        return;
    }
    const visibleSlides = data.filter(item => item.visibility !== false);
    if (visibleSlides.length === 0) {
        showNoSlidesMessage();
        return;
    }
    const newSlides = visibleSlides.map(item => ({
        text: item.text,
        description: item.description,
        image: item.image,
        accentColor: item.accentColor,
        time: item.time || 8000
    }));
    if (JSON.stringify(newSlides) !== JSON.stringify(slides)) {
        if (!isInitialLoad) {
            smoothTransition(newSlides);
        } else {
            slides = newSlides;
            const slideshow = document.getElementById('slideshow');
            slideshow.innerHTML = '';
            slides.forEach((slide, index) => {
                slideshow.appendChild(createSlideElement(slide, index));
            });
            if (!slideshowInterval) {
                startSlideshow();
            }
        }
    }
}

function smoothTransition(newSlides) {
    const slideshow = document.getElementById('slideshow');
    slideshow.style.opacity = '0';
    setTimeout(() => {
        slides = newSlides;
        rebuildSlideshow();
        slideshow.style.opacity = '1';
    }, 500);
}

function rebuildSlideshow() {
    const slideshow = document.getElementById('slideshow');
    slideshow.innerHTML = '';
    slides.forEach((slide, index) => {
        slideshow.appendChild(createSlideElement(slide, index));
    });
    currentSlideIndex = 0;
    startSlideshow();
}

function createSlideElement(slide, index) {
    const slideElement = document.createElement('div');
    slideElement.className = 'slide';
    slideElement.style.opacity = index === currentSlideIndex ? '1' : '0';
    slideElement.dataset.accentColor = slide.accentColor;
   
    let content = `<h2 class="slide-title">${slide.text}</h2>`;
    if (slide.description) {
        content += `<p class="slide-description">${slide.description}</p>`;
    }
    if (slide.image) {
        content += `<img class="slide-image" src="${slide.image}" alt="${slide.text}">`;
    }
   
    slideElement.innerHTML = content;
    return slideElement;
}

function showNoSlidesMessage() {
    const slideshow = document.getElementById('slideshow');
    slideshow.innerHTML = `
        <div class="no-slides-message">
            <h1>Aucune slide!</h1>
            <button onclick="goToAdminPanel()">Aller au panel admin</button>
        </div>
    `;
}

function goToAdminPanel() {
    window.location.href = '/admin';
}

function showSlide(index) {
    const slideshow = document.getElementById('slideshow');
    const slides = slideshow.getElementsByClassName('slide');
    const currentSlide = slides[currentSlideIndex];
    const nextSlide = slides[index];

    // Fade out current slide
    currentSlide.style.opacity = '0';
    
    // Wait for fade out to complete before showing next slide
    setTimeout(() => {
        // Hide all slides
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = 'none';
            const elements = slides[i].querySelectorAll('.slide-title, .slide-description, .slide-image');
            elements.forEach(el => {
                el.style.animation = 'none';
                el.offsetHeight; // Trigger reflow
                el.style.animation = null;
            });
        }

        // Show and fade in next slide
        nextSlide.style.display = 'flex';
        nextSlide.style.opacity = '0';
        setTimeout(() => {
            nextSlide.style.opacity = '1';
            const nextSlideElements = nextSlide.querySelectorAll('.slide-title, .slide-description, .slide-image');
            nextSlideElements.forEach(el => {
                el.style.animation = 'none';
                el.offsetHeight; // Trigger reflow
                el.style.animation = null;
            });
        }, 50); // Small delay to ensure display change has taken effect

        // Update background color
        slideshow.style.backgroundColor = nextSlide.dataset.accentColor;

        // Update current slide index
        currentSlideIndex = index;
    }, 1000); // This should match the transition duration in CSS
}

function startSlideshow() {
    clearInterval(slideshowInterval);
   
    function nextSlide() {
        const nextIndex = (currentSlideIndex + 1) % slides.length;
        showSlide(nextIndex);
    }

    // Show the first slide immediately
    showSlide(currentSlideIndex);

    // Set up the interval for subsequent slides
    slideshowInterval = setInterval(nextSlide, slides[currentSlideIndex].time);
}

function createSlideElement(slide, index) {
    const slideElement = document.createElement('div');
    slideElement.className = 'slide';
    slideElement.style.opacity = index === currentSlideIndex ? '1' : '0';
    slideElement.dataset.accentColor = slide.accentColor;
   
    let content = `<h2 class="slide-title">${slide.text}</h2>`;
    if (slide.description) {
        content += `<p class="slide-description">${slide.description}</p>`;
    }
    if (slide.image) {
        content += `<img class="slide-image" src="${slide.image}" alt="${slide.text}">`;
    }
   
    slideElement.innerHTML = content;
    return slideElement;
}

function init() {
    loadContent();
    setInterval(loadContent, 2000);
}

window.onload = init;