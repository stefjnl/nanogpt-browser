/**
 * NanoGPT Model Browser - JavaScript
 * Modern web application for browsing AI models
 */

class ModelBrowser {
    constructor() {
        this.models = [];
        this.filteredModels = [];
        this.currentView = 'grid';
        this.searchTimeout = null;
        this.autoRefreshInterval = null;

        this.initializeElements();
        this.bindEvents();
        this.loadModels();
        this.initializeSettings();
    }

    initializeElements() {
        // Main containers
        this.modelsGrid = document.getElementById('modelsGrid');
        this.modelsList = document.getElementById('modelsList');
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.emptyState = document.getElementById('emptyState');

        // Controls
        this.searchInput = document.getElementById('searchInput');
        this.filterSelect = document.getElementById('filterSelect');
        this.gridViewBtn = document.getElementById('gridViewBtn');
        this.listViewBtn = document.getElementById('listViewBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.retryBtn = document.getElementById('retryBtn');

        // Sorting
        this.currentSort = 'name';
        this.currentSortOrder = 'asc';

        // Modals
        this.modelModal = document.getElementById('modelModal');
        this.settingsModal = document.getElementById('settingsModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalContent = document.getElementById('modalContent');
        this.modalLoading = document.getElementById('modalLoading');
        this.closeModal = document.getElementById('closeModal');

        // Settings
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
        this.clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
        this.autoRefresh = document.getElementById('autoRefresh');
        this.closeSettingsModal = document.getElementById('closeSettingsModal');
    }

    bindEvents() {
        // Search and filter events
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 300);
        });

        this.filterSelect.addEventListener('change', (e) => {
            this.handleFilter(e.target.value);
        });

        // Add event listeners for sortable headers
        this.bindSortableHeaders();

        // View toggle events
        this.gridViewBtn.addEventListener('click', () => this.setView('grid'));
        this.listViewBtn.addEventListener('click', () => this.setView('list'));

        // Button events
        this.refreshBtn.addEventListener('click', () => this.loadModels());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.retryBtn.addEventListener('click', () => this.loadModels());

        // Modal events
        this.closeModal.addEventListener('click', () => this.hideModelModal());
        this.closeSettingsModal.addEventListener('click', () => this.hideSettings());

        // Settings events
        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.clearApiKeyBtn.addEventListener('click', () => this.clearApiKey());

        // Modal backdrop clicks
        this.modelModal.addEventListener('click', (e) => {
            if (e.target === this.modelModal) this.hideModelModal();
        });

        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.hideSettings();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModelModal();
                this.hideSettings();
            }
        });

        // Auto-refresh toggle
        this.autoRefresh.addEventListener('change', (e) => {
            this.toggleAutoRefresh(e.target.checked);
        });
    }

    async loadModels() {
        try {
            this.showLoading();

            const response = await fetch('/api/models');
            const data = await response.json();

            if (data.success) {
                this.models = data.data.data || [];
                this.filteredModels = [...this.models];
                this.renderModels();
                this.hideError();
            } else {
                this.showError(data.error || 'Failed to load models');
            }
        } catch (error) {
            console.error('Error loading models:', error);
            this.showError('Network error. Please check your connection.');
        }
    }

    renderModels() {
        if (this.filteredModels.length === 0) {
            this.showEmpty();
            return;
        }

        this.hideEmpty();
        this.hideLoading();

        const modelsHtml = this.filteredModels.map(model => this.createModelCard(model)).join('');

        // Render grid view
        this.modelsGrid.innerHTML = modelsHtml;

        // Render list view with header
        const listHeaderHtml = this.createListHeader();
        this.modelsList.innerHTML = listHeaderHtml + modelsHtml;

        // Bind model card events
        this.bindModelCardEvents();

        // Bind sortable headers
        this.bindSortableHeaders();

        // Update sort indicators
        this.updateSortIndicators();
    }

    createListHeader() {
        return `
            <div class="list-header">
                <div class="list-header-item sortable" data-sort="name">
                    <span>Name</span>
                    <span class="sort-indicator" id="sort-name">↕️</span>
                </div>
                <div class="list-header-item sortable" data-sort="created">
                    <span>Created</span>
                    <span class="sort-indicator" id="sort-created">↕️</span>
                </div>
                <div class="list-header-item sortable" data-sort="owned_by">
                    <span>Provider</span>
                    <span class="sort-indicator" id="sort-owned_by">↕️</span>
                </div>
                <div class="list-header-item sortable" data-sort="context_length">
                    <span>Context</span>
                    <span class="sort-indicator" id="sort-context_length">↕️</span>
                </div>
                <div class="list-header-item sortable" data-sort="pricing">
                    <span>Pricing</span>
                    <span class="sort-indicator" id="sort-pricing">↕️</span>
                </div>
            </div>
        `;
    }

    createModelCard(model) {
        // Fix date formatting - handle both timestamp and ISO string formats
        let createdDate;
        if (typeof model.created === 'number') {
            // Unix timestamp
            createdDate = new Date(model.created * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } else {
            // ISO string or other format
            createdDate = new Date(model.created).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        const modelType = this.getModelType(model.id);
        const contextLength = model.context_length ? model.context_length.toLocaleString() : 'N/A';
        const isCheap = model.cost_estimate?.cheap ? '💰' : '💎';

        const cardHtml = `
            <div class="model-card fade-in" data-model-id="${model.id}">
                <div class="model-card-header">
                    <div class="model-id">${model.name || model.id}</div>
                    <div class="model-type">${modelType}</div>
                </div>
                <div class="model-meta">
                    <div class="meta-item">
                        <div class="meta-label">Created</div>
                        <div class="meta-value">${createdDate}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Provider</div>
                        <div class="meta-value">${model.owned_by}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Context</div>
                        <div class="meta-value">${contextLength} tokens</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Pricing</div>
                        <div class="meta-value">${isCheap} ${this.formatPricing(model.pricing)}</div>
                    </div>
                </div>
            </div>
        `;

        return cardHtml;
    }

    bindModelCardEvents() {
        const modelCards = document.querySelectorAll('.model-card');
        modelCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const modelId = card.dataset.modelId;
                this.showModelDetails(modelId);
            });
        });
    }

    async showModelDetails(modelId) {
        try {
            this.modalTitle.textContent = 'Loading...';
            this.modalContent.style.display = 'none';
            this.modalLoading.style.display = 'block';
            this.modelModal.style.display = 'flex';

            const response = await fetch(`/api/models/${modelId}`);
            const data = await response.json();

            if (data.success) {
                this.renderModelDetails(data.data);
            } else {
                this.modalTitle.textContent = 'Error';
                this.showModalError('Failed to load model details');
            }
        } catch (error) {
            console.error('Error loading model details:', error);
            this.modalTitle.textContent = 'Error';
            this.showModalError('Network error loading model details');
        }
    }

    renderModelDetails(model) {
        this.modalTitle.textContent = model.name || model.id;
        this.modalLoading.style.display = 'none';
        this.modalContent.style.display = 'block';

        // Fix date formatting
        let createdDate;
        if (typeof model.created === 'number') {
            createdDate = new Date(model.created * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            createdDate = new Date(model.created).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        const modelType = this.getModelType(model.id);
        const contextLength = model.context_length ? model.context_length.toLocaleString() : 'N/A';
        const description = model.description || 'No description available';
        const isCheap = model.cost_estimate?.cheap ? '💰 Budget-friendly' : '💎 Premium';

        // Build capabilities list
        const capabilities = [];
        if (model.capabilities) {
            if (model.capabilities.vision) capabilities.push('Vision');
            capabilities.push('Text Generation');
            capabilities.push('Chat');
        } else {
            capabilities.push('Text Generation', 'Chat');
        }

        const detailHtml = `
            <div class="model-detail-grid">
                <div class="detail-item">
                    <label>Model Name</label>
                    <span>${model.name || model.id}</span>
                </div>
                <div class="detail-item">
                    <label>Description</label>
                    <span>${description}</span>
                </div>
                <div class="detail-item">
                    <label>Provider</label>
                    <span>${model.owned_by}</span>
                </div>
                <div class="detail-item">
                    <label>Created</label>
                    <span>${createdDate}</span>
                </div>
                <div class="detail-item">
                    <label>Context Length</label>
                    <span>${contextLength} tokens</span>
                </div>
                <div class="detail-item">
                    <label>Pricing Tier</label>
                    <span>${isCheap}</span>
                </div>
                <div class="detail-item">
                    <label>Pricing Details</label>
                    <span>${this.formatPricing(model.pricing)}</span>
                </div>
                <div class="detail-item">
                    <label>Capabilities</label>
                    <div class="capabilities-list">
                        ${capabilities.map(cap => `<div class="capability-tag">${cap}</div>`).join('')}
                    </div>
                </div>
            </div>
        `;

        this.modalContent.innerHTML = detailHtml;
    }

    showModalError(message) {
        this.modalLoading.style.display = 'none';
        this.modalContent.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Failed to load model details</h3>
                <p>${message}</p>
            </div>
        `;
        this.modalContent.style.display = 'block';
    }

    hideModelModal() {
        this.modelModal.style.display = 'none';
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();

        if (searchTerm === '') {
            this.filteredModels = [...this.models];
        } else {
            this.filteredModels = this.models.filter(model => {
                const name = (model.name || model.id).toLowerCase();
                const id = model.id.toLowerCase();
                const description = (model.description || '').toLowerCase();
                const provider = model.owned_by.toLowerCase();

                return name.includes(searchTerm) ||
                       id.includes(searchTerm) ||
                       description.includes(searchTerm) ||
                       provider.includes(searchTerm);
            });
        }

        // Apply current sorting
        this.applySorting(this.currentSort, this.currentSortOrder);
        this.renderModels();
    }

    bindSortableHeaders() {
        // Re-bind sortable headers after rendering
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                const sortBy = header.dataset.sort;
                this.handleSort(sortBy);
            });
        });
    }

    handleSort(sortBy) {
        // If clicking the same column, toggle order
        if (this.currentSort === sortBy) {
            this.currentSortOrder = this.currentSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort = sortBy;
            this.currentSortOrder = 'asc';
        }

        this.applySorting(this.currentSort, this.currentSortOrder);
        this.updateSortIndicators();
        this.renderModels();
    }

    updateSortIndicators() {
        // Reset all indicators
        document.querySelectorAll('.sort-indicator').forEach(indicator => {
            indicator.textContent = '↕️';
        });

        // Update current sort indicator
        const currentIndicator = document.getElementById(`sort-${this.currentSort}`);
        if (currentIndicator) {
            const headerItem = currentIndicator.closest('.list-header-item');
            headerItem.classList.remove('sort-asc', 'sort-desc');
            headerItem.classList.add(`sort-${this.currentSortOrder}`);

            currentIndicator.textContent = this.currentSortOrder === 'asc' ? '↑' : '↓';
        }
    }

    handleFilter(filterType) {
        if (filterType === 'all') {
            this.filteredModels = [...this.models];
        } else {
            this.filteredModels = this.models.filter(model => {
                const modelType = this.getModelType(model.id);
                return modelType.toLowerCase() === filterType;
            });
        }

        // Apply current sorting
        this.applySorting(this.currentSort, this.currentSortOrder);
        this.renderModels();
    }

    handleSort(sortBy, sortOrder) {
        this.applySorting(sortBy, sortOrder);
        this.renderModels();
    }

    applySorting(sortBy, sortOrder) {
        this.filteredModels.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'name':
                    valueA = (a.name || a.id).toLowerCase();
                    valueB = (b.name || b.id).toLowerCase();
                    break;

                case 'created':
                    valueA = this.parseDate(a.created);
                    valueB = this.parseDate(b.created);
                    break;

                case 'owned_by':
                    valueA = a.owned_by.toLowerCase();
                    valueB = b.owned_by.toLowerCase();
                    break;

                case 'context_length':
                    valueA = a.context_length || 0;
                    valueB = b.context_length || 0;
                    break;

                case 'pricing':
                    valueA = this.getPricingValue(a.pricing);
                    valueB = this.getPricingValue(b.pricing);
                    break;

                default:
                    return 0;
            }

            if (valueA < valueB) {
                return sortOrder === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    parseDate(dateValue) {
        if (typeof dateValue === 'number') {
            return dateValue; // Unix timestamp
        } else {
            return new Date(dateValue).getTime(); // ISO string or other format
        }
    }

    getPricingValue(pricing) {
        if (!pricing || !pricing.completion) return 0;
        return pricing.completion; // Sort by completion price
    }

    setView(viewType) {
        this.currentView = viewType;

        if (viewType === 'grid') {
            this.modelsGrid.style.display = 'grid';
            this.modelsList.style.display = 'none';
            this.gridViewBtn.classList.add('active');
            this.listViewBtn.classList.remove('active');
        } else {
            this.modelsGrid.style.display = 'none';
            this.modelsList.style.display = 'grid';
            this.gridViewBtn.classList.remove('active');
            this.listViewBtn.classList.add('active');
        }
    }

    getModelType(modelId) {
        if (modelId.includes('chatgpt') || modelId.includes('gpt')) {
            return 'ChatGPT';
        } else if (modelId.includes('claude')) {
            return 'Claude';
        } else if (modelId.includes('gemini')) {
            return 'Gemini';
        } else if (modelId.includes('deepseek')) {
            return 'DeepSeek';
        } else {
            return 'Other';
        }
    }

    formatPricing(pricing) {
        if (!pricing) return 'N/A';

        const prompt = pricing.prompt ? `$${pricing.prompt.toLocaleString()}` : '0';
        const completion = pricing.completion ? `$${pricing.completion.toLocaleString()}` : '0';
        const unit = pricing.unit || 'per_million_tokens';

        if (unit === 'per_million_tokens') {
            return `${prompt}/${completion} per MTok`;
        }
        return `${prompt}/${completion} ${unit}`;
    }

    showLoading() {
        this.loadingState.style.display = 'flex';
        this.errorState.style.display = 'none';
        this.emptyState.style.display = 'none';
        this.modelsGrid.innerHTML = '';
        this.modelsList.innerHTML = '';
    }

    hideLoading() {
        this.loadingState.style.display = 'none';
    }

    showError(message) {
        this.hideLoading();
        this.errorState.style.display = 'flex';
        document.getElementById('errorMessage').textContent = message;
    }

    hideError() {
        this.errorState.style.display = 'none';
    }

    showEmpty() {
        this.hideLoading();
        this.emptyState.style.display = 'flex';
    }

    hideEmpty() {
        this.emptyState.style.display = 'none';
    }

    showSettings() {
        this.settingsModal.style.display = 'flex';
        this.loadCurrentSettings();
    }

    hideSettings() {
        this.settingsModal.style.display = 'none';
    }

    loadCurrentSettings() {
        // Load API key from localStorage (masked)
        const savedApiKey = localStorage.getItem('nanogpt_api_key');
        if (savedApiKey) {
            this.apiKeyInput.value = '••••••••••••••••••••••••••••••••';
        }

        // Load auto-refresh setting
        const autoRefresh = localStorage.getItem('auto_refresh') === 'true';
        this.autoRefresh.checked = autoRefresh;
    }

    saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();

        if (apiKey && apiKey !== '••••••••••••••••••••••••••••••••') {
            localStorage.setItem('nanogpt_api_key', apiKey);
            this.showNotification('API key saved successfully!', 'success');
            this.apiKeyInput.value = '••••••••••••••••••••••••••••••••';
        } else {
            this.showNotification('Please enter a valid API key', 'error');
        }
    }

    clearApiKey() {
        localStorage.removeItem('nanogpt_api_key');
        this.apiKeyInput.value = '';
        this.showNotification('API key cleared', 'info');
    }

    toggleAutoRefresh(enabled) {
        localStorage.setItem('auto_refresh', enabled);

        if (enabled) {
            this.startAutoRefresh();
            this.showNotification('Auto-refresh enabled', 'success');
        } else {
            this.stopAutoRefresh();
            this.showNotification('Auto-refresh disabled', 'info');
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh(); // Clear any existing interval
        this.autoRefreshInterval = setInterval(() => {
            this.loadModels();
        }, 30000); // Refresh every 30 seconds
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    initializeSettings() {
        // Load settings on startup
        const autoRefresh = localStorage.getItem('auto_refresh') === 'true';
        if (autoRefresh) {
            this.startAutoRefresh();
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            background: type === 'success' ? '#10b981' :
                      type === 'error' ? '#ef4444' :
                      type === 'info' ? '#6366f1' : '#64748b'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ModelBrowser();
});

// Add some CSS for notifications
const notificationStyles = `
.notification {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(10px);
}
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);