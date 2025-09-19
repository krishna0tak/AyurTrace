// Enhanced Search Module for All Stakeholders - AyurTrace
// This module provides advanced search functionality with timeline visualization,
// batch details, and responsive design for all stakeholder dashboards

(function() {
    'use strict';

    // Enhanced Search Module
    window.EnhancedSearch = {
        // Configuration
        config: {
            enableQRScan: true,
            enableImageViewer: true,
            enableExport: true,
            autoRefresh: true,
            cacheTimeout: 30000, // 30 seconds
            animations: true
        },

        // Cache for search results
        cache: new Map(),

        // Initialize enhanced search
        init(containerId, options = {}) {
            this.config = { ...this.config, ...options };
            this.containerId = containerId;
            this.render();
            this.setupEventListeners();
            console.log('✅ Enhanced Search initialized for container:', containerId);
        },

        // Render the enhanced search interface
        render() {
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.error('❌ Enhanced Search container not found:', this.containerId);
                return;
            }

            container.innerHTML = `
                <div class="enhanced-search-wrapper">
                    <!-- Search Header -->
                    <div class="search-header">
                        <h2><i class="fas fa-search-plus"></i> Advanced Batch Search & Timeline</h2>
                        <p>Search for batch IDs to view complete supply chain history with real-time blockchain data</p>
                    </div>

                    <!-- Search Input Section -->
                    <div class="search-input-section">
                        <div class="search-input-group">
                            <div class="input-wrapper">
                                <input type="text" 
                                       id="enhancedSearchInput" 
                                       class="enhanced-search-input" 
                                       placeholder="Enter Batch ID (e.g., BATCH_1758262005200)"
                                       autocomplete="off">
                                <div class="input-icons">
                                    <i class="fas fa-search search-icon"></i>
                                </div>
                            </div>
                            <div class="search-actions">
                                <button type="button" id="enhancedSearchBtn" class="btn-search-primary">
                                    <i class="fas fa-search"></i> Search
                                </button>
                                ${this.config.enableQRScan ? `
                                <button type="button" id="enhancedQRBtn" class="btn-search-secondary">
                                    <i class="fas fa-qrcode"></i> Scan QR
                                </button>
                                ` : ''}
                                <button type="button" id="enhancedClearBtn" class="btn-search-clear">
                                    <i class="fas fa-times"></i> Clear
                                </button>
                            </div>
                        </div>
                        
                        <!-- Quick Search Suggestions -->
                        <div id="searchSuggestions" class="search-suggestions hidden">
                            <div class="suggestions-header">Recent Searches:</div>
                            <div id="suggestionsList" class="suggestions-list"></div>
                        </div>
                    </div>

                    <!-- Search Results Section -->
                    <div id="searchResultsSection" class="search-results-section">
                        
                        <!-- Batch Summary Card -->
                        <div id="batchSummaryCard" class="batch-summary-card hidden">
                            <div class="summary-header">
                                <h3><i class="fas fa-cube"></i> Batch Summary</h3>
                                <div class="summary-actions">
                                    ${this.config.enableExport ? `
                                    <button id="exportBtn" class="btn-export">
                                        <i class="fas fa-download"></i> Export
                                    </button>
                                    ` : ''}
                                    <button id="refreshBtn" class="btn-refresh">
                                        <i class="fas fa-sync-alt"></i> Refresh
                                    </button>
                                </div>
                            </div>
                            <div id="batchSummaryContent" class="summary-content"></div>
                        </div>

                        <!-- Timeline Visualization -->
                        <div id="timelineSection" class="timeline-section">
                            <div class="timeline-header">
                                <h3><i class="fas fa-timeline"></i> Supply Chain Timeline</h3>
                                <div class="timeline-filter">
                                    <select id="timelineFilter" class="timeline-filter-select">
                                        <option value="all">All Events</option>
                                        <option value="BatchCreated">Batch Creation</option>
                                        <option value="CollectionAdded">Collection</option>
                                        <option value="InspectionAdded">Inspection</option>
                                        <option value="ProductCreated">Manufacturing</option>
                                        <option value="ProductDispatched">Distribution</option>
                                    </select>
                                </div>
                            </div>
                            <div id="timelineContent" class="timeline-content">
                                <div class="timeline-placeholder">
                                    <i class="fas fa-search" style="font-size: 48px; color: #cbd5e1; margin-bottom: 16px;"></i>
                                    <h4>No Search Results</h4>
                                    <p>Enter a Batch ID above to view the complete supply chain timeline</p>
                                </div>
                            </div>
                        </div>

                        <!-- Related Batches -->
                        <div id="relatedBatchesSection" class="related-batches-section hidden">
                            <h3><i class="fas fa-link"></i> Related Batches</h3>
                            <div id="relatedBatchesContent" class="related-batches-content"></div>
                        </div>
                    </div>

                    <!-- QR Scanner Modal -->
                    ${this.config.enableQRScan ? this.renderQRScannerModal() : ''}

                    <!-- Image Viewer Modal -->
                    ${this.config.enableImageViewer ? this.renderImageViewerModal() : ''}
                </div>

                <!-- Enhanced Search Styles -->
                <style>
                    .enhanced-search-wrapper {
                        background: #ffffff;
                        border-radius: 16px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                        margin-bottom: 24px;
                    }

                    .search-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 24px;
                        text-align: center;
                    }

                    .search-header h2 {
                        margin: 0 0 8px 0;
                        font-size: 24px;
                        font-weight: 600;
                    }

                    .search-header p {
                        margin: 0;
                        opacity: 0.9;
                        font-size: 14px;
                    }

                    .search-input-section {
                        padding: 24px;
                        background: #f8fafc;
                        border-bottom: 1px solid #e2e8f0;
                    }

                    .search-input-group {
                        display: flex;
                        gap: 12px;
                        align-items: center;
                        flex-wrap: wrap;
                    }

                    .input-wrapper {
                        position: relative;
                        flex: 1;
                        min-width: 300px;
                    }

                    .enhanced-search-input {
                        width: 100%;
                        padding: 16px 48px 16px 16px;
                        border: 2px solid #e2e8f0;
                        border-radius: 12px;
                        font-size: 16px;
                        background: white;
                        transition: all 0.3s ease;
                    }

                    .enhanced-search-input:focus {
                        outline: none;
                        border-color: #667eea;
                        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                    }

                    .input-icons {
                        position: absolute;
                        right: 16px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #94a3b8;
                    }

                    .search-actions {
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                    }

                    .btn-search-primary, .btn-search-secondary, .btn-search-clear {
                        padding: 16px 20px;
                        border: none;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 14px;
                    }

                    .btn-search-primary {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }

                    .btn-search-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                    }

                    .btn-search-secondary {
                        background: #10b981;
                        color: white;
                    }

                    .btn-search-secondary:hover {
                        background: #059669;
                        transform: translateY(-2px);
                    }

                    .btn-search-clear {
                        background: #ef4444;
                        color: white;
                    }

                    .btn-search-clear:hover {
                        background: #dc2626;
                        transform: translateY(-2px);
                    }

                    .search-suggestions {
                        margin-top: 12px;
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    }

                    .suggestions-header {
                        padding: 12px 16px;
                        background: #f8fafc;
                        border-bottom: 1px solid #e2e8f0;
                        font-weight: 600;
                        font-size: 12px;
                        color: #64748b;
                        text-transform: uppercase;
                    }

                    .suggestions-list {
                        padding: 8px 0;
                    }

                    .suggestion-item {
                        padding: 8px 16px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: #64748b;
                        font-size: 14px;
                    }

                    .suggestion-item:hover {
                        background: #f1f5f9;
                        color: #334155;
                    }

                    .search-results-section {
                        padding: 24px;
                    }

                    .batch-summary-card {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        margin-bottom: 24px;
                        overflow: hidden;
                    }

                    .summary-header {
                        background: white;
                        padding: 20px;
                        border-bottom: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .summary-header h3 {
                        margin: 0;
                        color: #1f2937;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .summary-actions {
                        display: flex;
                        gap: 8px;
                    }

                    .btn-export, .btn-refresh {
                        padding: 8px 12px;
                        border: none;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        transition: all 0.2s ease;
                    }

                    .btn-export {
                        background: #3b82f6;
                        color: white;
                    }

                    .btn-refresh {
                        background: #10b981;
                        color: white;
                    }

                    .summary-content {
                        padding: 20px;
                    }

                    .timeline-section {
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        overflow: hidden;
                    }

                    .timeline-header {
                        background: #f8fafc;
                        padding: 20px;
                        border-bottom: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .timeline-header h3 {
                        margin: 0;
                        color: #1f2937;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .timeline-filter-select {
                        padding: 8px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        background: white;
                        font-size: 14px;
                    }

                    .timeline-content {
                        padding: 24px;
                        min-height: 300px;
                    }

                    .timeline-placeholder {
                        text-align: center;
                        color: #64748b;
                        padding: 40px 0;
                    }

                    .timeline-placeholder h4 {
                        margin: 0 0 8px 0;
                        font-size: 18px;
                    }

                    .timeline-placeholder p {
                        margin: 0;
                        font-size: 14px;
                    }

                    .timeline-item {
                        display: flex;
                        gap: 16px;
                        margin-bottom: 24px;
                        position: relative;
                    }

                    .timeline-item::before {
                        content: '';
                        position: absolute;
                        left: 24px;
                        top: 48px;
                        bottom: -24px;
                        width: 2px;
                        background: #e2e8f0;
                    }

                    .timeline-item:last-child::before {
                        display: none;
                    }

                    .timeline-icon {
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        position: relative;
                        z-index: 1;
                    }

                    .timeline-content-item {
                        flex: 1;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 20px;
                    }

                    .timeline-title {
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 8px;
                        font-size: 16px;
                    }

                    .timeline-timestamp {
                        color: #64748b;
                        font-size: 12px;
                        margin-bottom: 12px;
                    }

                    .timeline-details {
                        color: #475569;
                        font-size: 14px;
                        line-height: 1.5;
                    }

                    .timeline-image {
                        margin-top: 12px;
                    }

                    .timeline-image img {
                        width: 80px;
                        height: 80px;
                        object-fit: cover;
                        border-radius: 8px;
                        border: 2px solid #e2e8f0;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }

                    .timeline-image img:hover {
                        transform: scale(1.05);
                        border-color: #667eea;
                    }

                    .related-batches-section {
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 20px;
                        margin-top: 24px;
                    }

                    .related-batches-section h3 {
                        margin: 0 0 16px 0;
                        color: #1f2937;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .related-batch-item {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 16px;
                        margin-bottom: 12px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }

                    .related-batch-item:hover {
                        background: #f1f5f9;
                        border-color: #667eea;
                    }

                    .loading-spinner {
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        border: 2px solid #f3f3f3;
                        border-top: 2px solid #667eea;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    .hidden {
                        display: none !important;
                    }

                    .btn-loading {
                        opacity: 0.7;
                        pointer-events: none;
                    }

                    /* Responsive Design */
                    @media (max-width: 768px) {
                        .search-input-group {
                            flex-direction: column;
                            align-items: stretch;
                        }

                        .input-wrapper {
                            min-width: auto;
                        }

                        .search-actions {
                            justify-content: center;
                        }

                        .summary-header, .timeline-header {
                            flex-direction: column;
                            gap: 12px;
                            align-items: flex-start;
                        }

                        .timeline-item {
                            flex-direction: column;
                            gap: 12px;
                        }

                        .timeline-item::before {
                            display: none;
                        }
                    }
                </style>
            `;
        },

        // Render QR Scanner Modal
        renderQRScannerModal() {
            return `
                <div id="qrScannerModal" class="modal-overlay hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3><i class="fas fa-qrcode"></i> Scan QR Code</h3>
                            <button id="closeQRModal" class="btn-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div id="qrScannerContainer">
                                <video id="qrVideo" class="qr-video"></video>
                                <div id="qrScannerStatus" class="scanner-status">
                                    <p>Position QR code within the frame</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    }

                    .modal-content {
                        background: white;
                        border-radius: 12px;
                        max-width: 500px;
                        width: 90%;
                        max-height: 80vh;
                        overflow: hidden;
                    }

                    .modal-header {
                        background: #f8fafc;
                        padding: 20px;
                        border-bottom: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .modal-header h3 {
                        margin: 0;
                        color: #1f2937;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .btn-close {
                        background: none;
                        border: none;
                        font-size: 18px;
                        color: #64748b;
                        cursor: pointer;
                        padding: 4px;
                    }

                    .modal-body {
                        padding: 20px;
                    }

                    .qr-video {
                        width: 100%;
                        height: 300px;
                        object-fit: cover;
                        border-radius: 8px;
                        background: #f1f5f9;
                    }

                    .scanner-status {
                        text-align: center;
                        margin-top: 16px;
                        color: #64748b;
                    }
                </style>
            `;
        },

        // Render Image Viewer Modal
        renderImageViewerModal() {
            return `
                <div id="imageViewerModal" class="modal-overlay hidden">
                    <div class="modal-content modal-large">
                        <div class="modal-header">
                            <h3><i class="fas fa-image"></i> Batch Image</h3>
                            <button id="closeImageModal" class="btn-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div id="imageViewerContainer">
                                <img id="fullSizeImage" class="full-size-image" alt="Batch Image">
                                <div id="imageDetails" class="image-details"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .modal-large {
                        max-width: 80vw;
                        max-height: 90vh;
                    }

                    .full-size-image {
                        width: 100%;
                        height: auto;
                        max-height: 60vh;
                        object-fit: contain;
                        border-radius: 8px;
                    }

                    .image-details {
                        margin-top: 16px;
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        font-size: 14px;
                        color: #64748b;
                    }
                </style>
            `;
        },

        // Setup Event Listeners
        setupEventListeners() {
            const searchInput = document.getElementById('enhancedSearchInput');
            const searchBtn = document.getElementById('enhancedSearchBtn');
            const qrBtn = document.getElementById('enhancedQRBtn');
            const clearBtn = document.getElementById('enhancedClearBtn');
            const refreshBtn = document.getElementById('refreshBtn');
            const exportBtn = document.getElementById('exportBtn');
            const timelineFilter = document.getElementById('timelineFilter');

            // Search functionality
            if (searchBtn) {
                searchBtn.addEventListener('click', () => this.handleSearch());
            }

            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleSearch();
                    }
                });

                searchInput.addEventListener('input', () => {
                    this.showSuggestions();
                });
            }

            // QR Scanner
            if (qrBtn) {
                qrBtn.addEventListener('click', () => this.openQRScanner());
            }

            // Clear search
            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearSearch());
            }

            // Refresh data
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => this.refreshCurrentSearch());
            }

            // Export functionality
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportResults());
            }

            // Timeline filter
            if (timelineFilter) {
                timelineFilter.addEventListener('change', () => this.filterTimeline());
            }

            // Modal event listeners
            this.setupModalEventListeners();
        },

        // Setup Modal Event Listeners
        setupModalEventListeners() {
            // QR Scanner modal
            const closeQRModal = document.getElementById('closeQRModal');
            const qrModal = document.getElementById('qrScannerModal');

            if (closeQRModal && qrModal) {
                closeQRModal.addEventListener('click', () => this.closeQRScanner());
                qrModal.addEventListener('click', (e) => {
                    if (e.target === qrModal) this.closeQRScanner();
                });
            }

            // Image viewer modal
            const closeImageModal = document.getElementById('closeImageModal');
            const imageModal = document.getElementById('imageViewerModal');

            if (closeImageModal && imageModal) {
                closeImageModal.addEventListener('click', () => this.closeImageViewer());
                imageModal.addEventListener('click', (e) => {
                    if (e.target === imageModal) this.closeImageViewer();
                });
            }
        },

        // Handle Search
        async handleSearch() {
            const searchInput = document.getElementById('enhancedSearchInput');
            const searchBtn = document.getElementById('enhancedSearchBtn');
            
            if (!searchInput || !searchBtn) return;

            const batchId = searchInput.value.trim();
            if (!batchId) {
                this.showError('Please enter a Batch ID');
                return;
            }

            // Add to search history
            this.addToSearchHistory(batchId);

            // Show loading state
            this.setLoadingState(true);

            try {
                await window.Blockchain.init();
                console.log(`🔍 Enhanced Search: Searching for batch ${batchId}`);

                const results = await window.Blockchain.searchBatchInBlockchain(batchId);
                
                if (!results || !results.found) {
                    this.showNoResults(batchId);
                    return;
                }

                this.displayResults(results);
                this.currentBatchId = batchId;
                this.currentResults = results;

            } catch (error) {
                console.error('Enhanced Search Error:', error);
                this.showError(`Search failed: ${error.message}`);
            } finally {
                this.setLoadingState(false);
            }
        },

        // Display Search Results
        displayResults(results) {
            this.displayBatchSummary(results.details);
            this.displayTimeline(results.chain);
            this.displayRelatedBatches(results.related || []);

            // Show result sections
            document.getElementById('batchSummaryCard').classList.remove('hidden');
            if (results.related && results.related.length > 0) {
                document.getElementById('relatedBatchesSection').classList.remove('hidden');
            }
        },

        // Display Batch Summary
        displayBatchSummary(details) {
            const content = document.getElementById('batchSummaryContent');
            if (!content || !details) return;

            const statusNames = ['Pending', 'In Transit', 'Delivered', 'Processing'];
            const status = statusNames[details.status] || 'Unknown';
            const timestamp = details.timestamp ? new Date(Number(details.timestamp) * 1000) : null;

            content.innerHTML = `
                <div class="batch-info-grid">
                    <div class="info-card">
                        <div class="info-label">Batch ID</div>
                        <div class="info-value">${details.batchId || 'N/A'}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Crop Type</div>
                        <div class="info-value">${details.cropType || 'N/A'}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Quantity</div>
                        <div class="info-value">${details.quantity || 'N/A'} kg</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Status</div>
                        <div class="info-value">
                            <span class="status-badge status-${status.toLowerCase().replace(' ', '-')}">${status}</span>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Harvest Date</div>
                        <div class="info-value">${details.harvestDate || 'N/A'}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Farm Location</div>
                        <div class="info-value">${this.parseFarmLocation(details.farmLocation)}</div>
                    </div>
                    ${details.farmerName ? `
                    <div class="info-card">
                        <div class="info-label">Farmer</div>
                        <div class="info-value">${details.farmerName}</div>
                    </div>
                    ` : ''}
                    ${timestamp ? `
                    <div class="info-card">
                        <div class="info-label">Created</div>
                        <div class="info-value">${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}</div>
                    </div>
                    ` : ''}
                </div>

                <style>
                    .batch-info-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 16px;
                    }

                    .info-card {
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 16px;
                    }

                    .info-label {
                        font-size: 12px;
                        font-weight: 600;
                        color: #64748b;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                    }

                    .info-value {
                        font-size: 14px;
                        color: #1f2937;
                        font-weight: 500;
                    }

                    .status-badge {
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                    }

                    .status-pending { background: #fef3c7; color: #92400e; }
                    .status-in-transit { background: #dbeafe; color: #1d4ed8; }
                    .status-delivered { background: #d1fae5; color: #047857; }
                    .status-processing { background: #f3e8ff; color: #7c2d12; }
                </style>
            `;
        },

        // Display Timeline
        displayTimeline(chain) {
            const timelineContent = document.getElementById('timelineContent');
            if (!timelineContent) return;

            if (!chain || chain.length === 0) {
                timelineContent.innerHTML = `
                    <div class="timeline-placeholder">
                        <i class="fas fa-timeline" style="font-size: 48px; color: #cbd5e1; margin-bottom: 16px;"></i>
                        <h4>No Timeline Events</h4>
                        <p>This batch hasn't progressed through the supply chain yet</p>
                    </div>
                `;
                return;
            }

            const timelineHTML = chain.map((event, index) => {
                const icon = this.getEventIcon(event.fragment?.name || event.eventName);
                const timestamp = this.parseTimestamp(event);
                const details = this.formatEventDetails(event);

                return `
                    <div class="timeline-item" data-event-type="${event.fragment?.name || event.eventName}">
                        <div class="timeline-icon" style="background: ${this.getEventColor(event.fragment?.name || event.eventName)}">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="timeline-content-item">
                            <div class="timeline-title">${this.getEventTitle(event.fragment?.name || event.eventName)}</div>
                            ${timestamp ? `<div class="timeline-timestamp">${timestamp}</div>` : ''}
                            <div class="timeline-details">${details}</div>
                            ${this.renderEventImage(event)}
                        </div>
                    </div>
                `;
            }).join('');

            timelineContent.innerHTML = timelineHTML;
        },

        // Get Event Icon
        getEventIcon(eventName) {
            const icons = {
                'BatchCreated': 'fa-seedling',
                'BatchCreatedV2': 'fa-seedling',
                'CollectionAdded': 'fa-truck-pickup',
                'InspectionAdded': 'fa-search-plus',
                'ProductCreated': 'fa-industry',
                'ProductReceived': 'fa-box',
                'ProductDispatched': 'fa-shipping-fast'
            };
            return icons[eventName] || 'fa-circle';
        },

        // Get Event Color
        getEventColor(eventName) {
            const colors = {
                'BatchCreated': 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                'BatchCreatedV2': 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                'CollectionAdded': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                'InspectionAdded': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                'ProductCreated': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                'ProductReceived': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                'ProductDispatched': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            };
            return colors[eventName] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        },

        // Get Event Title
        getEventTitle(eventName) {
            const titles = {
                'BatchCreated': 'Batch Created',
                'BatchCreatedV2': 'Batch Created',
                'CollectionAdded': 'Crop Collected',
                'InspectionAdded': 'Quality Inspection',
                'ProductCreated': 'Product Manufactured',
                'ProductReceived': 'Product Received',
                'ProductDispatched': 'Product Dispatched'
            };
            return titles[eventName] || eventName;
        },

        // Parse Timestamp
        parseTimestamp(event) {
            const timestamp = event.args?.timestamp || event.args?.collectionDate || event.args?.date;
            if (!timestamp) return null;

            const ts = Number(timestamp);
            const date = new Date(ts * (ts > 1e12 ? 1 : 1000));
            return date.toLocaleString();
        },

        // Format Event Details
        formatEventDetails(event) {
            if (!event.args) return 'Event recorded on blockchain';

            const eventName = event.fragment?.name || event.eventName;
            
            switch (eventName) {
                case 'BatchCreated':
                case 'BatchCreatedV2':
                    return `Crop: ${event.args.cropType || 'Unknown'} • Quantity: ${event.args.quantity || 'N/A'} kg • Location: ${this.parseFarmLocation(event.args.farmLocation)}`;
                
                case 'CollectionAdded':
                    return `Collected by: ${event.args.collectorId || 'Unknown'} • Farmer: ${event.args.farmerId || 'Unknown'}`;
                
                case 'InspectionAdded':
                    return `Inspector: ${event.args.inspectorId || 'Unknown'} • Result: ${event.args.result || 'Unknown'} • Notes: ${event.args.notes || 'None'}`;
                
                case 'ProductCreated':
                    return `Product: ${event.args.productType || 'Unknown'} • Manufacturer: ${event.args.manufacturerId || 'Unknown'}`;
                
                case 'ProductReceived':
                    return `Herb: ${event.args.herbType || 'Unknown'} • Quantity: ${event.args.quantity || 'N/A'} kg • Storage: ${event.args.storageLocation || 'Unknown'}`;
                
                case 'ProductDispatched':
                    return `Quantity: ${event.args.quantityDispatched || 'N/A'} kg • Destination: ${event.args.destination || 'Unknown'}`;
                
                default:
                    return this.formatGenericEventArgs(event.args);
            }
        },

        // Format Generic Event Args
        formatGenericEventArgs(args) {
            const filtered = Object.entries(args)
                .filter(([key, value]) => {
                    const k = key.toLowerCase();
                    return !k.includes('hash') && !k.includes('owner') && !k.includes('address');
                })
                .map(([key, value]) => {
                    let val = value;
                    if (typeof value === 'bigint') val = value.toString();
                    return `${key}: ${val}`;
                })
                .slice(0, 3)
                .join(' • ');
            
            return filtered || 'Event recorded on blockchain';
        },

        // Render Event Image
        renderEventImage(event) {
            if (!event.args) return '';

            let imageHash = null;
            
            // Check for photo hash in various fields
            if (event.args.photoHash && event.args.photoHash !== '0x' + '0'.repeat(64)) {
                imageHash = event.args.photoHash;
            }

            // Check for IPFS hash in farm location metadata
            if (!imageHash && event.args.farmLocation) {
                const meta = this.parseFarmLocationMeta(event.args.farmLocation);
                if (meta.ipfs) {
                    imageHash = meta.ipfs;
                }
            }

            if (!imageHash || !window.Blockchain?.getImageUrl) return '';

            const imageUrl = window.Blockchain.getImageUrl(imageHash);
            
            return `
                <div class="timeline-image">
                    <img src="${imageUrl}" 
                         alt="Event Image" 
                         onclick="EnhancedSearch.showFullImage('${imageHash}', '${imageUrl}')"
                         title="Click to view full image">
                    <span style="margin-left: 8px; color: #3b82f6; cursor: pointer; font-size: 12px;" 
                          onclick="EnhancedSearch.showFullImage('${imageHash}', '${imageUrl}')">
                        <i class="fas fa-expand"></i> View Full
                    </span>
                </div>
            `;
        },

        // Parse Farm Location
        parseFarmLocation(farmLocation) {
            if (!farmLocation) return 'Unknown';
            
            const parts = farmLocation.split('::');
            if (parts.length > 0) {
                return parts[0]; // Return the base location
            }
            
            return farmLocation;
        },

        // Parse Farm Location Metadata
        parseFarmLocationMeta(farmLocation) {
            if (!farmLocation) return {};
            
            const meta = {};
            const parts = farmLocation.split('::');
            
            if (parts.length > 0) meta.base = parts[0];
            
            for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                if (part.startsWith('FARMER=')) {
                    meta.farmer = part.substring(7);
                } else if (part.startsWith('IPFS=')) {
                    meta.ipfs = part.substring(5);
                }
            }
            
            return meta;
        },

        // Show Full Image
        showFullImage(hash, url) {
            const modal = document.getElementById('imageViewerModal');
            const image = document.getElementById('fullSizeImage');
            const details = document.getElementById('imageDetails');
            
            if (!modal || !image) return;

            image.src = url;
            if (details) {
                details.innerHTML = `<strong>IPFS Hash:</strong> ${hash}`;
            }
            
            modal.classList.remove('hidden');
        },

        // Close Image Viewer
        closeImageViewer() {
            const modal = document.getElementById('imageViewerModal');
            if (modal) {
                modal.classList.add('hidden');
            }
        },

        // Display Related Batches
        displayRelatedBatches(related) {
            const content = document.getElementById('relatedBatchesContent');
            if (!content || !related || related.length === 0) return;

            const relatedHTML = related.map(batch => `
                <div class="related-batch-item" onclick="EnhancedSearch.searchRelated('${batch.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: #1f2937;">${batch.id}</div>
                            <div style="font-size: 12px; color: #64748b;">${batch.cropType || 'Unknown'} • ${batch.quantity || 'N/A'} kg</div>
                        </div>
                        <i class="fas fa-external-link-alt" style="color: #64748b;"></i>
                    </div>
                </div>
            `).join('');

            content.innerHTML = relatedHTML;
        },

        // Search Related Batch
        searchRelated(batchId) {
            const searchInput = document.getElementById('enhancedSearchInput');
            if (searchInput) {
                searchInput.value = batchId;
                this.handleSearch();
            }
        },

        // Show Suggestions
        showSuggestions() {
            const input = document.getElementById('enhancedSearchInput');
            const suggestions = document.getElementById('searchSuggestions');
            const suggestionsList = document.getElementById('suggestionsList');
            
            if (!input || !suggestions || !suggestionsList) return;

            const query = input.value.trim().toLowerCase();
            const history = this.getSearchHistory();
            
            if (query.length < 2 || history.length === 0) {
                suggestions.classList.add('hidden');
                return;
            }

            const filtered = history.filter(item => 
                item.toLowerCase().includes(query)
            ).slice(0, 5);

            if (filtered.length === 0) {
                suggestions.classList.add('hidden');
                return;
            }

            suggestionsList.innerHTML = filtered.map(item => `
                <div class="suggestion-item" onclick="EnhancedSearch.selectSuggestion('${item}')">
                    <i class="fas fa-history"></i>
                    ${item}
                </div>
            `).join('');

            suggestions.classList.remove('hidden');
        },

        // Select Suggestion
        selectSuggestion(batchId) {
            const input = document.getElementById('enhancedSearchInput');
            const suggestions = document.getElementById('searchSuggestions');
            
            if (input) {
                input.value = batchId;
                this.handleSearch();
            }
            
            if (suggestions) {
                suggestions.classList.add('hidden');
            }
        },

        // Search History Management
        addToSearchHistory(batchId) {
            const history = this.getSearchHistory();
            const filtered = history.filter(item => item !== batchId);
            filtered.unshift(batchId);
            
            localStorage.setItem('enhancedSearchHistory', JSON.stringify(filtered.slice(0, 10)));
        },

        getSearchHistory() {
            try {
                return JSON.parse(localStorage.getItem('enhancedSearchHistory') || '[]');
            } catch {
                return [];
            }
        },

        // QR Scanner Methods
        openQRScanner() {
            if (!this.config.enableQRScan) return;
            
            const modal = document.getElementById('qrScannerModal');
            if (!modal) return;

            modal.classList.remove('hidden');
            this.startQRScanner();
        },

        async startQRScanner() {
            try {
                const video = document.getElementById('qrVideo');
                const status = document.getElementById('qrScannerStatus');
                
                if (!video || !window.jsQR) return;

                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                
                video.srcObject = stream;
                video.play();

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                const scanFrame = () => {
                    if (video.readyState === video.HAVE_ENOUGH_DATA) {
                        canvas.height = video.videoHeight;
                        canvas.width = video.videoWidth;
                        context.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        
                        if (code) {
                            this.handleQRCode(code.data);
                            return;
                        }
                    }
                    
                    if (!this.qrScannerStopped) {
                        requestAnimationFrame(scanFrame);
                    }
                };

                this.qrScannerStopped = false;
                scanFrame();

            } catch (error) {
                console.error('QR Scanner Error:', error);
                document.getElementById('qrScannerStatus').innerHTML = 
                    '<p style="color: #ef4444;">Camera access denied or not available</p>';
            }
        },

        handleQRCode(data) {
            console.log('QR Code detected:', data);
            
            // Extract batch ID from QR code data
            let batchId = data;
            
            // If it's a URL, try to extract batch ID
            if (data.includes('batch=') || data.includes('BATCH_')) {
                const match = data.match(/BATCH_\d+/);
                if (match) {
                    batchId = match[0];
                }
            }

            // Set search input and trigger search
            const searchInput = document.getElementById('enhancedSearchInput');
            if (searchInput) {
                searchInput.value = batchId;
            }

            this.closeQRScanner();
            this.handleSearch();
        },

        closeQRScanner() {
            const modal = document.getElementById('qrScannerModal');
            const video = document.getElementById('qrVideo');
            
            this.qrScannerStopped = true;
            
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }
            
            if (modal) {
                modal.classList.add('hidden');
            }
        },

        // Filter Timeline
        filterTimeline() {
            const filter = document.getElementById('timelineFilter');
            const timeline = document.getElementById('timelineContent');
            
            if (!filter || !timeline) return;

            const selectedFilter = filter.value;
            const items = timeline.querySelectorAll('.timeline-item');

            items.forEach(item => {
                const eventType = item.getAttribute('data-event-type');
                
                if (selectedFilter === 'all' || eventType === selectedFilter) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        },

        // Clear Search
        clearSearch() {
            const searchInput = document.getElementById('enhancedSearchInput');
            const timelineContent = document.getElementById('timelineContent');
            const batchSummary = document.getElementById('batchSummaryCard');
            const relatedBatches = document.getElementById('relatedBatchesSection');
            const suggestions = document.getElementById('searchSuggestions');

            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }

            if (timelineContent) {
                timelineContent.innerHTML = `
                    <div class="timeline-placeholder">
                        <i class="fas fa-search" style="font-size: 48px; color: #cbd5e1; margin-bottom: 16px;"></i>
                        <h4>No Search Results</h4>
                        <p>Enter a Batch ID above to view the complete supply chain timeline</p>
                    </div>
                `;
            }

            if (batchSummary) batchSummary.classList.add('hidden');
            if (relatedBatches) relatedBatches.classList.add('hidden');
            if (suggestions) suggestions.classList.add('hidden');

            this.currentBatchId = null;
            this.currentResults = null;
        },

        // Refresh Current Search
        refreshCurrentSearch() {
            if (this.currentBatchId) {
                // Clear cache for this batch
                this.cache.delete(this.currentBatchId);
                
                // Re-search
                const searchInput = document.getElementById('enhancedSearchInput');
                if (searchInput) {
                    searchInput.value = this.currentBatchId;
                    this.handleSearch();
                }
            }
        },

        // Export Results
        exportResults() {
            if (!this.currentResults) return;

            const data = {
                batchId: this.currentBatchId,
                timestamp: new Date().toISOString(),
                batchDetails: this.currentResults.details,
                timeline: this.currentResults.chain,
                relatedBatches: this.currentResults.related || []
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `batch_${this.currentBatchId}_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
        },

        // Show Error
        showError(message) {
            const timelineContent = document.getElementById('timelineContent');
            if (!timelineContent) return;

            timelineContent.innerHTML = `
                <div class="timeline-placeholder">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444; margin-bottom: 16px;"></i>
                    <h4 style="color: #ef4444;">Error</h4>
                    <p>${message}</p>
                </div>
            `;
        },

        // Show No Results
        showNoResults(batchId) {
            const timelineContent = document.getElementById('timelineContent');
            if (!timelineContent) return;

            timelineContent.innerHTML = `
                <div class="timeline-placeholder">
                    <i class="fas fa-search-minus" style="font-size: 48px; color: #f59e0b; margin-bottom: 16px;"></i>
                    <h4>No Results Found</h4>
                    <p>No blockchain events found for batch: <strong>${batchId}</strong></p>
                    <div style="margin-top: 16px; font-size: 14px; color: #64748b;">
                        <p>• Verify the batch ID is correct</p>
                        <p>• Check if the batch has been created</p>
                        <p>• Ensure blockchain connection is active</p>
                    </div>
                </div>
            `;
        },

        // Set Loading State
        setLoadingState(loading) {
            const searchBtn = document.getElementById('enhancedSearchBtn');
            const timelineContent = document.getElementById('timelineContent');

            if (searchBtn) {
                if (loading) {
                    searchBtn.disabled = true;
                    searchBtn.innerHTML = '<div class="loading-spinner"></div> Searching...';
                    searchBtn.classList.add('btn-loading');
                } else {
                    searchBtn.disabled = false;
                    searchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
                    searchBtn.classList.remove('btn-loading');
                }
            }

            if (loading && timelineContent) {
                timelineContent.innerHTML = `
                    <div class="timeline-placeholder">
                        <div class="loading-spinner" style="margin-bottom: 16px; width: 48px; height: 48px; border-width: 4px;"></div>
                        <h4>Searching Blockchain...</h4>
                        <p>Retrieving supply chain data for your batch</p>
                    </div>
                `;
            }
        }
    };

    console.log('✅ Enhanced Search Module loaded successfully');
})();
