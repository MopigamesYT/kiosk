/**
 * Kiosk Manager - Handles all kiosk slide operations
 */

import { UIHelpers } from '../helpers/UIHelpers.js';

export class KioskManager {
  constructor() {
    this.editingId = null;
    this.initializeElements();
    this.attachEventListeners();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements = {
      kioskInfo: document.getElementById('kiosk-info'),
      modal: document.getElementById('modal'),
      addButton: document.getElementById('add-button'),
      saveButton: document.getElementById('save'),
      cancelButton: document.getElementById('cancel'),
      goToKioskBtn: document.getElementById('goToKioskBtn')
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (this.elements.addButton) {
      this.elements.addButton.addEventListener('click', () => this.showAddModal());
    }

    if (this.elements.saveButton) {
      this.elements.saveButton.addEventListener('click', () => this.saveSlide());
    }

    if (this.elements.cancelButton) {
      this.elements.cancelButton.addEventListener('click', () => this.hideModal());
    }

    if (this.elements.goToKioskBtn) {
      this.elements.goToKioskBtn.addEventListener('click', () => {
        window.location.href = '/';
      });
    }

    // Add event listeners for image processing
    this.attachImageEventListeners();
  }

  /**
   * Attach event listeners for image inputs
   */
  attachImageEventListeners() {
    const imageInput = document.getElementById('image');
    const imageUpload = document.getElementById('imageUpload');

    if (imageInput) {
      imageInput.addEventListener('change', () => this.fetchAndSetDominantColor());
    }

    if (imageUpload) {
      imageUpload.addEventListener('change', () => this.fetchAndSetDominantColor());
    }
  }

  /**
   * Load and display all kiosk slides
   */
  async loadSlides() {
    try {
      const slides = await UIHelpers.apiRequest('/kiosk');
      this.renderSlides(slides);
    } catch (error) {
      console.error('Error loading slides:', error);
      UIHelpers.showNotification('Failed to load slides', 'error');
    }
  }

  /**
   * Render slides in the UI
   * @param {Array} slides - Array of slide objects
   */
  renderSlides(slides) {
    if (!this.elements.kioskInfo) return;

    this.elements.kioskInfo.innerHTML = '';
    
    slides.forEach(slide => {
      const slideElement = this.createSlideElement(slide);
      this.elements.kioskInfo.appendChild(slideElement);
    });

    this.attachSlideEventListeners();
  }

  /**
   * Create a slide element
   * @param {Object} slide - Slide data
   * @returns {HTMLElement} Slide element
   */
  createSlideElement(slide) {
    const itemElement = document.createElement('div');
    itemElement.className = 'kiosk-item';
    itemElement.style.borderColor = slide.accentColor;
    itemElement.style.opacity = slide.visibility ? '1' : '0.5';
    itemElement.setAttribute('draggable', true);
    itemElement.setAttribute('data-id', slide.id);

    let content = '';
    if (slide.text || slide.description) {
      content = `
        ${slide.text ? `<h3>${slide.id}. ${slide.text}</h3>` : ''}
        ${slide.description ? `<p>${slide.description}</p>` : ''}
        ${slide.image ? `<img src="${slide.image}" alt="${slide.text || 'Kiosk image'}" draggable="false">` : ''}
      `;
    } else if (slide.image) {
      content = `<h3>${slide.id}.</h3> <img src="${slide.image}" alt="Kiosk image" draggable="false" class="full-size-image">`;
      itemElement.classList.add('image-only');
    }

    const visibilityIcon = slide.visibility ? '👁️' : '👁️‍🗨️';

    itemElement.innerHTML = `
      ${content}
      <div class="button-group">
        <button class="visibility-btn" data-id="${slide.id}" title="${slide.visibility ? 'Hide' : 'Show'}">${visibilityIcon}</button>
        <button class="edit-btn" data-id="${slide.id}">Edit</button>
        <button class="delete-btn" data-id="${slide.id}">Delete</button>
      </div>
    `;

    return itemElement;
  }

  /**
   * Attach event listeners to slide buttons
   */
  attachSlideEventListeners() {
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        this.deleteSlide(id);
      });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        this.editSlide(id);
      });
    });

    // Visibility buttons
    document.querySelectorAll('.visibility-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        this.toggleVisibility(id);
      });
    });
  }

  /**
   * Show modal for adding new slide
   */
  showAddModal() {
    this.editingId = null;
    this.clearForm();
    UIHelpers.showModal(this.elements.modal);
    UIHelpers.toggleButton(this.elements.saveButton, false);
  }

  /**
   * Hide modal
   */
  hideModal() {
    UIHelpers.hideModal(this.elements.modal);
  }

  /**
   * Clear form fields
   */
  clearForm() {
    UIHelpers.clearFormFields([
      'text', 'description', 'time', 'image', 'imageUpload'
    ]);
    
    const accentColorInput = document.getElementById('accentColor');
    if (accentColorInput) {
      accentColorInput.value = '#4CAF50';
    }
  }

  /**
   * Edit existing slide
   * @param {number} id - Slide ID
   */
  async editSlide(id) {
    try {
      const slides = await UIHelpers.apiRequest('/kiosk');
      const slide = slides.find(item => item.id === id);
      
      if (!slide) {
        UIHelpers.showNotification('Slide not found', 'error');
        return;
      }

      // Populate form with slide data
      UIHelpers.setFormValues({
        text: slide.text || '',
        description: slide.description || '',
        time: slide.time ? slide.time / 1000 : '',
        image: slide.image || '',
        accentColor: slide.accentColor || '#4CAF50',
        visibility: slide.visibility
      });

      // Clear file upload
      const imageUpload = document.getElementById('imageUpload');
      if (imageUpload) imageUpload.value = '';

      this.editingId = id;
      this.elements.modal.dataset.currentVisibility = slide.visibility;
      UIHelpers.showModal(this.elements.modal);
      UIHelpers.toggleButton(this.elements.saveButton, false);

      // Fetch dominant color if no accent color is set
      if (!slide.accentColor || slide.accentColor === '#4CAF50') {
        this.fetchAndSetDominantColor();
      }
    } catch (error) {
      console.error('Error loading slide for editing:', error);
      UIHelpers.showNotification('Failed to load slide data', 'error');
    }
  }

  /**
   * Save slide (create or update)
   */
  async saveSlide() {
    UIHelpers.toggleButton(this.elements.saveButton, true);

    try {
      const slideData = await this.collectSlideData();
      
      // Validate slide data
      const validation = this.validateSlideData(slideData);
      if (!validation.isValid) {
        UIHelpers.showNotification(validation.errors.join('\\n'), 'error');
        return;
      }

      const method = this.editingId ? 'PUT' : 'POST';
      const url = this.editingId ? `/kiosk/${this.editingId}` : '/kiosk';

      const result = await UIHelpers.apiRequest(url, {
        method,
        body: JSON.stringify(slideData)
      });

      if (result.success) {
        this.hideModal();
        await this.loadSlides();
        this.editingId = null;
        UIHelpers.showNotification(
          this.editingId ? 'Slide updated successfully' : 'Slide created successfully', 
          'success'
        );
      }
    } catch (error) {
      console.error('Error saving slide:', error);
      UIHelpers.showNotification('Failed to save slide', 'error');
    } finally {
      UIHelpers.toggleButton(this.elements.saveButton, false);
    }
  }

  /**
   * Collect slide data from form
   * @returns {Promise<Object>} Slide data
   */
  async collectSlideData() {
    const text = document.getElementById('text').value;
    const description = document.getElementById('description').value;
    const timeInputSeconds = document.getElementById('time').value;
    let image = document.getElementById('image').value;
    let accentColor = document.getElementById('accentColor').value;
    const visibilityInput = document.getElementById('visibility');
    const imageUpload = document.getElementById('imageUpload');

    const timeSeconds = timeInputSeconds === '' ? null : Number(timeInputSeconds);
    
    // Handle image upload
    if (imageUpload && imageUpload.files.length > 0) {
      const uploadResult = await UIHelpers.uploadFile(
        imageUpload.files[0], 
        '/upload', 
        'image'
      );
      
      if (uploadResult.success) {
        image = uploadResult.imagePath;
        // Get dominant color from uploaded image
        const uploadedImageUrl = window.location.origin + image;
        accentColor = await UIHelpers.getDominantColor(uploadedImageUrl);
      }
    } else if (image && accentColor === '#4CAF50') {
      // Fetch dominant color for image URL if not already set
      try {
        accentColor = await UIHelpers.getDominantColor(image);
      } catch (error) {
        console.error('Color extraction failed:', error);
      }
    }

    const timeMilliseconds = timeSeconds ? timeSeconds * 1000 : null;

    const visibility = this.editingId
      ? (this.elements.modal.dataset.currentVisibility === 'true')
      : (visibilityInput ? visibilityInput.checked : true);

    return {
      text,
      description,
      time: timeMilliseconds,
      image,
      accentColor,
      visibility
    };
  }

  /**
   * Validate slide data
   * @param {Object} slideData - Slide data to validate
   * @returns {Object} Validation result
   */
  validateSlideData(slideData) {
    const errors = [];

    // Time validation
    if (slideData.time !== null && slideData.time < 4000) {
      errors.push('Slide time must be at least 4 seconds');
    }

    // Content validation
    if (!slideData.text && !slideData.image) {
      errors.push('Slide must have either text or an image');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Delete slide
   * @param {number} id - Slide ID
   */
  async deleteSlide(id) {
    // Create a custom confirmation modal instead of alert
    const confirmed = await this.showConfirmationModal('Delete Slide', 'Are you sure you want to delete this slide? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      const result = await UIHelpers.apiRequest(`/kiosk/${id}`, {
        method: 'DELETE'
      });

      if (result.success) {
        await this.loadSlides();
        UIHelpers.showNotification('Slide deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
      UIHelpers.showNotification('Failed to delete slide', 'error');
    }
  }

  /**
   * Toggle slide visibility
   * @param {number} id - Slide ID
   */
  async toggleVisibility(id) {
    try {
      const result = await UIHelpers.apiRequest(`/kiosk/${id}/toggle-visibility`, {
        method: 'POST'
      });

      if (result.success) {
        this.renderSlides(result.updatedData);
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      UIHelpers.showNotification('Failed to toggle visibility', 'error');
    }
  }

  /**
   * Fetch and set dominant color from image
   */
  async fetchAndSetDominantColor() {
    const imageUrl = document.getElementById('image').value;
    const imageFile = document.getElementById('imageUpload').files[0];
    const accentColorInput = document.getElementById('accentColor');

    if (!accentColorInput) return;

    try {
      if (imageFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const color = await UIHelpers.getDominantColor(e.target.result);
            accentColorInput.value = color;
          } catch (error) {
            console.error('Error fetching dominant color:', error);
            accentColorInput.value = '#4CAF50';
          }
        };
        reader.readAsDataURL(imageFile);
      } else if (imageUrl) {
        const color = await UIHelpers.getDominantColor(imageUrl);
        accentColorInput.value = color;
      }
    } catch (error) {
      console.error('Error fetching dominant color:', error);
      accentColorInput.value = '#4CAF50';
    }
  }

  /**
   * Show a custom confirmation modal
   * @param {string} title - Modal title
   * @param {string} message - Confirmation message
   * @returns {Promise<boolean>} True if confirmed
   */
  async showConfirmationModal(title, message) {
    return new Promise((resolve) => {
      // Create modal backdrop
      const backdrop = document.createElement('div');
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Create modal
      const modal = document.createElement('div');
      modal.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 400px;
        margin: 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      `;

      modal.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #333;">${title}</h3>
        <p style="margin: 0 0 20px 0; color: #666; line-height: 1.4;">${message}</p>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="cancel-btn" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button id="confirm-btn" style="padding: 8px 16px; border: none; background: #f44336; color: white; border-radius: 4px; cursor: pointer;">Delete</button>
        </div>
      `;

      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      // Handle buttons
      const cancelBtn = modal.querySelector('#cancel-btn');
      const confirmBtn = modal.querySelector('#confirm-btn');

      const cleanup = () => {
        document.body.removeChild(backdrop);
      };

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      confirmBtn.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      // Close on backdrop click
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          cleanup();
          resolve(false);
        }
      });
    });
  }
}
