const addButton = document.getElementById('add-button');
const modal = document.getElementById('modal');
const saveButton = document.getElementById('save');
const cancelButton = document.getElementById('cancel');
const kioskInfo = document.getElementById('kiosk-info');
const themeToggle = document.getElementById('theme-toggle');
const globalSettingsButton = document.getElementById('global-settings');
const globalSettingsModal = document.getElementById('global-settings-modal');
const saveGlobalSettingsButton = document.getElementById('save-global-settings');
const cancelGlobalSettingsButton = document.getElementById('cancel-global-settings');
const kioskThemeSelect = document.getElementById('kiosk-theme');
const titleFontSize = document.getElementById('title-font-size');
const descriptionFontSize = document.getElementById('description-font-size');
const titleSizeDisplay = document.getElementById('title-size-display');
const descriptionSizeDisplay = document.getElementById('description-size-display');
const watermarkEnabled = document.getElementById('watermark-enabled');
const watermarkUpload = document.getElementById('watermarkUpload');
const watermarkPosition = document.getElementById('watermark-position');
const watermarkSize = document.getElementById('watermark-size');
const watermarkOpacity = document.getElementById('watermark-opacity');
const watermarkSizeDisplay = document.getElementById('watermark-size-display');
const watermarkOpacityDisplay = document.getElementById('watermark-opacity-display');
const currentWatermarkImg = document.querySelector('#current-watermark img');
const noWatermarkText = document.querySelector('.no-watermark');

let editingId = null;
let placeholder = document.createElement('div');
placeholder.className = 'placeholder';

watermarkSize.addEventListener('input', () => {
    watermarkSizeDisplay.textContent = `${watermarkSize.value}px`;
});

watermarkOpacity.addEventListener('input', () => {
    watermarkOpacityDisplay.textContent = `${watermarkOpacity.value}%`;
});

// Add watermark upload handler
watermarkUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('watermark', file);

        try {
            const response = await fetch('/upload-watermark', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (data.success) {
                currentWatermarkImg.src = data.imagePath;
                currentWatermarkImg.style.display = 'inline';
                noWatermarkText.style.display = 'none';
                saveWatermarkSettings(data.imagePath);
            }
        } catch (error) {
            console.error('Error uploading watermark:', error);
            alert('Error uploading watermark image');
        }
    }
});

// Add this function
async function saveWatermarkSettings(imagePath = null) {
    const settings = {
        theme: kioskThemeSelect.value,
        titleFontSize: parseInt(titleFontSize.value),
        descriptionFontSize: parseInt(descriptionFontSize.value),
        watermark: {
            enabled: watermarkEnabled.checked,
            position: watermarkPosition.value,
            size: parseInt(watermarkSize.value),
            opacity: parseInt(watermarkOpacity.value)
        }
    };

    if (imagePath) {
        settings.watermark.image = imagePath;
    } else if (currentWatermarkImg.src) {
        settings.watermark.image = currentWatermarkImg.src.split(window.location.origin).pop();
    }

    try {
        const response = await fetch('/global-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

// Add these event listeners
[watermarkEnabled, watermarkPosition, watermarkSize, watermarkOpacity].forEach(control => {
    control.addEventListener('change', () => saveWatermarkSettings());
    if (control.type === 'range') {
        control.addEventListener('input', () => saveWatermarkSettings());
    }
});

titleFontSize.addEventListener('input', () => {
    titleSizeDisplay.textContent = `${titleFontSize.value}px`;
});

descriptionFontSize.addEventListener('input', () => {
    descriptionSizeDisplay.textContent = `${descriptionFontSize.value}px`;
});


function loadGlobalSettings() {
    fetch('/global-settings')
        .then(response => response.json())
        .then(data => {
            kioskThemeSelect.value = data.theme || 'default';
            titleFontSize.value = data.titleFontSize || 48;
            descriptionFontSize.value = data.descriptionFontSize || 24;
            titleSizeDisplay.textContent = `${titleFontSize.value}px`;
            descriptionSizeDisplay.textContent = `${descriptionFontSize.value}px`;
            
            // Add watermark settings loading
            if (data.watermark) {
                watermarkEnabled.checked = data.watermark.enabled || false;
                watermarkPosition.value = data.watermark.position || 'bottom-right';
                watermarkSize.value = data.watermark.size || 100;
                watermarkOpacity.value = data.watermark.opacity || 50;
                
                if (data.watermark.image) {
                    currentWatermarkImg.src = data.watermark.image;
                    currentWatermarkImg.style.display = 'inline';
                    noWatermarkText.style.display = 'none';
                }
                
                watermarkSizeDisplay.textContent = `${watermarkSize.value}px`;
                watermarkOpacityDisplay.textContent = `${watermarkOpacity.value}%`;
            }
        })
        .catch(error => console.error('Error loading global settings:', error));
}

function toggleVisibility(id) {
    fetch(`/kiosk/${id}/toggle-visibility`, {
        method: 'POST',
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderKioskItems(data.updatedData);
            } else {
                console.error('Failed to toggle visibility');
            }
        })
        .catch(error => {
            console.error('Error toggling visibility:', error);
        });
}

function getDominantColor(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.width;
            canvas.height = this.height;
            ctx.drawImage(this, 0, 0, this.width, this.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let r = 0, g = 0, b = 0;
            let count = 0;

            for (let i = 0; i < data.length; i += 4) {
                // Skip transparent pixels
                if (data[i + 3] < 255) continue;

                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }

            if (count > 0) {
                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);

                // Convert to hex
                const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                resolve(hex);
            } else {
                resolve('#4CAF50'); // Default color if no valid pixels
            }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
    });
}

function fetchAndSetDominantColor() {
    const imageUrl = document.getElementById('image').value;
    const imageFile = document.getElementById('imageUpload').files[0];
    const accentColorInput = document.getElementById('accentColor');

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function (e) {
            getDominantColor(e.target.result)
                .then(color => {
                    accentColorInput.value = color;
                })
                .catch(error => {
                    console.error('Error fetching dominant color:', error);
                    accentColorInput.value = '#4CAF50'; // Fallback to default color
                });
        }
        reader.readAsDataURL(imageFile);
    } else if (imageUrl) {
        getDominantColor(imageUrl)
            .then(color => {
                accentColorInput.value = color;
            })
            .catch(error => {
                console.error('Error fetching dominant color:', error);
                accentColorInput.value = '#4CAF50'; // Fallback to default color
            });
    }
}

function loadKioskData() {
    fetch('/kiosk')
        .then(response => response.json())
        .then(data => {
            renderKioskItems(data);
        });
}

function renderKioskItems(data) {
    kioskInfo.innerHTML = '';
    data.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'kiosk-item';
        itemElement.style.borderColor = item.accentColor;
        // Set the opacity to 50% if visibility is false
        itemElement.style.opacity = item.visibility ? '1' : '0.5';
        itemElement.setAttribute('draggable', true);
        itemElement.setAttribute('data-id', item.id);

        let content = '';
        if (item.text || item.description) {
            content = `
                ${item.text ? `<h3>${item.id}. ${item.text}</h3>` : ''}
                ${item.description ? `<p>${item.description}</p>` : ''}
                ${item.image ? `<img src="${item.image}" alt="${item.text || 'Kiosk image'}" draggable="false">` : ''}
            `;
        } else if (item.image) {
            content = `<h3>${item.id}.</h3> <img src="${item.image}" alt="Kiosk image" draggable="false" class="full-size-image">`;
            itemElement.classList.add('image-only');
        }

        const visibilityIcon = item.visibility ? '👁️' : '👁️‍🗨️';

        itemElement.innerHTML = `
            ${content}
            <div class="button-group">
                <button class="visibility-btn" data-id="${item.id}" title="${item.visibility ? 'Hide' : 'Show'}">${visibilityIcon}</button>
                <button class="edit-btn" data-id="${item.id}">Edit</button>
                <button class="delete-btn" data-id="${item.id}">Delete</button>
            </div>
        `;
        kioskInfo.appendChild(itemElement);
    });
    addItemListeners();
    addDragListeners();
}

function addItemListeners() {
    const deleteButtons = document.querySelectorAll('.delete-btn');
    const editButtons = document.querySelectorAll('.edit-btn');
    const visibilityButtons = document.querySelectorAll('.visibility-btn');

    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            deleteKioskItem(id);
        });
    });

    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            editKioskItem(id);
        });
    });

    visibilityButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            toggleVisibility(id);
        });
    });
}

function addDragListeners() {
    const items = document.querySelectorAll('.kiosk-item');
    items.forEach(item => {
        item.addEventListener('dragstart', dragStart);
        item.addEventListener('dragend', dragEnd);
        item.addEventListener('dragover', dragOver);
        item.addEventListener('dragenter', dragEnter);
        item.addEventListener('dragleave', dragLeave);
        item.addEventListener('drop', drop);
    });
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
    e.target.classList.add('dragging');
    setTimeout(() => {
        e.target.style.opacity = '0.4';
    }, 0);
}

function dragEnd(e) {
    e.target.classList.remove('dragging');
    e.target.style.opacity = '1';
    document.querySelectorAll('.kiosk-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    if (!e.target.classList.contains('dragging')) {
        e.target.classList.add('drag-over');
    }
}

function dragLeave(e) {
    e.target.classList.remove('drag-over');
}

function drop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    const draggableElement = document.querySelector(`.kiosk-item[data-id="${id}"]`);
    const dropZone = e.target.closest('.kiosk-item');

    if (dropZone && draggableElement !== dropZone) {
        const allItems = Array.from(document.querySelectorAll('.kiosk-item'));
        const draggedIndex = allItems.indexOf(draggableElement);
        const droppedIndex = allItems.indexOf(dropZone);

        if (draggedIndex < droppedIndex) {
            dropZone.parentNode.insertBefore(draggableElement, dropZone.nextElementSibling);
        } else {
            dropZone.parentNode.insertBefore(draggableElement, dropZone);
        }
    }

    dropZone.classList.remove('drag-over');
    draggableElement.style.opacity = '1';
    updateOrder();
}

function updateOrder() {
    const items = document.querySelectorAll('.kiosk-item');
    const newOrder = Array.from(items).map(item => parseInt(item.getAttribute('data-id')));
    fetch('/kiosk/reorder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderKioskItems(data.updatedData);
            }
        });
}

function deleteKioskItem(id) {
    fetch(`/kiosk/${id}`, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderKioskItems(data.updatedData);
            }
        });
}

function editKioskItem(id) {
    fetch('/kiosk')
        .then(response => response.json())
        .then(data => {
            const item = data.find(item => item.id === id);
            if (item) {
                const textInput = document.getElementById('text');
                const descriptionInput = document.getElementById('description');
                const timeInput = document.getElementById('time');
                const imageInput = document.getElementById('image');
                const accentColorInput = document.getElementById('accentColor');
                const visibilityInput = document.getElementById('visibility');
                const imageUploadInput = document.getElementById('imageUpload');

                if (textInput) textInput.value = item.text || '';
                if (descriptionInput) descriptionInput.value = item.description || '';
                if (timeInput) timeInput.value = item.time ? item.time / 1000 : '';
                if (imageInput) imageInput.value = item.image || '';
                if (accentColorInput) accentColorInput.value = item.accentColor || '#4CAF50';
                if (visibilityInput) visibilityInput.checked = item.visibility;
                if (imageUploadInput) imageUploadInput.value = ''; // Clear any previous file selection

                editingId = id;
                const modal = document.getElementById('modal');
                modal.dataset.currentVisibility = item.visibility;
                if (modal) modal.style.display = 'block';
                enableSaveButton();

                // Add event listener to image input
                if (imageInput) {
                    imageInput.addEventListener('change', fetchAndSetDominantColor);
                }

                // Fetch dominant color if no accent color is set
                if (!item.accentColor || item.accentColor === '#4CAF50') {
                    fetchAndSetDominantColor();
                }
            } else {
                console.error('Item not found:', id);
            }
        })
        .catch(error => {
            console.error('Error fetching kiosk data:', error);
        });
}

function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    return fetch('/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.imagePath;
            } else {
                throw new Error('Upload failed');
            }
        });
}

addButton.addEventListener('click', () => {
    editingId = null;
    document.getElementById('text').value = '';
    document.getElementById('description').value = '';
    document.getElementById('time').value = '';
    document.getElementById('image').value = '';
    document.getElementById('imageUpload').value = ''; // Clear any previous file selection
    document.getElementById('accentColor').value = '#4CAF50';
    modal.style.display = 'block';
    enableSaveButton();

    document.getElementById('image').addEventListener('change', fetchAndSetDominantColor);
    document.getElementById('imageUpload').addEventListener('change', fetchAndSetDominantColor);
});

cancelButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

globalSettingsButton.addEventListener('click', () => {
    loadGlobalSettings();
    globalSettingsModal.style.display = 'block';
});

saveGlobalSettingsButton.addEventListener('click', () => {
    const theme = kioskThemeSelect.value;
    const titleFontSizeValue = parseInt(titleFontSize.value);
    const descriptionFontSizeValue = parseInt(descriptionFontSize.value);

    fetch('/global-settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            theme,
            titleFontSize: titleFontSizeValue,
            descriptionFontSize: descriptionFontSizeValue
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                globalSettingsModal.style.display = 'none';
                alert('Paramètres globaux sauvegardés avec succès');
            } else {
                alert('Erreur lors de la sauvegarde des paramètres globaux');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Une erreur est survenue. Veuillez réessayer.');
        });
});

cancelGlobalSettingsButton.addEventListener('click', () => {
    globalSettingsModal.style.display = 'none';
});

function disableSaveButton() {
    saveButton.disabled = true;
    saveButton.style.opacity = '0.5';
    saveButton.style.cursor = 'not-allowed';
}

function enableSaveButton() {
    saveButton.disabled = false;
    saveButton.style.opacity = '1';
    saveButton.style.cursor = 'pointer';
}

document.getElementById('goToKioskBtn').addEventListener('click', function () {
    window.location.href = '/'; // Adjust the URL as necessary
});




saveButton.addEventListener('click', async () => {
    disableSaveButton();

    const text = document.getElementById('text').value;
    const description = document.getElementById('description').value;
    const timeInputSeconds = document.getElementById('time').value;
    let image = document.getElementById('image').value;
    let accentColor = document.getElementById('accentColor').value;
    const visibilityInput = document.getElementById('visibility');

    const imageUpload = document.getElementById('imageUpload');

    const timeSeconds = timeInputSeconds === '' ? null : Number(timeInputSeconds);
    if (timeSeconds !== null && !isNaN(timeSeconds) && timeSeconds < 4) {
        alert('Le temps minimum est de 4 secondes');
        enableSaveButton();
        return;
    }


    if (imageUpload.files.length > 0) {
        try {
            image = await uploadImage(imageUpload.files[0]);
            // Fetch dominant color for uploaded image
            const uploadedImageUrl = window.location.origin + image;
            accentColor = await getDominantColor(uploadedImageUrl);
        } catch (error) {
            console.error('Upload or color extraction failed:', error);
            alert('Image upload or color extraction failed. Please try again or use an image URL.');
            return;
        }
    } else if (image) {
        // Fetch dominant color for image URL if not already set
        if (accentColor === '#4CAF50') {
            try {
                accentColor = await getDominantColor(image);
            } catch (error) {
                console.error('Color extraction failed:', error);
            }
        }
    }

    const timeMilliseconds = timeSeconds ? timeSeconds * 1000 : null;

    const visibility = editingId
        ? (modal.dataset.currentVisibility === 'true')
        : (visibilityInput ? visibilityInput.checked : true);

    const data = { text, description, time: timeMilliseconds, image, accentColor, visibility };
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/kiosk/${editingId}` : '/kiosk';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                modal.style.display = 'none';
                loadKioskData();
                editingId = null;
            }
            enableSaveButton();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Une erreur est survenue. Veuillez réessayer.');
            enableSaveButton();
        });
});

function setTheme(isDark) {
    document.body.classList.toggle('dark-theme', isDark);
    localStorage.setItem('darkTheme', isDark);
}

themeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-theme');
    setTheme(isDark);
});

const savedTheme = localStorage.getItem('darkTheme');
if (savedTheme !== null) {
    setTheme(savedTheme === 'true');
}

loadKioskData();
document.addEventListener('DOMContentLoaded', loadGlobalSettings);