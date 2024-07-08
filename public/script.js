const addButton = document.getElementById('add-button');
const modal = document.getElementById('modal');
const saveButton = document.getElementById('save');
const cancelButton = document.getElementById('cancel');
const kioskInfo = document.getElementById('kiosk-info');
const themeToggle = document.getElementById('theme-toggle');
let editingId = null;

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
            <img src="${item.image}" alt="${item.text}">
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
        item.addEventListener('dragover', dragOver);
        item.addEventListener('drop', drop);
        item.addEventListener('dragenter', dragEnter);
        item.addEventListener('dragleave', dragLeave);
    });
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    e.target.classList.add('drag-over');
}

function dragLeave(e) {
    e.target.classList.remove('drag-over');
}

function drop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    const draggableElement = document.querySelector(`[data-id="${id}"]`);
    const dropZone = e.target.closest('.kiosk-item');
    dropZone.parentNode.insertBefore(draggableElement, dropZone);
    e.target.classList.remove('drag-over');
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
                document.getElementById('accentColor').value = item.accentColor;
                editingId = id;
                modal.style.display = 'block';
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
});

cancelButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

saveButton.addEventListener('click', () => {
    const text = document.getElementById('text').value;
    if (!text.trim()) {
        alert('Le titre ne peut pas être vide.');
        return; // Stop the function if text is empty
    }
    const description = document.getElementById('description').value;
    const image = document.getElementById('image').value;
    const accentColor = document.getElementById('accentColor').value;

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

// Load saved theme preference
const savedTheme = localStorage.getItem('darkTheme');
if (savedTheme !== null) {
    setTheme(savedTheme === 'true');
}

loadKioskData();