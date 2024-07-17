let slides = [];
let currentSlideIndex = 0;
let slideshowInterval;
let isInitialLoad = true;
let previousTheme = '';


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
    if (isInitialLoad) {
        showLoading(); // Show loading screen only on initial load
      }
    const timestamp = new Date().getTime();
    fetch(`kiosk.json?t=${timestamp}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            globalSettings = data.globalSettings || {};
            updateTheme();
            updateSlides(data.slides || []);
            hideLoading(); // Hide loading screen after content is loaded
            isInitialLoad = false; // Set flag to false after initial load
        })
        .catch(error => {
            console.error('Error loading kiosk data:', error);
            showNoSlidesMessage(error.message);
            hideLoading(); // Hide loading screen even if there's an error
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
        showNoSlidesMessage('No slides available');
        return;
    }

    // Filter out slides with visibility set to false
    const visibleSlides = data.filter(item => item.visibility !== false);

    // Check if there are no visible slides
    if (visibleSlides.length === 0) {
        showNoSlidesMessage('No visible slides available');
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
        slides = newSlides;
        const slideshow = document.getElementById('slideshow');
        slideshow.innerHTML = '';
        slides.forEach((slide, index) => {
            slideshow.appendChild(createSlideElement(slide, index));
        });
        
        if (isInitialLoad) {
            startSlideshow();
            isInitialLoad = false;
        }
    }
}

function updateTheme() {
    if (globalSettings.theme === previousTheme) {
        return; // Exit if the theme hasn't changed
    }

    previousTheme = globalSettings.theme; // Update the previous theme
    const themeContainer = document.getElementById('theme-container');
    themeContainer.innerHTML = '';

    if (globalSettings.theme === 'christmas') {
        themeContainer.innerHTML = `
        <div class="snowflakescript">
            <style>
                /* customizable snowflake styling */
                .snowflake {
                  color: #fff;
                  font-size: 1em;
                  font-family: Arial, sans-serif;
                  text-shadow: 0 0 5px #000;
                }
                
                @-webkit-keyframes snowflakes-fall{0%{top:-10%}100%{top:100%}}@-webkit-keyframes snowflakes-shake{0%,100%{-webkit-transform:translateX(0);transform:translateX(0)}50%{-webkit-transform:translateX(80px);transform:translateX(80px)}}@keyframes snowflakes-fall{0%{top:-10%}100%{top:100%}}@keyframes snowflakes-shake{0%,100%{transform:translateX(0)}50%{transform:translateX(80px)}}.snowflake{position:fixed;top:-10%;z-index:9999;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;cursor:default;-webkit-animation-name:snowflakes-fall,snowflakes-shake;-webkit-animation-duration:10s,3s;-webkit-animation-timing-function:linear,ease-in-out;-webkit-animation-iteration-count:infinite,infinite;-webkit-animation-play-state:running,running;animation-name:snowflakes-fall,snowflakes-shake;animation-duration:10s,3s;animation-timing-function:linear,ease-in-out;animation-iteration-count:infinite,infinite;animation-play-state:running,running}.snowflake:nth-of-type(0){left:1%;-webkit-animation-delay:0s,0s;animation-delay:0s,0s}.snowflake:nth-of-type(1){left:10%;-webkit-animation-delay:1s,1s;animation-delay:1s,1s}.snowflake:nth-of-type(2){left:20%;-webkit-animation-delay:6s,.5s;animation-delay:6s,.5s}.snowflake:nth-of-type(3){left:30%;-webkit-animation-delay:4s,2s;animation-delay:4s,2s}.snowflake:nth-of-type(4){left:40%;-webkit-animation-delay:2s,2s;animation-delay:2s,2s}.snowflake:nth-of-type(5){left:50%;-webkit-animation-delay:8s,3s;animation-delay:8s,3s}.snowflake:nth-of-type(6){left:60%;-webkit-animation-delay:6s,2s;animation-delay:6s,2s}.snowflake:nth-of-type(7){left:70%;-webkit-animation-delay:2.5s,1s;animation-delay:2.5s,1s}.snowflake:nth-of-type(8){left:80%;-webkit-animation-delay:1s,0s;animation-delay:1s,0s}.snowflake:nth-of-type(9){left:90%;-webkit-animation-delay:3s,1.5s;animation-delay:3s,1.5s}.snowflake:nth-of-type(10){left:25%;-webkit-animation-delay:2s,0s;animation-delay:2s,0s}.snowflake:nth-of-type(11){left:65%;-webkit-animation-delay:4s,2.5s;animation-delay:4s,2.5s}
            </style>
            <div class="snowflakes" aria-hidden="true">
              <div class="snowflake">❅</div>
              <div class="snowflake">❆</div>
              <div class="snowflake">❅</div>
              <div class="snowflake">❆</div>
              <div class="snowflake">❅</div>
              <div class="snowflake">❆</div>
              <div class="snowflake">❅</div>
              <div class="snowflake">❆</div>
              <div class="snowflake">❅</div>
              <div class="snowflake">❆</div>
              <div class="snowflake">❅</div>
              <div class="snowflake">❆</div>
            </div>
        </div>
        `;
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

function showNoSlidesMessage(errorMessage) {
    const slideshow = document.getElementById('slideshow');
    slideshow.innerHTML = `
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