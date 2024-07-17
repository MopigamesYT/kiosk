let slides = [];
let currentSlideIndex = 0;
let slideshowInterval;
let isInitialLoad = true;
let previousTheme = '';
let globalSettings = {};
let cursorVisible = false;
let mouseActive = false;

const cursor = document.createElement('div');
const adminButton = document.getElementById('admin-button');
adminButton.style.display = 'none';
cursor.style.width = '10px';
cursor.style.height = '10px';
cursor.style.backgroundColor = '#fff';
cursor.style.borderRadius = '50%';
cursor.style.position = 'absolute';
cursor.style.pointerEvents = 'none';
cursor.style.zIndex = '9999';
document.body.appendChild(cursor);

let cursorTimeout;

setTimeout(() => {
    mouseActive = true; // Allow mouse movement registration after 2 seconds
}, 2000);

adminButton.addEventListener('click', () => {
    window.location.href = '/admin';
});

document.addEventListener('mousemove', (event) => {
    if (!mouseActive) return;

    if (!cursorVisible) {
        cursor.style.animation = 'fadeInUp 0.5s forwards';
        adminButton.style.animation = 'fadeInUp 0.5s forwards'; // Apply fade-in animation to the admin button
    }
    cursorVisible = true;
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    cursor.style.opacity = '1';

    // Show the admin button if slides are present
    const slidesElements = document.getElementById('slideshow').getElementsByClassName('slide');
    if (slidesElements.length > 0) {
        adminButton.style.display = 'block'; // Show button only when slides are present and mouse moves
        adminButton.style.opacity = '1';
    }

    clearTimeout(cursorTimeout);
    cursorTimeout = setTimeout(() => {
        cursor.style.animation = 'fadeOut 0.5s forwards';
        adminButton.style.animation = 'fadeOut 0.5s forwards'; // Apply fade-out animation to the admin button
        setTimeout(() => {
            cursor.style.opacity = '0';
            cursorVisible = false;
            cursor.style.animation = 'none';
            adminButton.style.display = 'none'; // Hide the admin button after fade-out animation
        }, 500);
    }, 1000);
});


function toggleFullScreen(element) {
    if (!document.fullscreenElement) {
        element.requestFullscreen ? element.requestFullscreen() :
        element.webkitRequestFullscreen ? element.webkitRequestFullscreen() :
        element.msRequestFullscreen && element.msRequestFullscreen();
    } else {
        document.exitFullscreen ? document.exitFullscreen() :
        document.webkitExitFullscreen ? document.webkitExitFullscreen() :
        document.msExitFullscreen && document.msExitFullscreen();
    }
}

function loadContent() {
    if (isInitialLoad) {
        showLoading();
    }
    const timestamp = new Date().getTime();
    fetch(`kiosk.json?t=${timestamp}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            globalSettings = data.globalSettings || {};
            updateTheme();
            updateSlides(data.slides || []);
            hideLoading();
            isInitialLoad = false;
        })
        .catch(error => {
            console.error('Error loading kiosk data:', error);
            showNoSlidesMessage(error.message);
            hideLoading();
        });
}

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function updateSlides(data) {
    const visibleSlides = data.filter(item => item.visibility !== false);

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
        rebuildSlideshow();
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
    } else if (globalSettings.theme === 'summer') {
        themeContainer.innerHTML = `
        <style>
            .ocean {
                height: 100px;
                width: 100%;
                position: fixed;
                bottom: 0;
                left: 0;
                z-index: 1;
                pointer-events: none;
            }
            .wave {
                z-index: 1;
                background: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/85486/wave.svg) repeat-x;
                position: absolute;
                width: 6400px;
                height: 198px;
                animation: wave 7s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
                transform: translate3d(0, 0, 0);
            }
            .wave:nth-of-type(1) {
                bottom: 0;
                opacity: 0.7;
            }
            .wave:nth-of-type(2) {
                bottom: 10px;
                animation: wave 7s cubic-bezier(0.36, 0.45, 0.63, 0.53) -.125s infinite, swell 7s ease -1.25s infinite;
                opacity: 0.3;
            }
            @keyframes wave {
                0% { margin-left: 0; }
                100% { margin-left: -1600px; }
            }
            @keyframes swell {
                0%, 100% { transform: translateY(-15px); }
                50% { transform: translateY(15px); }
            }
        </style>
        <div class="ocean">
            <div class="wave"></div>
            <div class="wave"></div>
        </div>
        `;
    } else if (globalSettings.theme === 'halloween') {
        themeContainer.innerHTML = `
        <div class="snowflakescript">
            <style>
                .snowflake {
                  color: #fff;
                  font-size: 1em;
                  font-family: Arial, sans-serif;
                  text-shadow: 0 0 5px #000;
                }
                
                @-webkit-keyframes snowflakes-fall{0%{top:-10%}100%{top:100%}}@-webkit-keyframes snowflakes-shake{0%,100%{-webkit-transform:translateX(0);transform:translateX(0)}50%{-webkit-transform:translateX(80px);transform:translateX(80px)}}@keyframes snowflakes-fall{0%{top:-10%}100%{top:100%}}@keyframes snowflakes-shake{0%,100%{transform:translateX(0)}50%{transform:translateX(80px)}}.snowflake{position:fixed;top:-10%;z-index:9999;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;cursor:default;-webkit-animation-name:snowflakes-fall,snowflakes-shake;-webkit-animation-duration:10s,3s;-webkit-animation-timing-function:linear,ease-in-out;-webkit-animation-iteration-count:infinite,infinite;-webkit-animation-play-state:running,running;animation-name:snowflakes-fall,snowflakes-shake;animation-duration:10s,3s;animation-timing-function:linear,ease-in-out;animation-iteration-count:infinite,infinite;animation-play-state:running,running}.snowflake:nth-of-type(0){left:1%;-webkit-animation-delay:0s,0s;animation-delay:0s,0s}.snowflake:nth-of-type(1){left:10%;-webkit-animation-delay:1s,1s;animation-delay:1s,1s}.snowflake:nth-of-type(2){left:20%;-webkit-animation-delay:6s,.5s;animation-delay:6s,.5s}.snowflake:nth-of-type(3){left:30%;-webkit-animation-delay:4s,2s;animation-delay:4s,2s}.snowflake:nth-of-type(4){left:40%;-webkit-animation-delay:2s,2s;animation-delay:2s,2s}.snowflake:nth-of-type(5){left:50%;-webkit-animation-delay:8s,3s;animation-delay:8s,3s}.snowflake:nth-of-type(6){left:60%;-webkit-animation-delay:6s,2s;animation-delay:6s,2s}.snowflake:nth-of-type(7){left:70%;-webkit-animation-delay:2.5s,1s;animation-delay:2.5s,1s}.snowflake:nth-of-type(8){left:80%;-webkit-animation-delay:1s,0s;animation-delay:1s,0s}.snowflake:nth-of-type(9){left:90%;-webkit-animation-delay:3s,1.5s;animation-delay:3s,1.5s}.snowflake:nth-of-type(10){left:25%;-webkit-animation-delay:2s,0s;animation-delay:2s,0s}.snowflake:nth-of-type(11){left:65%;-webkit-animation-delay:4s,2.5s;animation-delay:4s,2.5s}
            </style>
            <div class="snowflakes" aria-hidden="true">
              <div class="snowflake">🎃</div>
              <div class="snowflake">🍂</div>
              <div class="snowflake">🎃</div>
              <div class="snowflake">🍁</div>
              <div class="snowflake">🎃</div>
              <div class="snowflake">🍂</div>
              <div class="snowflake">🎃</div>
              <div class="snowflake">🍁</div>
              <div class="snowflake">🎃</div>
              <div class="snowflake">🍂</div>
              <div class="snowflake">🎃</div>
              <div class="snowflake">🍁</div>
            </div>
        </div>
        `;
    }
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
    const slidesElements = slideshow.getElementsByClassName('slide');
    const currentSlide = slidesElements[currentSlideIndex];
    const nextSlide = slidesElements[index];

    currentSlide.style.opacity = '0';

    setTimeout(() => {
        for (let i = 0; i < slidesElements.length; i++) {
            slidesElements[i].style.display = 'none';
        }

        nextSlide.style.display = 'flex';
        nextSlide.style.opacity = '0';
        setTimeout(() => {
            nextSlide.style.opacity = '1';
            slideshow.style.backgroundColor = nextSlide.dataset.accentColor;
        }, 50);
        
        currentSlideIndex = index;

        // Show the admin button when a slide is visible
    }, 1000);
}

function startSlideshow() {
    clearInterval(slideshowInterval);

    function nextSlide() {
        const nextIndex = (currentSlideIndex + 1) % slides.length;
        showSlide(nextIndex);
    }

    showSlide(currentSlideIndex);
    slideshowInterval = setInterval(nextSlide, slides[currentSlideIndex].time);
}

function init() {   
    loadContent();
    setInterval(loadContent, 2000);
}

window.onload = init;