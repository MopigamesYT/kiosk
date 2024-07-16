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
   
    let content = `<h2>${slide.text}</h2>`;
    if (slide.description) {
        content += `<p>${slide.description}</p>`;
    }
    if (slide.image) {
        content += `<img src="${slide.image}" alt="${slide.text}">`;
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
   
    // Fade out current slide
    if (slides[currentSlideIndex]) {
        slides[currentSlideIndex].classList.add('fadeout');
        setTimeout(() => {
            slides[currentSlideIndex].classList.remove('fadeout', 'active');
            slides[currentSlideIndex].style.opacity = '0';
            
            // Fade in new slide only after the previous one has faded out
            fadeInNewSlide(index, slides, slideshow);
        }, 500); // Match this to your fade-out animation duration
    } else {
        // If there's no current slide (first run), fade in the new slide immediately
        fadeInNewSlide(index, slides, slideshow);
    }
}

function fadeInNewSlide(index, slides, slideshow) {
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.opacity = '0';
        slides[i].classList.remove('active');
    }
   
    slides[index].style.opacity = '1';
    slides[index].classList.add('active');
   
    slideshow.style.backgroundColor = slides[index].dataset.accentColor;

    // Trigger reflow to restart animations
    slides[index].offsetHeight;

    // Add animation classes to elements inside the current slide
    const title = slides[index].querySelector('h2');
    const description = slides[index].querySelector('p');
    const image = slides[index].querySelector('img');

    if (title) title.classList.add('animate-title');
    if (description) description.classList.add('animate-description');
    if (image) image.classList.add('animate-image');
}

function startSlideshow() {
    clearInterval(slideshowInterval);
   
    function nextSlide() {
        // Remove animation classes from the current slide
        const currentSlide = document.getElementsByClassName('slide')[currentSlideIndex];
        const title = currentSlide.querySelector('h2');
        const description = currentSlide.querySelector('p');
        const image = currentSlide.querySelector('img');

        if (title) title.classList.remove('animate-title');
        if (description) description.classList.remove('animate-description');
        if (image) image.classList.remove('animate-image');

        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        showSlide(currentSlideIndex);
    }

    showSlide(currentSlideIndex);
    slideshowInterval = setInterval(nextSlide, slides[currentSlideIndex].time);
}

function createSlideElement(slide, index) {
    const slideElement = document.createElement('div');
    slideElement.className = 'slide';
    slideElement.style.opacity = index === currentSlideIndex ? '1' : '0';
    slideElement.dataset.accentColor = slide.accentColor;
   
    let content = `<h2>${slide.text}</h2>`;
    if (slide.description) {
        content += `<p>${slide.description}</p>`;
    }
    if (slide.image) {
        content += `<img src="${slide.image}" alt="${slide.text}">`;
    }
   
    slideElement.innerHTML = content;
    return slideElement;
}

function init() {
    loadContent();
    setInterval(loadContent, 2000);
}

window.onload = init;