/**
 * Drag Drop Manager - Handles drag and drop functionality for slide reordering
 */

import { UIHelpers } from '../helpers/UIHelpers.js';

export class DragDropManager {
  constructor(kioskManager) {
    this.kioskManager = kioskManager;
    this.placeholder = document.createElement('div');
    this.placeholder.className = 'placeholder';
    this.attachEventListeners();
  }

  /**
   * Attach drag and drop event listeners to kiosk items
   */
  attachEventListeners() {
    // Use event delegation for dynamically created items
    const kioskInfo = document.getElementById('kiosk-info');
    if (!kioskInfo) return;

    kioskInfo.addEventListener('dragstart', (e) => this.handleDragStart(e));
    kioskInfo.addEventListener('dragend', (e) => this.handleDragEnd(e));
    kioskInfo.addEventListener('dragover', (e) => this.handleDragOver(e));
    kioskInfo.addEventListener('dragenter', (e) => this.handleDragEnter(e));
    kioskInfo.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    kioskInfo.addEventListener('drop', (e) => this.handleDrop(e));
  }

  /**
   * Handle drag start event
   * @param {DragEvent} e - Drag event
   */
  handleDragStart(e) {
    const kioskItem = e.target.closest('.kiosk-item');
    if (!kioskItem) return;

    e.dataTransfer.setData('text/plain', kioskItem.getAttribute('data-id'));
    kioskItem.classList.add('dragging');
    
    setTimeout(() => {
      kioskItem.style.opacity = '0.4';
    }, 0);
  }

  /**
   * Handle drag end event
   * @param {DragEvent} e - Drag event
   */
  handleDragEnd(e) {
    const kioskItem = e.target.closest('.kiosk-item');
    if (!kioskItem) return;

    kioskItem.classList.remove('dragging');
    kioskItem.style.opacity = '1';
    
    // Remove drag-over class from all items
    document.querySelectorAll('.kiosk-item').forEach(item => {
      item.classList.remove('drag-over');
    });
  }

  /**
   * Handle drag over event
   * @param {DragEvent} e - Drag event
   */
  handleDragOver(e) {
    e.preventDefault();
  }

  /**
   * Handle drag enter event
   * @param {DragEvent} e - Drag event
   */
  handleDragEnter(e) {
    e.preventDefault();
    const kioskItem = e.target.closest('.kiosk-item');
    if (kioskItem && !kioskItem.classList.contains('dragging')) {
      kioskItem.classList.add('drag-over');
    }
  }

  /**
   * Handle drag leave event
   * @param {DragEvent} e - Drag event
   */
  handleDragLeave(e) {
    const kioskItem = e.target.closest('.kiosk-item');
    if (kioskItem) {
      kioskItem.classList.remove('drag-over');
    }
  }

  /**
   * Handle drop event
   * @param {DragEvent} e - Drag event
   */
  handleDrop(e) {
    e.preventDefault();
    
    const draggedId = e.dataTransfer.getData('text');
    const draggedElement = document.querySelector(`.kiosk-item[data-id="${draggedId}"]`);
    const dropZone = e.target.closest('.kiosk-item');

    if (dropZone && draggedElement && draggedElement !== dropZone) {
      this.reorderElements(draggedElement, dropZone);
      this.updateOrder();
    }

    if (dropZone) {
      dropZone.classList.remove('drag-over');
    }
    if (draggedElement) {
      draggedElement.style.opacity = '1';
    }
  }

  /**
   * Reorder DOM elements
   * @param {HTMLElement} draggedElement - Element being dragged
   * @param {HTMLElement} dropZone - Drop target element
   */
  reorderElements(draggedElement, dropZone) {
    const allItems = Array.from(document.querySelectorAll('.kiosk-item'));
    const draggedIndex = allItems.indexOf(draggedElement);
    const droppedIndex = allItems.indexOf(dropZone);

    if (draggedIndex < droppedIndex) {
      dropZone.parentNode.insertBefore(draggedElement, dropZone.nextElementSibling);
    } else {
      dropZone.parentNode.insertBefore(draggedElement, dropZone);
    }
  }

  /**
   * Update slide order on server
   */
  async updateOrder() {
    try {
      const items = document.querySelectorAll('.kiosk-item');
      const newOrder = Array.from(items).map(item => parseInt(item.getAttribute('data-id')));

      const result = await UIHelpers.apiRequest('/kiosk/reorder', {
        method: 'POST',
        body: JSON.stringify(newOrder)
      });

      if (result.success) {
        // Re-render slides with updated order
        this.kioskManager.renderSlides(result.updatedData);
      }
    } catch (error) {
      console.error('Error updating slide order:', error);
      UIHelpers.showNotification('Failed to update slide order', 'error');
      // Reload slides to restore original order
      this.kioskManager.loadSlides();
    }
  }

  /**
   * Enable drag and drop for newly created items
   */
  enableDragDrop() {
    const items = document.querySelectorAll('.kiosk-item');
    items.forEach(item => {
      if (!item.hasAttribute('draggable')) {
        item.setAttribute('draggable', true);
      }
    });
  }

  /**
   * Disable drag and drop (useful during edit operations)
   */
  disableDragDrop() {
    const items = document.querySelectorAll('.kiosk-item');
    items.forEach(item => {
      item.setAttribute('draggable', false);
    });
  }

  /**
   * Add visual feedback for drag operations
   */
  addDragVisualFeedback() {
    // Add CSS for drag feedback if not already present
    if (!document.getElementById('drag-drop-styles')) {
      const style = document.createElement('style');
      style.id = 'drag-drop-styles';
      style.textContent = `
        .kiosk-item.dragging {
          transform: rotate(5deg);
          box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        }
        
        .kiosk-item.drag-over {
          border: 2px dashed #007cba;
          background-color: rgba(0, 124, 186, 0.1);
        }
        
        .placeholder {
          height: 100px;
          border: 2px dashed #ccc;
          background-color: #f9f9f9;
          margin: 10px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-style: italic;
        }
        
        .placeholder::before {
          content: "Drop slide here";
        }
      `;
      document.head.appendChild(style);
    }
  }
}
