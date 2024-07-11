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
                const slide = document.createElement('div');
                slide.className = 'slide';
                slide.innerHTML = `
                    <h2>${item.text}</h2>
                    <p>${item.description}</p>
                    <img src="${item.image}" alt="${item.text}">
                `;
                slide.style.backgroundColor = item.accentColor;
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
    const interval = 8000;

    function showSlide(index) {
        slides[index].style.animation = `fadey ${interval}ms`;
        slides[index].style.opacity = 1;
    }

    function hideSlide(index) {
        slides[index].style.opacity = 0;
        slides[index].style.animation = '';
    }

    if (slides.length > 0) {
        showSlide(currentSlide);
        setInterval(function() {
            hideSlide(currentSlide);
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }, interval);
    }
}

window.onload = function() {
    loadContent();
    setInterval(loadContent, 20000);
};