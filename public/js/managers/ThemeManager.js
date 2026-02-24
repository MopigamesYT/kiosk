import { UIHelpers } from '../helpers/UIHelpers.js';

export class ThemeManager {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    this.selectedEmojis = [];
    this.availableEmojis = [];
    this.initializeElements();
    this.initializeCodeMirrors();
    this.attachEventListeners();
    this.themes = this.processThemes(window.kioskThemes || []);
    this.selectedTheme = 'default';
    this.loadEmojis();
    this.loadCustomThemes();
  }

  initializeElements() {
    this.elements = {
      // Global Settings Modal
      kioskThemeSelect: document.getElementById('kiosk-theme'),

      // Theme Selector
      openSelectorBtn: document.getElementById('open-theme-selector-btn'),
      selectorModal: document.getElementById('theme-selector-modal'),
      closeSelectorBtn: document.getElementById('close-theme-selector-btn'),
      themePreviewsContainer: document.getElementById('theme-previews'),
      themeCategories: document.getElementById('theme-categories'),
      currentThemeName: document.getElementById('current-theme-name'),

      // Theme Creator
      openCreatorBtn: document.getElementById('open-theme-creator-btn'),
      creatorModal: document.getElementById('theme-creator-modal'),
      closeCreatorBtn: document.getElementById('close-theme-creator-btn'),
      creatorTitle: document.getElementById('theme-creator-title'),
      
      // Mode Tabs
      simpleModeBtn: document.getElementById('simple-mode-btn'),
      codeModeBtn: document.getElementById('code-mode-btn'),
      simpleModeControls: document.getElementById('simple-mode-controls'),
      codeModeControls: document.getElementById('code-mode-controls'),
      codeEditorContainer: document.getElementById('code-editor-container'),

      // Form
      themeNameInput: document.getElementById('theme-name'),
      saveThemeBtn: document.getElementById('save-theme-btn'),
      cancelThemeBtn: document.getElementById('cancel-theme-creation-btn'),

      // Live Preview
      livePreview: document.getElementById('theme-live-preview'),
      
      // Simple Mode
      emojiSelector: document.getElementById('emoji-selector'),
      emojiSearch: document.getElementById('emoji-search'),
      emojiResults: document.getElementById('emoji-results'),
      selectedEmojisDisplay: document.getElementById('selected-emojis-display'),
      animationSelect: document.getElementById('animation-type'),
      bgColorInput: document.getElementById('background-color')
    };
  }

  initializeCodeMirrors() {
    const commonOptions = {
      lineNumbers: true,
      theme: 'dracula',
      mode: 'javascript',
      gutters: ["CodeMirror-lint-markers"],
      lint: true,
    };

    this.editors = {
      html: CodeMirror.fromTextArea(document.getElementById('html-editor'), { ...commonOptions, mode: 'xml' }),
      css: CodeMirror.fromTextArea(document.getElementById('css-editor'), { ...commonOptions, mode: 'css' }),
      js: CodeMirror.fromTextArea(document.getElementById('js-editor'), { ...commonOptions, mode: 'javascript' })
    };
  }

  attachEventListeners() {
    // Selector
    if (this.elements.openSelectorBtn) {
      this.elements.openSelectorBtn.addEventListener('click', () => this.openThemeSelector());
    }
    if (this.elements.closeSelectorBtn) {
      this.elements.closeSelectorBtn.addEventListener('click', () => this.closeThemeSelector());
    }
    if (this.elements.themeCategories) {
      this.elements.themeCategories.addEventListener('click', e => this.handleCategoryClick(e));
    }

    // Creator
    if (this.elements.openCreatorBtn) {
      this.elements.openCreatorBtn.addEventListener('click', () => this.openThemeCreator());
    }
    if (this.elements.closeCreatorBtn) {
      this.elements.closeCreatorBtn.addEventListener('click', () => this.closeThemeCreator());
    }
    if (this.elements.cancelThemeBtn) {
      this.elements.cancelThemeBtn.addEventListener('click', () => this.closeThemeCreator());
    }

    // Mode switching
    if (this.elements.simpleModeBtn) {
      this.elements.simpleModeBtn.addEventListener('click', () => this.switchMode('simple'));
    }
    if (this.elements.codeModeBtn) {
      this.elements.codeModeBtn.addEventListener('click', () => this.switchMode('code'));
    }

    // Simple mode controls
    if (this.elements.emojiSelector) {
      this.elements.emojiSelector.addEventListener('click', e => this.handleEmojiSelect(e));
    }
    if (this.elements.emojiSearch) {
      this.elements.emojiSearch.addEventListener('input', e => this.handleEmojiSearch(e));
    }
    if (this.elements.animationSelect) {
      this.elements.animationSelect.addEventListener('input', () => this.updateSimplePreview());
    }
    if (this.elements.bgColorInput) {
      this.elements.bgColorInput.addEventListener('input', () => this.updateSimplePreview());
    }
    if (this.elements.saveThemeBtn) {
      this.elements.saveThemeBtn.addEventListener('click', () => this.saveCustomTheme());
    }

    // Debounce code editor updates
    Object.values(this.editors).forEach(editor => {
      editor.on('change', this.debounce(() => this.updateCodePreview(), 500));
    });
  }

  processThemes(themes) {
    // Fallback for old theme structure
    if (Array.isArray(themes)) {
      return themes.map(theme => {
        if (!theme.meta) {
          const registryEntry = window.THEME_REGISTRY ? window.THEME_REGISTRY[theme.id] : {};
          theme.meta = {
            name: registryEntry.name || theme.id,
            category: registryEntry.category || 'official',
            previewIcon: '🎨'
          };
        }
        return theme;
      });
    }
    return [];
  }

  // --- Theme Selector Logic ---

  async openThemeSelector() {
    // Reload custom themes before opening selector
    await this.loadCustomThemes();
    this.populateCategories();
    this.renderThemePreviews();
    UIHelpers.showModal(this.elements.selectorModal);
  }
  
  closeThemeSelector() {
    UIHelpers.hideModal(this.elements.selectorModal);
  }

  populateCategories() {
    const categories = [...new Set(this.themes.map(theme => theme.meta.category || 'official'))];
    this.elements.themeCategories.innerHTML = '<li class="active" data-category="all">Tous</li>';
    categories.forEach(category => {
      const li = document.createElement('li');
      li.dataset.category = category;
      li.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      this.elements.themeCategories.appendChild(li);
    });
  }

  renderThemePreviews(category = 'all') {
    this.elements.themePreviewsContainer.innerHTML = '';
    const filteredThemes = this.themes.filter(
      theme => category === 'all' || (theme.meta && theme.meta.category === category)
    );

    filteredThemes.forEach(theme => {
      const previewEl = document.createElement('div');
      previewEl.className = 'theme-preview';
      if (theme.id === this.selectedTheme) {
        previewEl.classList.add('selected');
      }
      previewEl.dataset.themeId = theme.id;

      // Add buttons for custom themes
      const buttonsHtml = theme.meta.category === 'custom' ? `
        <div class="theme-actions">
          <button class="edit-btn" onclick="event.stopPropagation(); themeManager.editCustomTheme('${theme.id}')">
            ✏️
          </button>
          <button class="delete-btn" onclick="event.stopPropagation(); themeManager.deleteCustomTheme('${theme.id}')">
            🗑️
          </button>
        </div>
      ` : '';

      previewEl.innerHTML = `
                <div class="theme-preview-visual" id="preview-${theme.id}">
                    <div class="preview-loading">Chargement...</div>
                </div>
                <div class="theme-preview-info">
                    <h4>${theme.meta.name}</h4>
                    <p>${theme.meta.category || 'Official'}</p>
                    ${buttonsHtml}
                </div>
            `;

      previewEl.addEventListener('click', () => this.selectTheme(theme.id));
      this.elements.themePreviewsContainer.appendChild(previewEl);
      
      // Render the actual theme preview
      this.renderThemePreview(theme.id, `preview-${theme.id}`);
    });
  }

  renderThemePreview(themeId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

  // Create a mini iframe for the theme preview
  const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '0';

    container.innerHTML = '';
    container.appendChild(iframe);

    // Create a mock theme container element for applying the theme
    const mockThemeContainer = document.createElement('div');
    
    // Handle custom themes by fetching their HTML directly
    const themeEntry = this.themes.find(t => t.id === themeId);
    if (themeEntry.meta.category === 'custom') {
      // Fetch custom theme snippet and inject into iframe using srcdoc
      fetch(`/userthemes/${themeId}.html`)
        .then(res => res.ok ? res.text() : Promise.reject('Not found'))
        .then(html => {
          const wrapper = `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8">
                <style>body{margin:0;padding:0;overflow:hidden}</style>
              </head>
              <body>${html}</body>
            </html>`;
          iframe.srcdoc = wrapper;
        })
        .catch(() => {
          container.innerHTML = `<div class="preview-fallback">${themeEntry.meta.previewIcon || '🎨'}</div>`;
        });
      return;
    }
    // Apply built-in themes using global applyTheme
    if (window.applyTheme && typeof window.applyTheme === 'function') {
      try {
        window.applyTheme(themeId, '', mockThemeContainer);
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <style>
                body{margin:0;padding:0;overflow:hidden;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);width:100%;height:100%;position:relative;font-size:8px;}
                .snowflake,.heart,.easter-egg,.easter-bunny,.star,.planet,.bubble,.fish,.neon-element,.falling-leaf,.tree,.butterfly,.flower,.matrix-char,.hologram{font-size:0.5em!important;animation-duration:2s!important;}*{box-sizing:border-box;}
              </style>
            </head>
            <body>${mockThemeContainer.innerHTML}</body>
          </html>
        `);
        doc.close();
      } catch (error) {
        console.warn(`Failed to render preview for theme ${themeId}:`, error);
        container.innerHTML = `<div class="preview-fallback">${themeEntry.meta.previewIcon || '🎨'}</div>`;
      }
    } else {
      // Fallback to icon if applyTheme is not available
      container.innerHTML = `<div class="preview-fallback">${themeEntry.meta.previewIcon || '🎨'}</div>`;
    }
  }

  handleCategoryClick(e) {
    if (e.target.tagName === 'LI') {
      this.elements.themeCategories.querySelector('.active').classList.remove('active');
      e.target.classList.add('active');
      this.renderThemePreviews(e.target.dataset.category);
    }
  }

  selectTheme(themeId) {
    this.selectedTheme = themeId;
    const theme = this.themes.find(t => t.id === themeId);
    this.elements.currentThemeName.textContent = theme.meta.name;
    this.settingsManager.updateCurrentTheme(themeId);
    this.renderThemePreviews(this.elements.themeCategories.querySelector('.active').dataset.category);
    this.closeThemeSelector();
  }

  setCurrentTheme(themeId) {
    this.selectedTheme = themeId;
    const theme = this.themes.find(t => t.id === themeId);
    if (theme) {
      this.elements.currentThemeName.textContent = theme.meta.name;
    } else {
      this.elements.currentThemeName.textContent = 'Par défaut';
    }
  }

  // --- Theme Creator Logic ---

  openThemeCreator() {
    this.closeThemeSelector(); // Close selector if open
    this.resetCreatorForm();
    UIHelpers.showModal(this.elements.creatorModal);
    this.switchMode('simple'); // Default to simple mode
  }

  closeThemeCreator() {
    UIHelpers.hideModal(this.elements.creatorModal);
    this.resetCreatorForm();
  }
  
  resetCreatorForm() {
    this.elements.themeNameInput.value = '';
    this.elements.animationSelect.value = 'none';
    this.selectedEmojis = [];
    this.updateSelectedEmojisDisplay();
    
    if (this.elements.emojiSearch) {
      this.elements.emojiSearch.value = '';
      this.displayDefaultEmojis();
    }
    
    this.editors.html.setValue('');
    this.editors.css.setValue('');
    this.editors.js.setValue('');
    
    // Reset editing state
    this.editingThemeId = null;
    this.elements.creatorTitle.textContent = 'Créateur de Thème';
    this.elements.saveThemeBtn.textContent = 'Sauvegarder le thème';
    
    this.updateSimplePreview();
  }

  switchMode(mode) {
    if (mode === 'simple') {
      this.elements.simpleModeBtn.classList.add('active');
      this.elements.codeModeBtn.classList.remove('active');
      this.elements.simpleModeControls.style.display = 'block';
      this.elements.codeModeControls.style.display = 'none';
      this.elements.codeEditorContainer.style.display = 'none';
      this.updateSimplePreview();
    } else {
      this.elements.simpleModeBtn.classList.remove('active');
      this.elements.codeModeBtn.classList.add('active');
      this.elements.simpleModeControls.style.display = 'none';
      this.elements.codeModeControls.style.display = 'block';
      this.elements.codeEditorContainer.style.display = 'flex';
      // Refresh editors to fix layout issues when they become visible
      Object.values(this.editors).forEach(editor => editor.refresh());
      this.updateCodePreview();
    }
  }
  
  handleEmojiSelect(e) {
    if (e.target.tagName === 'SPAN') {
      const current = this.elements.emojiSelector.querySelector('.selected');
      if (current) current.classList.remove('selected');
      e.target.classList.add('selected');
      this.updateSimplePreview();
    }
  }

  updateSimplePreview() {
    if (this.selectedEmojis.length === 0) {
      this.elements.livePreview.innerHTML = '<div style="color: var(--text-color); opacity: 0.5;">Sélectionnez des émojis pour voir l\'aperçu</div>';
      return;
    }

    const html = this.generateThemeHTML();
    const css = `
      body { 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        overflow: hidden; 
        margin: 0; 
        padding: 0; 
        width: 100%; 
        height: 100%; 
      }
    `;
    
    this.renderPreview(html, css, '');
  }

  updateCodePreview() {
    const html = this.editors.html.getValue();
    const css = this.editors.css.getValue();
    const js = this.editors.js.getValue();
    this.renderPreview(html, css, js);
  }

  renderPreview(html, css, js) {
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    this.elements.livePreview.innerHTML = '';
    this.elements.livePreview.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}<\/script>
        </body>
      </html>
    `);
    doc.close();
  }

  // --- Utility ---
  debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // --- Emoji Management ---
  async loadEmojis() {
    try {
      const response = await fetch('/api/emojis/all');
      const emojis = await response.json();
      this.availableEmojis = emojis;
      this.displayDefaultEmojis();
    } catch (error) {
      console.error('Failed to load emojis:', error);
      // Fallback to some default emojis
      this.availableEmojis = [
        { name: 'star', char: '⭐', keywords: 'star' },
        { name: 'heart', char: '❤️', keywords: 'heart love' },
        { name: 'sparkles', char: '✨', keywords: 'sparkles magic' },
        { name: 'rocket', char: '🚀', keywords: 'rocket space' },
        { name: 'unicorn', char: '🦄', keywords: 'unicorn magic' }
      ];
      this.displayDefaultEmojis();
    }
  }

  displayDefaultEmojis() {
    if (!this.elements.emojiResults) return;
    
    // Show some popular emojis by default
    const popularEmojis = this.availableEmojis.slice(0, 20);
    this.renderEmojiGrid(popularEmojis);
  }

  async handleEmojiSearch(e) {
    const query = e.target.value.trim();
    
    if (query.length === 0) {
      this.displayDefaultEmojis();
      return;
    }

    if (query.length < 2) return;

    try {
      const response = await fetch(`/api/emojis/search/${encodeURIComponent(query)}`);
      const results = await response.json();
      this.renderEmojiGrid(results.map(r => ({ char: r.emoji, name: r.key, keywords: r.key })));
    } catch (error) {
      console.error('Error searching emojis:', error);
      // Fallback to local search
      const filtered = this.availableEmojis.filter(emoji => 
        emoji.name.toLowerCase().includes(query.toLowerCase()) ||
        emoji.keywords.toLowerCase().includes(query.toLowerCase())
      );
      this.renderEmojiGrid(filtered.slice(0, 20));
    }
  }

  renderEmojiGrid(emojis) {
    if (!this.elements.emojiResults) return;
    
    this.elements.emojiResults.innerHTML = '';
    emojis.forEach(emoji => {
      const span = document.createElement('span');
      span.textContent = emoji.char;
      span.title = emoji.name;
      span.addEventListener('click', () => this.addEmoji(emoji.char));
      this.elements.emojiResults.appendChild(span);
    });
  }

  addEmoji(emojiChar) {
    this.selectedEmojis.push(emojiChar);
    this.updateSelectedEmojisDisplay();
    this.updateSimplePreview();
  }

  removeEmoji(emojiChar) {
    this.selectedEmojis = this.selectedEmojis.filter(e => e !== emojiChar);
    this.updateSelectedEmojisDisplay();
    this.updateSimplePreview();
  }

  updateSelectedEmojisDisplay() {
    if (!this.elements.selectedEmojisDisplay) return;

    this.elements.selectedEmojisDisplay.innerHTML = '';

    if (this.selectedEmojis.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'emoji-placeholder';
      placeholder.textContent = 'Cliquez sur des émojis ci-dessus pour les sélectionner (max 5)';
      this.elements.selectedEmojisDisplay.appendChild(placeholder);
      return;
    }

    this.selectedEmojis.forEach(emoji => {
      const container = document.createElement('div');
      container.className = 'selected-emoji';
      container.textContent = emoji;
      
      const removeBtn = document.createElement('div');
      removeBtn.className = 'remove-emoji';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => this.removeEmoji(emoji));
      
      container.appendChild(removeBtn);
      this.elements.selectedEmojisDisplay.appendChild(container);
    });
  }

  // --- Animation Generation ---
  generateAnimationCSS(animationType) {
    const animations = {
      fall: `
        @keyframes customFall {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .custom-emoji { animation: customFall 8s linear infinite; }
      `,
      float: `
        @keyframes customFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        .custom-emoji { animation: customFloat 4s ease-in-out infinite; }
      `,
      spin: `
        @keyframes customSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .custom-emoji { animation: customSpin 3s linear infinite; }
      `,
      pulse: `
        @keyframes customPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        .custom-emoji { animation: customPulse 2s ease-in-out infinite; }
      `,
      bounce: `
        @keyframes customBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-40px); }
        }
        .custom-emoji { animation: customBounce 1.5s ease-in-out infinite; }
      `,
      sway: `
        @keyframes customSway {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
        .custom-emoji { animation: customSway 3s ease-in-out infinite; }
      `,
      twinkle: `
        @keyframes customTwinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .custom-emoji { animation: customTwinkle 2s ease-in-out infinite; }
      `,
      dance: `
        @keyframes customDance {
          0% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(20px) rotate(10deg); }
          50% { transform: translateX(0) rotate(0deg); }
          75% { transform: translateX(-20px) rotate(-10deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        .custom-emoji { animation: customDance 2s ease-in-out infinite; }
      `
    };

    return animations[animationType] || '';
  }

  generateThemeHTML() {
    const animation = this.elements.animationSelect?.value || 'none';
    const animationCSS = animation !== 'none' ? this.generateAnimationCSS(animation) : '';

    const emojiElements = this.selectedEmojis.map((emoji, index) => `
      <div class="custom-emoji" style="
        position: fixed;
        left: ${Math.random() * 100}vw;
        top: ${Math.random() * 100}vh;
        font-size: 2em;
        z-index: 1;
        animation-delay: ${index * 0.5}s;
      ">${emoji}</div>
    `).join('');

    return `
      <style>
        ${animationCSS}
      </style>
      ${emojiElements}
    `;
  }

  // --- Custom Theme Management ---
  async loadCustomThemes() {
    try {
      const response = await fetch('/api/custom-themes/list');
      const data = await response.json();
      
      if (data.success) {
        const customThemes = data.themes.map(theme => ({
          id: theme.id,
          meta: {
            name: theme.name,
            category: 'custom',
            previewIcon: '🎨'
          },
          html: '', // Will be loaded when needed
          css: '',
          js: ''
        }));
        
        // Add custom themes to the themes array
        this.themes = [...this.themes.filter(t => t.meta.category !== 'custom'), ...customThemes];
      }
    } catch (error) {
      console.error('Failed to load custom themes:', error);
    }
  }

  async saveCustomTheme() {
    const rawName = this.elements.themeNameInput?.value?.trim();
    if (!rawName) {
      UIHelpers.showNotification('Veuillez entrer un nom pour le thème.', 'error');
      return;
    }

    // Check for name collisions, but skip check if we're editing the same theme
    const sanitizedName = rawName.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const registry = window.getThemeRegistry();
    const existingTheme = this.themes.find(t => t.id === sanitizedName);
    
    if (!this.editingThemeId && (registry[sanitizedName] || existingTheme)) {
      UIHelpers.showNotification('Un thème portant ce nom existe déjà. Veuillez en choisir un autre.', 'error');
      return;
    }

    try {
      let html;
      
      // Get HTML content based on current mode
      if (this.elements.simpleModeControls.style.display !== 'none') {
        // Simple mode - generate HTML from emojis
        html = this.generateThemeHTML();
      } else {
        // Code mode - use editor content
        html = this.editors.html.getValue();
      }

      let url, method, body;
      
      if (this.editingThemeId) {
        // Update existing theme
        url = `/api/custom-themes/update`;
        method = 'PUT';
        body = JSON.stringify({
          id: this.editingThemeId,
          name: rawName,
          html: html
        });
      } else {
        // Create new theme
        url = '/api/custom-themes/save';
        method = 'POST';
        body = JSON.stringify({
          name: rawName,
          html: html
        });
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: body
      });

      const data = await response.json();
      
      if (data.success) {
        const action = this.editingThemeId ? 'mis à jour' : 'sauvegardé';
        UIHelpers.showNotification(`Thème ${action} avec succès !`, 'success');
        this.closeThemeCreator();
        await this.loadCustomThemes(); // Reload the theme list
        this.renderThemePreviews(this.elements.themeCategories.querySelector('.active').dataset.category);
      } else {
        UIHelpers.showNotification(`Erreur lors de la sauvegarde: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      UIHelpers.showNotification('Erreur lors de la sauvegarde du thème.', 'error');
    }
  }

  async editCustomTheme(themeId) {
    try {
      // First, get the theme data
      const response = await fetch(`/api/custom-themes/${themeId}`);
      const data = await response.json();
      
      if (!data.success) {
        UIHelpers.showNotification('Impossible de charger le thème pour modification.', 'error');
        return;
      }

      // Close selector and open creator
      this.closeThemeSelector();
      this.openThemeCreator();
      
      // Set the title to indicate editing
      this.elements.creatorTitle.textContent = 'Modifier le Thème';
      
      // Fill the form with existing data
      this.elements.themeNameInput.value = data.name;
      
      // Since we're working with HTML content, switch to code mode
      this.switchMode('code');
      this.editors.html.setValue(data.html || '');
      this.editors.css.setValue('');
      this.editors.js.setValue('');
      
      // Store the original theme ID for updating instead of creating new
      this.editingThemeId = themeId;
      
      // Update the save button to reflect editing
      this.elements.saveThemeBtn.textContent = 'Mettre à jour le thème';
      
      UIHelpers.showNotification('Thème chargé pour modification.', 'info');
      
    } catch (error) {
      console.error('Error loading theme for editing:', error);
      UIHelpers.showNotification('Erreur lors du chargement du thème.', 'error');
    }
  }

  async deleteCustomTheme(themeId) {
    // Show confirmation dialog
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer ce thème ? Cette action est irréversible.');
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/custom-themes/${themeId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        UIHelpers.showNotification('Thème supprimé avec succès !', 'success');
        
        // If this theme was selected, switch back to default
        if (this.selectedTheme === themeId) {
          this.selectTheme('default');
        }
        
        // Reload themes and refresh the display
        await this.loadCustomThemes();
        this.renderThemePreviews(this.elements.themeCategories.querySelector('.active').dataset.category);
      } else {
        UIHelpers.showNotification(`Erreur lors de la suppression: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting theme:', error);
      UIHelpers.showNotification('Erreur lors de la suppression du thème.', 'error');
    }
  }
}
