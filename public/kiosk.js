let lastModified = '';

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
    fetch(`kiosk.json?t=${timestamp}`, { method: 'HEAD' })
        .then(response => {
            const currentModified = response.headers.get('Last-Modified');
            if (currentModified !== lastModified) {
                lastModified = currentModified;
                return fetch(`kiosk.json?t=${timestamp}`);
            }
            return Promise.reject('No update needed');
        })
        .then(response => response.json())
        .then(data => {
            const slideshow = document.getElementById('slideshow');
            slideshow.innerHTML = '';
            data.forEach((item, index) => {
                const timeMilliseconds = item.time;
                const timeSeconds = timeMilliseconds ? timeMilliseconds / 1000 : null;
                if (timeSeconds !== null && timeSeconds < 4) {
                    console.warn('Slide time is less than 4 seconds');
                    // You might want to handle this case, e.g., set a minimum time
                }
                
                const slide = document.createElement('div');
                slide.className = 'slide';
                slide.innerHTML = `
                    <h2>${item.text}</h2>
                    <p>${item.description}</p>
                    <img src="${item.image}" alt="${item.text}">
                `;
                slide.dataset.accentColor = item.accentColor;
                slide.dataset.time = timeMilliseconds || 8000; // Default to 8000 ms if not specified
                slideshow.appendChild(slide);
            });
            startSlideshow();
        })
        .catch(error => {
            if (error !== 'No update needed') {
                console.error('Error loading kiosk data:', error);
            }
        });
}
function startSlideshow() {
    const slides = document.getElementsByClassName('slide');
    let currentSlide = 0;
    const slideshow = document.getElementById('slideshow');

    function showSlide(index) {
        const interval = parseInt(slides[index].dataset.time);
        const currentColor = slides[index].dataset.accentColor;

        slideshow.style.backgroundColor = currentColor;
        slides[index].style.opacity = 1;

        return interval;
    }

    function hideSlide(index) {
        slides[index].style.opacity = 0;
    }

    function nextSlide() {
        hideSlide(currentSlide);
        currentSlide = (currentSlide + 1) % slides.length;
        const interval = showSlide(currentSlide);
        setTimeout(nextSlide, interval);
    }

    if (slides.length > 0) {
        const initialInterval = showSlide(currentSlide);
        setTimeout(nextSlide, initialInterval);
    }
}

window.onload = function() {
    loadContent();
    setInterval(loadContent, 20000);
};