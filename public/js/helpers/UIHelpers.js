/**
 * UI Helpers - Utility functions for DOM manipulation and UI interactions
 */

export class UIHelpers {
  /**
   * Get dominant color from an image
   * @param {string} imageUrl - URL of the image
   * @returns {Promise<string>} Hex color code
   */
  static getDominantColor(imageUrl) {
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

  /**
   * Show modal
   * @param {HTMLElement} modal - Modal element
   */
  static showModal(modal) {
    if (modal) {
      modal.style.display = 'block';
    }
  }

  /**
   * Hide modal
   * @param {HTMLElement} modal - Modal element
   */
  static hideModal(modal) {
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Clear form fields
   * @param {string[]} fieldIds - Array of field IDs to clear
   */
  static clearFormFields(fieldIds) {
    fieldIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = false;
        } else if (element.type === 'file') {
          element.value = '';
        } else {
          element.value = '';
        }
      }
    });
  }

  /**
   * Set form field values
   * @param {Object} values - Object with field IDs as keys and values
   */
  static setFormValues(values) {
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = Boolean(value);
        } else {
          element.value = value || '';
        }
      }
    });
  }

  /**
   * Disable/enable button
   * @param {HTMLElement} button - Button element
   * @param {boolean} disabled - Whether to disable the button
   */
  static toggleButton(button, disabled = true) {
    if (!button) return;
    
    button.disabled = disabled;
    button.style.opacity = disabled ? '0.5' : '1';
    button.style.cursor = disabled ? 'not-allowed' : 'pointer';
  }

  /**
   * Show notification/alert
   * @param {string} message - Message to show
   * @param {string} type - Type of notification ('success', 'error', 'info')
   */
  static showNotification(message, type = 'info') {
    // Log to console instead of showing alerts
    if (type === 'error') {
      console.error(`❌ ${message}`);
    } else if (type === 'success') {
      console.log(`✅ ${message}`);
    } else {
      console.info(`ℹ️ ${message}`);
    }

    // Create a subtle toast notification
    this.createToastNotification(message, type);
  }

  /**
   * Create a toast notification element
   * @param {string} message - Message to show
   * @param {string} type - Type of notification
   */
  static createToastNotification(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      transform: translateX(100%);
    `;

    // Set color based on type
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      info: '#2196F3'
    };
    toast.style.backgroundColor = colors[type] || colors.info;

    // Set message
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    toast.textContent = `${icon} ${message}`;

    // Add to page
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 4000);
  }

  /**
   * Upload file to server
   * @param {File} file - File to upload
   * @param {string} endpoint - Upload endpoint
   * @param {string} fieldName - Form field name for the file
   * @returns {Promise<Object>} Upload result
   */
  static async uploadFile(file, endpoint, fieldName = 'file') {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Make API request with error handling
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  static async apiRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Validate form fields
   * @param {Object} rules - Validation rules object
   * @returns {Object} Validation result
   */
  static validateForm(rules) {
    const errors = [];

    Object.entries(rules).forEach(([fieldId, rule]) => {
      const element = document.getElementById(fieldId);
      if (!element) return;

      const value = element.type === 'checkbox' ? element.checked : element.value;

      // Required validation
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors.push(`${rule.label || fieldId} is required`);
      }

      // Min/max for numbers
      if (rule.type === 'number' && value) {
        const numValue = Number(value);
        if (rule.min !== undefined && numValue < rule.min) {
          errors.push(`${rule.label || fieldId} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && numValue > rule.max) {
          errors.push(`${rule.label || fieldId} must be no more than ${rule.max}`);
        }
      }

      // Custom validation
      if (rule.validate && typeof rule.validate === 'function') {
        const customError = rule.validate(value);
        if (customError) {
          errors.push(customError);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
