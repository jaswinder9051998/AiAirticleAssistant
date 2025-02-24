console.log('[ArticleAssistant] Content script loaded - ' + new Date().toISOString());

const ArticleAssistantManager = {
    instance: null,
    initialized: false,
    initializationPromise: null,

    async initialize() {
        console.log('[ArticleAssistant] Starting initialization');
        
        if (this.initializationPromise) {
            console.log('[ArticleAssistant] Initialization already in progress, waiting...');
            return this.initializationPromise;
        }

        this.initializationPromise = new Promise(async (resolve, reject) => {
            try {
                // Wait for DOM to be ready
                if (document.readyState === 'loading') {
                    console.log('[ArticleAssistant] Document loading, waiting for DOMContentLoaded');
                    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
                }
                console.log('[ArticleAssistant] Document ready state:', document.readyState);

                // Create instance
                this.instance = new ArticleAssistant();
                await this.instance.initializeAsync();
                this.initialized = true;
                console.log('[ArticleAssistant] Initialization complete');
                resolve();
            } catch (error) {
                console.error('[ArticleAssistant] Initialization failed:', error);
                reject(error);
            }
        });

        return this.initializationPromise;
    },

    async handleMessage(request, sender, sendResponse) {
        console.log('[ArticleAssistant] Received message:', request.action);
        
        try {
            if (!this.initialized) {
                console.log('[ArticleAssistant] Not initialized, attempting initialization');
                await this.initialize();
            }

            if (!this.instance) {
                throw new Error('Instance not available after initialization');
            }

            let response;
            switch (request.action) {
                case 'test':
                    response = { success: true, message: 'Content script is alive' };
                    break;
                case 'processArticle':
                    console.log('[ArticleAssistant] Processing article request received');
                    await this.instance.processArticle();
                    response = { success: true };
                    break;
                case 'clearHighlights':
                    this.instance.clearHighlights();
                    response = { success: true };
                    break;
                default:
                    throw new Error(`Unknown action: ${request.action}`);
            }

            console.log('[ArticleAssistant] Sending response:', response);
            sendResponse(response);
        } catch (error) {
            console.error('[ArticleAssistant] Error handling message:', error);
            sendResponse({ error: error.message });
        }
    }
};

// Set up message listener
console.log('[ArticleAssistant] Setting up message listener');
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle the message and ensure we keep the message channel open
    ArticleAssistantManager.handleMessage(request, sender, sendResponse);
    return true; // Keep the message channel open
});

class ArticleAssistant {
    constructor() {
        console.log('[ArticleAssistant] Constructor called');
        this.highlights = new Map();
        this.initialized = false;
        this.floatingCard = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.isMinimized = false;
        this.isResizing = false;
        this.currentHandle = null;
        this.resizeStart = { x: 0, y: 0, width: 0, height: 0 };
    }

    async initializeAsync() {
        try {
            this.initialized = true;
            console.log('[ArticleAssistant] Async initialization complete');
        } catch (error) {
            console.error('[ArticleAssistant] Async initialization failed:', error);
            throw error;
        }
    }

    async initMessageListener() {
        return new Promise((resolve) => {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                console.log('[ArticleAssistant] Received message:', request.action);
                
                if (!this.initialized) {
                    console.error('[ArticleAssistant] Not yet initialized');
                    sendResponse({ error: 'Extension not yet initialized' });
                    return true;
                }

                switch (request.action) {
                    case 'extractContent':
                        try {
                            const content = this.extractPageContent();
                            console.log('[ArticleAssistant] Extracted content length:', content.content.length);
                            sendResponse(content);
                        } catch (error) {
                            console.error('[ArticleAssistant] Extract content error:', error);
                            sendResponse({ error: error.message });
                        }
                        break;

                    case 'processArticle':
                        console.log('[ArticleAssistant] Starting article processing');
                        this.processArticle()
                            .then(() => {
                                console.log('[ArticleAssistant] Article processing completed');
                                sendResponse({ success: true });
                            })
                            .catch(error => {
                                console.error('[ArticleAssistant] Processing error:', error);
                                sendResponse({ error: error.message });
                            });
                        return true; // Keep the message channel open

                    case 'clearHighlights':
                        try {
                            this.clearHighlights();
                            sendResponse({ success: true });
                        } catch (error) {
                            console.error('[ArticleAssistant] Clear highlights error:', error);
                            sendResponse({ error: error.message });
                        }
                        break;
                }
                return true;
            });
            
            resolve();
        });
    }

    extractPageContent() {
        // Get selected text if any
        const selection = window.getSelection();
        let selectedText = '';
        if (selection && selection.rangeCount > 0) {
            selectedText = selection.toString().trim();
        }

        // If there's selected text, use that
        if (selectedText) {
            return { content: selectedText, isSelection: true };
        }

        // Otherwise extract the main article content
        const article = document.querySelector('article');
        if (article) {
            return { content: article.innerText, isArticle: true };
        }

        // Fallback to looking for common article containers
        const mainContent = document.querySelector('main') || 
                          document.querySelector('.main-content') ||
                          document.querySelector('#content');
        
        if (mainContent) {
            return { content: mainContent.innerText, isMainContent: true };
        }

        // Last resort: clean the body content
        const cleanedContent = this.cleanPageContent(document.body);
        return { content: cleanedContent, isCleanedBody: true };
    }

    cleanPageContent(element) {
        // Clone the element to avoid modifying the actual page
        const clone = element.cloneNode(true);
        
        // Remove unwanted elements
        const selectorsToRemove = [
            'script', 'style', 'nav', 'header', 'footer', 
            'iframe', 'noscript', '.ad', '.advertisement',
            '.social-share', '.comments', '.sidebar'
        ];
        
        selectorsToRemove.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
        });

        return clone.innerText;
    }

    async processArticle() {
        const content = this.extractPageContent();
        console.log('[ArticleAssistant] Extracted content type:', content.isSelection ? 'selection' : 
                                                                content.isArticle ? 'article' : 
                                                                content.isMainContent ? 'main content' : 'cleaned body');
        console.log('[ArticleAssistant] Content length:', content.content.length);
        
        try {
            console.log('[ArticleAssistant] Sending content to background script');
            const response = await chrome.runtime.sendMessage({
                action: 'processWithLLM',
                content: content
            });

            console.log('[ArticleAssistant] Raw response from background:', response);

            if (response.error) {
                console.error('[ArticleAssistant] Error from background script:', response.error);
                throw new Error(response.error);
            }

            // Validate response
            if (!Array.isArray(response?.points) || typeof response?.summary !== 'string') {
                console.error('[ArticleAssistant] Invalid response format:', response);
                throw new Error('Invalid response format from background script');
            }

            // Create floating card first
            this.createFloatingCard(response.summary, response.points);

            // Process highlights
            for (const point of response.points) {
                const range = this.findTextRange(point);
                if (range) {
                    const highlightEl = document.createElement('span');
                    highlightEl.className = 'article-assistant-highlight';
                    range.surroundContents(highlightEl);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('[ArticleAssistant] Error processing article:', error);
            throw error;
        }
    }

    createFloatingCard(summary, points) {
        // Remove existing card if any
        this.removeFloatingCard();

        // Create the card
        const card = document.createElement('div');
        card.className = 'article-assistant-floating-card';
        
        // Track resize state
        this.isResizing = false;
        this.currentHandle = null;
        this.resizeStart = { x: 0, y: 0, width: 0, height: 0 };

        // Add resize handlers
        const leftHandle = document.createElement('div');
        leftHandle.className = 'article-assistant-resize-handle-left';
        leftHandle.addEventListener('mousedown', (e) => {
            console.log('[ArticleAssistant] Left resize handle mousedown:', {
                mouseX: e.clientX,
                elementLeft: card.getBoundingClientRect().left,
                elementWidth: card.offsetWidth
            });
            this.startResize(e, 'left');
            e.stopPropagation(); // Prevent drag handler from interfering
        });

        const rightHandle = document.createElement('div');
        rightHandle.className = 'article-assistant-resize-handle-right';
        rightHandle.addEventListener('mousedown', (e) => {
            console.log('[ArticleAssistant] Right resize handle mousedown:', {
                mouseX: e.clientX,
                elementRight: card.getBoundingClientRect().right,
                elementWidth: card.offsetWidth
            });
            this.startResize(e, 'right');
            e.stopPropagation();
        });

        const bottomHandle = document.createElement('div');
        bottomHandle.className = 'article-assistant-resize-handle-bottom';
        bottomHandle.addEventListener('mousedown', (e) => {
            console.log('[ArticleAssistant] Bottom resize handle mousedown:', {
                mouseY: e.clientY,
                elementBottom: card.getBoundingClientRect().bottom,
                elementHeight: card.offsetHeight
            });
            this.startResize(e, 'bottom');
            e.stopPropagation();
        });

        // Add debug mousemove listener to document
        document.addEventListener('mousemove', (e) => {
            if (this.isResizing) {
                e.preventDefault();
                
                const deltaX = e.clientX - this.resizeStart.x;
                const deltaY = e.clientY - this.resizeStart.y;
                
                switch (this.currentHandle) {
                    case 'left':
                        // Calculate new width while maintaining right edge position
                        const newWidth = Math.max(200, this.resizeStart.width - deltaX);
                        // Calculate new left position based on initial right edge
                        const newLeft = Math.max(0, this.resizeStart.right - newWidth); // Prevent moving past left edge
                        
                        console.log('[ArticleAssistant] Left resize calculations:', {
                            deltaX,
                            initialRight: this.resizeStart.right,
                            initialLeft: this.resizeStart.left,
                            newWidth,
                            proposedLeft: this.resizeStart.right - newWidth,
                            constrainedLeft: newLeft,
                            viewportWidth: window.innerWidth,
                            currentRight: card.getBoundingClientRect().right
                        });

                        card.style.width = `${newWidth}px`;
                        card.style.left = `${newLeft}px`;
                        break;
                    case 'right':
                        const rightWidth = Math.max(200, this.resizeStart.width + deltaX); // Respect min-width
                        card.style.width = `${rightWidth}px`;
                        break;
                    case 'bottom':
                        const newHeight = Math.max(150, this.resizeStart.height + deltaY); // Respect min-height
                        card.style.height = `${newHeight}px`;
                        break;
                }

                console.log('[ArticleAssistant] After resize update:', {
                    handle: this.currentHandle,
                    mouseX: e.clientX,
                    mouseY: e.clientY,
                    deltaX,
                    deltaY,
                    newWidth: card.offsetWidth,
                    newLeft: card.offsetLeft,
                    newRight: card.getBoundingClientRect().right,
                    viewportWidth: window.innerWidth
                });
            }
        });

        // Add debug mouseup listener to document
        document.addEventListener('mouseup', () => {
            if (this.isResizing) {
                console.log('[ArticleAssistant] Resize ended:', {
                    handle: this.currentHandle,
                    finalWidth: card.offsetWidth,
                    finalHeight: card.offsetHeight
                });
                this.isResizing = false;
                this.currentHandle = null;
            }
        });

        // Add method to start resize
        this.startResize = (e, handle) => {
            this.isResizing = true;
            this.currentHandle = handle;
            const rect = card.getBoundingClientRect();
            this.resizeStart = {
                x: e.clientX,
                y: e.clientY,
                width: card.offsetWidth,
                height: card.offsetHeight,
                right: rect.right, // Store initial right edge position
                left: rect.left   // Store initial left position
            };
            console.log('[ArticleAssistant] Resize started:', {
                handle: handle,
                startX: this.resizeStart.x,
                startY: this.resizeStart.y,
                startWidth: this.resizeStart.width,
                startHeight: this.resizeStart.height,
                startRight: this.resizeStart.right,
                startLeft: this.resizeStart.left,
                viewportWidth: window.innerWidth
            });
        };

        card.appendChild(leftHandle);
        card.appendChild(rightHandle);
        card.appendChild(bottomHandle);

        console.log('[ArticleAssistant] Created floating card with resize handles:', {
            cardWidth: card.offsetWidth,
            cardHeight: card.offsetHeight,
            handles: {
                left: leftHandle.getBoundingClientRect(),
                right: rightHandle.getBoundingClientRect(),
                bottom: bottomHandle.getBoundingClientRect()
            }
        });

        // Create header
        const header = document.createElement('div');
        header.className = 'article-assistant-card-header';
        
        const title = document.createElement('div');
        title.className = 'article-assistant-card-title';
        title.textContent = 'Article Summary';
        
        const controls = document.createElement('div');
        controls.className = 'article-assistant-card-controls';
        
        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'article-assistant-card-button';
        minimizeBtn.innerHTML = '−';
        minimizeBtn.title = 'Minimize';
        minimizeBtn.onclick = () => this.toggleMinimize();
        
        controls.appendChild(minimizeBtn);
        header.appendChild(title);
        header.appendChild(controls);
        
        // Create content
        const content = document.createElement('div');
        content.className = 'article-assistant-card-content';
        
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'article-assistant-summary';
        summaryDiv.textContent = summary;
        
        const pointsList = document.createElement('ul');
        pointsList.className = 'article-assistant-points';
        
        points.forEach((point, index) => {
            const li = document.createElement('li');
            li.className = 'article-assistant-point';
            li.textContent = point;
            li.onclick = () => this.scrollToHighlight(index);
            pointsList.appendChild(li);
        });
        
        content.appendChild(summaryDiv);
        content.appendChild(pointsList);
        
        card.appendChild(header);
        card.appendChild(content);
        
        // Add drag functionality
        this.addDragHandlers(header);
        
        // Store initial size
        this.cardSize = {
            width: card.offsetWidth,
            height: card.offsetHeight
        };
        
        // Add resize observer
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                // Store new size
                this.cardSize = {
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                };
                
                // Update content height to maintain scroll
                const headerHeight = header.offsetHeight;
                content.style.height = `${this.cardSize.height - headerHeight}px`;
            }
        });
        
        this.resizeObserver.observe(card);
        
        document.body.appendChild(card);
        this.floatingCard = card;
    }

    addDragHandlers(header) {
        header.onmousedown = (e) => {
            if (this.isResizing) {
                console.log('[ArticleAssistant] Ignoring drag start due to active resize');
                return;
            }
            console.log('[ArticleAssistant] Starting drag');
            this.isDragging = true;
            const rect = this.floatingCard.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            
            // Prevent text selection while dragging
            e.preventDefault();
        };
        
        document.onmousemove = (e) => {
            if (!this.isDragging) return;
            
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            
            // Keep card within viewport bounds
            const maxX = window.innerWidth - this.floatingCard.offsetWidth;
            const maxY = window.innerHeight - this.floatingCard.offsetHeight;
            
            this.floatingCard.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            this.floatingCard.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        };
        
        document.onmouseup = () => {
            this.isDragging = false;
        };
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.floatingCard.classList.toggle('article-assistant-minimized');
        
        const minimizeBtn = this.floatingCard.querySelector('.article-assistant-card-button');
        minimizeBtn.innerHTML = this.isMinimized ? '+' : '−';
        minimizeBtn.title = this.isMinimized ? 'Maximize' : 'Minimize';
        
        // Store/restore size on minimize/maximize
        if (this.isMinimized) {
            this.savedSize = {
                width: this.floatingCard.style.width,
                height: this.floatingCard.style.height
            };
            this.floatingCard.style.width = 'auto';
            this.floatingCard.style.height = 'auto';
        } else if (this.savedSize) {
            this.floatingCard.style.width = this.savedSize.width;
            this.floatingCard.style.height = this.savedSize.height;
        }
    }

    removeFloatingCard() {
        if (this.floatingCard) {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
            if (this.floatingCard.parentNode) {
                this.floatingCard.parentNode.removeChild(this.floatingCard);
            }
        }
    }

    scrollToHighlight(index) {
        const highlights = document.querySelectorAll('.article-assistant-highlight');
        if (highlights[index]) {
            highlights[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.updateActivePoint(index);
        }
    }

    updateActivePoint(activeIndex) {
        const points = this.floatingCard.querySelectorAll('.article-assistant-point');
        points.forEach((point, index) => {
            point.classList.toggle('active', index === activeIndex);
        });
    }

    findTextRange(text) {
        console.log('[ArticleAssistant] Finding text range for:', text.substring(0, 50) + '...');
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        let found = false;
        while (node = walker.nextNode()) {
            const index = node.textContent.indexOf(text);
            if (index >= 0) {
                found = true;
                console.log('[ArticleAssistant] Found text match in node:', {
                    nodeText: node.textContent.substring(0, 50) + '...',
                    matchIndex: index
                });
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + text.length);
                return range;
            }
        }
        if (!found) {
            console.error('[ArticleAssistant] Text not found in document:', {
                searchText: text.substring(0, 50) + '...',
                documentText: document.body.textContent.substring(0, 200) + '...'
            });
        }
        return null;
    }

    showTooltip(event) {
        const highlight = event.target;
        const summary = highlight.dataset.summary;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'article-assistant-tooltip';
        tooltip.textContent = summary;
        
        // Position the tooltip
        const rect = highlight.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        
        document.body.appendChild(tooltip);
        highlight.tooltip = tooltip;
    }

    hideTooltip(event) {
        const highlight = event.target;
        if (highlight.tooltip) {
            highlight.tooltip.remove();
            highlight.tooltip = null;
        }
    }

    clearHighlights() {
        document.querySelectorAll('.article-assistant-highlight').forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });
        this.removeFloatingCard();
        this.highlights.clear();
    }
}

// Start initialization
if (window.top === window) {
    console.log('[ArticleAssistant] Content script starting in main world');
    ArticleAssistantManager.initialize().catch(error => {
        console.error('[ArticleAssistant] Initial initialization failed:', error);
    });
} else {
    console.log('[ArticleAssistant] Content script running in iframe - skipping initialization');
} 