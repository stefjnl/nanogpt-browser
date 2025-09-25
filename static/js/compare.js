/**
 * Model Cost Comparison - JavaScript
 * Leaderboard for comparing AI model pricing across providers
 */

class CostComparison {
    constructor() {
        this.models = [];
        this.filteredModels = [];
        this.currentSort = 'cost';
        this.currentProviderFilter = 'all';

        this.initializeElements();
        this.bindEvents();
        this.loadComparisonData();
    }

    initializeElements() {
        // Containers
        this.leaderboardContainer = document.getElementById('leaderboardContainer');
        this.leaderboardContent = document.getElementById('leaderboardContent');
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.emptyState = document.getElementById('emptyState');

        // Controls
        this.sortSelect = document.getElementById('sortSelect');
        this.providerFilter = document.getElementById('providerFilter');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.retryBtn = document.getElementById('retryBtn');

        // Stats
        this.modelCount = document.getElementById('modelCount');
        this.avgCost = document.getElementById('avgCost');
    }

    bindEvents() {
        // Sort and filter events
        this.sortSelect.addEventListener('change', (e) => {
            this.handleSort(e.target.value);
        });

        this.providerFilter.addEventListener('change', (e) => {
            this.currentProviderFilter = e.target.value;
            this.applyFilters();
        });

        // Button events
        this.refreshBtn.addEventListener('click', () => this.loadComparisonData());
        this.retryBtn.addEventListener('click', () => this.loadComparisonData());
    }

    async loadComparisonData() {
        try {
            this.showLoading();

            const response = await fetch('/api/compare/models');
            const data = await response.json();

            if (data.success) {
                this.models = data.data;
                this.applyFilters();
                this.updateStats();
                this.hideError();
            } else {
                this.showError(data.error || 'Failed to load comparison data');
            }
        } catch (error) {
            console.error('Error loading comparison data:', error);
            this.showError('Network error. Please check your connection.');
        }
    }

    applyFilters() {
        // Apply provider filter
        if (this.currentProviderFilter === 'all') {
            this.filteredModels = [...this.models];
        } else if (this.currentProviderFilter === 'openrouter') {
            this.filteredModels = this.models.filter(model => model.provider === 'openrouter');
        } else if (this.currentProviderFilter === 'nanogpt') {
            this.filteredModels = this.models.filter(model => model.provider === 'nanogpt');
        }

        // Apply current sorting
        this.applySorting(this.currentSort);
        this.renderLeaderboard();
    }

    handleSort(sortType) {
        this.currentSort = sortType;
        this.applySorting(sortType);
        this.renderLeaderboard();
    }

    applySorting(sortType) {
        this.filteredModels.sort((a, b) => {
            switch (sortType) {
                case 'cost':
                    return this.getCostValue(a) - this.getCostValue(b);
                case 'cost-desc':
                    return this.getCostValue(b) - this.getCostValue(a);
                case 'provider':
                    return a.provider.localeCompare(b.provider);
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });
    }

    getCostValue(model) {
        // Handle free models (null, undefined, or 0 pricing)
        if (!model.pricing || model.pricing.completion === null || model.pricing.completion === undefined || model.pricing.completion === 0) {
            return 0; // Free models have cost of 0
        }
        return parseFloat(model.pricing.completion);
    }

    getCostCategory(cost) {
        if (cost === 0) return 'free'; // Free models
        if (cost < 0.001) return 'cheap';
        if (cost < 0.01) return 'medium';
        return 'expensive';
    }

    getValueScore(model) {
        const cost = this.getCostValue(model);
        const context = model.context_length || 4096;

        // Handle free models with infinite value score
        if (cost === 0) {
            return { score: '∞', category: 'high' };
        }

        // Simple scoring: higher context length and lower cost = better score
        const score = (context / 1000) / (cost * 1000);

        if (score > 100) return { score: score.toFixed(0), category: 'high' };
        if (score > 10) return { score: score.toFixed(0), category: 'medium' };
        return { score: score.toFixed(0), category: 'low' };
    }

    renderLeaderboard() {
        if (this.filteredModels.length === 0) {
            this.showEmpty();
            return;
        }

        this.hideEmpty();
        this.hideLoading();

        const leaderboardHtml = this.filteredModels.map((model, index) => {
            const cost = this.getCostValue(model);
            const costCategory = this.getCostCategory(cost);
            const valueScore = this.getValueScore(model);

            return `
                <div class="leaderboard-item fade-in">
                    <div class="leaderboard-column">
                        <div class="rank-badge ${index < 3 ? `rank-${index + 1}` : 'rank-other'}">
                            ${index + 1}
                        </div>
                    </div>
                    <div class="leaderboard-column">
                        <div class="model-info">
                            <div class="model-name">${model.name || model.id}</div>
                            <div class="model-id">${model.id}</div>
                        </div>
                    </div>
                    <div class="leaderboard-column">
                        <div class="provider-badge provider-${model.provider}">
                            ${model.provider.toUpperCase()}
                        </div>
                    </div>
                    <div class="leaderboard-column">
                        <div class="cost-value cost-${costCategory}">
                            ${cost === 0 ? 'FREE' : '$' + cost.toFixed(6)}
                        </div>
                    </div>
                    <div class="leaderboard-column">
                        <div class="context-length">
                            ${(model.context_length || 'N/A').toLocaleString()}
                        </div>
                    </div>
                    <div class="leaderboard-column">
                        <div class="score-badge ${valueScore.category === 'high' && valueScore.score === '∞' ? 'score-infinite' : `score-${valueScore.category}`}">
                            ${valueScore.score}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.leaderboardContent.innerHTML = leaderboardHtml;
        this.leaderboardContainer.style.display = 'block';
    }

    updateStats() {
        const totalModels = this.models.length;
        const totalCost = this.models.reduce((sum, model) => sum + this.getCostValue(model), 0);
        const avgCost = totalModels > 0 ? totalCost / totalModels : 0;

        this.modelCount.textContent = totalModels.toLocaleString();
        this.avgCost.textContent = `$${avgCost.toFixed(6)}`;
    }

    showLoading() {
        this.loadingState.style.display = 'flex';
        this.errorState.style.display = 'none';
        this.emptyState.style.display = 'none';
        this.leaderboardContainer.style.display = 'none';
        this.leaderboardContent.innerHTML = '';
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
        this.leaderboardContainer.style.display = 'none';
    }

    hideEmpty() {
        this.emptyState.style.display = 'none';
    }
}

// Initialize the comparison when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CostComparison();
});