const addButton = document.getElementById('add-button');
const modal = document.getElementById('modal');
const saveButton = document.getElementById('save');
const cancelButton = document.getElementById('cancel');
const kioskInfo = document.getElementById('kiosk-info');
const themeToggle = document.getElementById('theme-toggle');
let editingId = null;
let placeholder = document.createElement('div');
placeholder.className = 'placeholder';

function getDominantColor(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function() {
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
    const accentColorInput = document.getElementById('accentColor');
    
    if (imageUrl) {
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
        itemElement.setAttribute('draggable', true);
        itemElement.setAttribute('data-id', item.id);
        itemElement.innerHTML = `
            <h3>${item.id}. ${item.text}</h3>
            <p>${item.description}</p>
            <img src="${item.image}" alt="${item.text}" draggable="false">
            <div class="button-group">
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
                document.getElementById('text').value = item.text;
                document.getElementById('description').value = item.description;
                document.getElementById('image').value = item.image;
                document.getElementById('accentColor').value = item.accentColor || '#4CAF50';
                editingId = id;
                modal.style.display = 'block';
                
                // Add event listener to image input
                document.getElementById('image').addEventListener('change', fetchAndSetDominantColor);
                
                // Fetch dominant color if no accent color is set
                if (!item.accentColor || item.accentColor === '#4CAF50') {
                    fetchAndSetDominantColor();
                }
            }
        });
}

addButton.addEventListener('click', () => {
    editingId = null;
    document.getElementById('text').value = '';
    document.getElementById('description').value = '';
    document.getElementById('image').value = '';
    document.getElementById('accentColor').value = '#4CAF50';
    modal.style.display = 'block';

    document.getElementById('image').addEventListener('change', fetchAndSetDominantColor);

});

cancelButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

saveButton.addEventListener('click', async () => {
    const text = document.getElementById('text').value;
    if (!text.trim()) {
        alert('Le titre ne peut pas être vide.');
        return;
    }
    const description = document.getElementById('description').value;
    const image = document.getElementById('image').value;
    let accentColor = document.getElementById('accentColor').value;

    const data = { text, description, image, accentColor };
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