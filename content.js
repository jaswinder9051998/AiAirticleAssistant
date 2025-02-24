console.log('[ArticleAssistant] Content script loaded - ' + new Date().toISOString());

// Add CSS injection function
function injectStyles() {
    const styles = `
        .article-assistant-floating-card {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 500px;
            background: #FFFFFF;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            z-index: 999999;
            resize: none;
            overflow: hidden;
            min-height: 200px;
        }

        .article-assistant-floating-card:hover {
            resize: both;
        }

        .article-assistant-floating-card::after {
            content: '';
            position: absolute;
            bottom: 0;
            right: 0;
            width: 15px;
            height: 15px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #ccc 50%);
            border-radius: 0 0 8px 0;
        }

        .article-assistant-card-header {
            background: #1A1A1A;
            padding: 16px 20px;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .article-assistant-card-title {
            font-size: 16px;
            font-weight: 600;
            color: #FFFFFF;
        }

        .article-assistant-card-content {
            padding: 20px;
            overflow-y: auto;
            max-height: calc(85vh - 60px);
        }

        .article-assistant-qa-pair {
            margin-bottom: 24px;
            padding: 16px;
            background: #F8F9FA;
            border-radius: 8px;
            border: 1px solid #E0E6ED;
        }

        .article-assistant-question {
            font-weight: 600;
            color: #1A1A1A;
            margin-bottom: 12px;
            font-size: 15px;
            line-height: 1.5;
        }

        .article-assistant-answer {
            color: #333333;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
        }

        .article-assistant-quotes-section {
            border-top: 1px solid #E5E5E5;
            margin-top: 24px;
            padding-top: 24px;
        }

        .article-assistant-quotes-section h3 {
            font-size: 15px;
            font-weight: 600;
            color: #1A1A1A;
            margin: 0 0 16px 0;
        }

        .article-assistant-points {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .article-assistant-point {
            padding: 12px 16px;
            margin: 8px 0;
            background: #F5F5F5;
            border-radius: 6px;
            font-size: 14px;
            color: #333333;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .article-assistant-point:hover {
            background: #EEEEEE;
        }

        .article-assistant-highlight {
            background: rgba(255, 255, 0, 0.3);
            border-bottom: 1px solid rgba(255, 200, 0, 0.5);
        }

        .article-assistant-card-button {
            background: none;
            border: none;
            color: #FFFFFF;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
        }

        .article-assistant-card-button:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .article-assistant-resize-handle {
            position: absolute;
            top: 0;
            width: 10px;
            height: 100%;
            cursor: se-resize;
            z-index: 1000000;
        }

        .article-assistant-resize-handle.left {
            left: 0;
        }

        .article-assistant-resize-handle.right {
            right: 0;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

const ArticleAssistantManager = {
    instance: null,
    initialized: false,
    initializationPromise: null,

    async initialize() {
        console.log('[ArticleAssistant] Starting initialization with details:', {
            documentState: document.readyState,
            hasBody: !!document.body,
            url: window.location.href,
            timestamp: new Date().toISOString()
        });
        
        if (this.initializationPromise) {
            console.log('[ArticleAssistant] Initialization already in progress, waiting...');
            return this.initializationPromise;
        }

        this.initializationPromise = new Promise(async (resolve, reject) => {
            try {
                // Inject styles first
                injectStyles();
                
                // Wait for DOM to be ready
                if (document.readyState === 'loading') {
                    console.log('[ArticleAssistant] Waiting for DOMContentLoaded');
                    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
                }
                
                console.log('[ArticleAssistant] DOM ready state achieved:', {
                    finalState: document.readyState,
                    bodyElements: document.body.children.length,
                    articlePresent: !!document.querySelector('article'),
                    mainPresent: !!document.querySelector('main')
                });

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
    if (request.action === 'log') {
        // Write to console with consistent prefix
        console[request.logType]('[ArticleAssistant]', request.logData);
        return true;
    }
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
        
        // Add onAskButtonClick handler
        this.onAskButtonClick = () => {
            console.log('[ArticleAssistant] Ask button clicked, creating question box');
            this.createAndShowQuestionBox();
        };
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
        console.log('[ArticleAssistant] Starting content extraction');
        
        // Get selected text if any
        const selection = window.getSelection();
        let selectedText = '';
        if (selection && selection.rangeCount > 0) {
            selectedText = selection.toString().trim();
            if (selectedText) {
                console.log('[ArticleAssistant] Found selected text:', selectedText.substring(0, 100) + '...');
                return { content: selectedText, isSelection: true };
            }
        }

        // Use Readability for article extraction
        try {
            // Clone the document to avoid modifying the original
            const documentClone = document.cloneNode(true);
            
            // Create a new Readability object
            const reader = new Readability(documentClone, {
                debug: false,
                charThreshold: 20
            });
            
            // Parse the content
            const article = reader.parse();
            
            if (article && article.textContent) {
                console.log('[ArticleAssistant] Successfully extracted article:', {
                    title: article.title,
                    byline: article.byline,
                    length: article.textContent.length
                });
                
                return {
                    content: article.textContent,
                    isArticle: true,
                    metadata: {
                        title: article.title,
                        byline: article.byline,
                        excerpt: article.excerpt
                    }
                };
            }
        } catch (error) {
            console.error('[ArticleAssistant] Readability extraction failed:', error);
        }

        // Fallback to basic content extraction if Readability fails
        console.log('[ArticleAssistant] Falling back to basic content extraction');
        const mainContent = document.querySelector('article') || 
                          document.querySelector('main') || 
                          document.querySelector('[role="main"]');
        
        if (mainContent) {
            return { 
                content: mainContent.innerText,
                isArticle: true
            };
        }

        // Final fallback to body content
        return { 
            content: document.body.innerText,
            isCleanedBody: true
        };
    }

    extractTextContent(element) {
        // Clone to avoid modifying the page
        const clone = element.cloneNode(true);
        
        // Remove unwanted elements
        const selectorsToRemove = [
            'script', 'style', 'noscript', 'iframe',
            'nav', 'header:not(article header)', 'footer:not(article footer)',
            '.ad', '.advertisement', '.social-share',
            '.comments', '.sidebar', '.related-articles',
            'button', '[role="button"]', '[data-ad]',
            '.newsletter', '.subscription', '.popup',
            'aside', '.aside', '[aria-hidden="true"]'
        ];
        
        selectorsToRemove.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Extract text content while preserving some structure
        const textParts = [];
        const walker = document.createTreeWalker(
            clone,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
            null,
            false
        );

        let node;
        let lastWasBlock = false;
        while (node = walker.nextNode()) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const display = window.getComputedStyle(node).display;
                if (display === 'block' || display === 'list-item') {
                    if (!lastWasBlock) {
                        textParts.push('\n');
                        lastWasBlock = true;
                    }
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) {
                    textParts.push(text);
                    lastWasBlock = false;
                }
            }
        }

        return textParts.join(' ').replace(/\s+/g, ' ').trim();
    }

    findLargestTextBlock() {
        const blocks = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ELEMENT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            // Skip hidden elements
            if (node.offsetParent === null) continue;
            
            // Get direct text content
            const text = Array.from(node.childNodes)
                .filter(child => child.nodeType === Node.TEXT_NODE)
                .map(child => child.textContent.trim())
                .join(' ');
                
            if (text.length > 100) { // Minimum threshold for a text block
                blocks.push({
                    element: node,
                    textLength: text.length,
                    depth: this.getNodeDepth(node)
                });
            }
        }

        // Sort by text length and depth (prefer shallower nodes with more text)
        blocks.sort((a, b) => {
            const lengthDiff = b.textLength - a.textLength;
            if (lengthDiff !== 0) return lengthDiff;
            return a.depth - b.depth;
        });

        if (blocks.length > 0) {
            return this.extractTextContent(blocks[0].element);
        }
        return null;
    }

    getNodeDepth(node) {
        let depth = 0;
        let current = node;
        while (current.parentNode) {
            depth++;
            current = current.parentNode;
        }
        return depth;
    }

    cleanPageContent(element) {
        // Clone the element to avoid modifying the actual page
        const clone = element.cloneNode(true);
        
        // Log initial state
        console.log('[ArticleAssistant] Cleaning page content:', {
            originalLength: element.innerText.length,
            elementsToRemove: [
                'script', 'style', 'nav', 'header', 'footer', 
                'iframe', 'noscript', '.ad', '.advertisement',
                '.social-share', '.comments', '.sidebar'
            ].join(', ')
        });
        
        // Remove unwanted elements
        const selectorsToRemove = [
            'script', 'style', 'nav', 'header', 'footer', 
            'iframe', 'noscript', '.ad', '.advertisement',
            '.social-share', '.comments', '.sidebar'
        ];
        
        let removedCount = 0;
        selectorsToRemove.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => {
                el.remove();
                removedCount++;
            });
        });

        console.log('[ArticleAssistant] Content cleaning complete:', {
            elementsRemoved: removedCount,
            finalLength: clone.innerText.length
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
                    try {
                        // NEW: Always highlight using individual text nodes within the range
                        const nodes = this.getTextNodesInRange(range);
                        const startNode = range.startContainer;
                        const endNode = range.endContainer;
                        const startOffset = range.startOffset;
                        const endOffset = range.endOffset;
                        for (const node of nodes) {
                            const nodeText = node.textContent;
                            let highlightStart = 0;
                            let highlightEnd = nodeText.length;
                            if (node === startNode) {
                                highlightStart = startOffset;
                            }
                            if (node === endNode) {
                                highlightEnd = endOffset;
                            }
                            if (highlightStart < highlightEnd) {
                                const nodeRange = document.createRange();
                                nodeRange.setStart(node, highlightStart);
                                nodeRange.setEnd(node, highlightEnd);
                                const highlightEl = document.createElement('span');
                                highlightEl.className = 'article-assistant-highlight';
                                nodeRange.surroundContents(highlightEl);
                            }
                        }
                    } catch (error) {
                        console.error('[ArticleAssistant] Error creating highlight:', error);
                    }
                }
            }

            return { success: true };
        } catch (error) {
            console.error('[ArticleAssistant] Error processing article:', error);
            throw error;
        }
    }

    // Add new helper method to get text nodes in a range
    getTextNodesInRange(range) {
        const nodes = [];
        const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (range.intersectsNode(node)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            nodes.push(node);
        }
        return nodes;
    }

    createFloatingCard(summary, points) {
        // Remove existing card if any
        this.removeFloatingCard();

        // Create the card with inline styles as backup
        const card = document.createElement('div');
        card.className = 'article-assistant-floating-card';
        Object.assign(card.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '500px',
            background: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            zIndex: '999999',
            resize: 'none',
            overflow: 'hidden',
            minHeight: '200px'
        });

        // Add resize handles
        const leftHandle = document.createElement('div');
        leftHandle.className = 'article-assistant-resize-handle left';
        leftHandle.style.cssText = `
            position: absolute !important;
            left: -5px !important;
            top: 0 !important;
            width: 10px !important;
            height: 100% !important;
            cursor: ew-resize !important;
            z-index: 1000000 !important;
            background: transparent !important;
            opacity: 0 !important;
        `;

        const rightHandle = document.createElement('div');
        rightHandle.className = 'article-assistant-resize-handle right';
        rightHandle.style.cssText = `
            position: absolute !important;
            right: -5px !important;
            top: 0 !important;
            width: 10px !important;
            height: 100% !important;
            cursor: ew-resize !important;
            z-index: 1000000 !important;
            background: transparent !important;
            opacity: 0 !important;
        `;

        // Add resize event listeners
        [leftHandle, rightHandle].forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();  // Prevent drag handler from interfering
                this.isResizing = true;
                this.currentHandle = handle;
                this.resizeStart = {
                    x: e.clientX,
                    width: card.offsetWidth,
                    left: card.offsetLeft
                };
            });
        });

        // Update the mousemove handler to be more responsive
        const mouseMoveHandler = (e) => {
            if (!this.isResizing) return;
            
            e.preventDefault();
            const deltaX = e.clientX - this.resizeStart.x;
            const isLeft = this.currentHandle.classList.contains('left');

            if (isLeft) {
                // When dragging left edge, keep right edge anchored
                const newWidth = Math.max(0, this.resizeStart.width - deltaX);
                const newLeft = this.resizeStart.left + deltaX;
                card.style.width = `${newWidth}px`;
                card.style.left = `${newLeft}px`;
                card.style.right = 'auto';  // Disable right anchoring
            } else {
                // When dragging right edge, keep left edge anchored
                const newWidth = Math.max(0, this.resizeStart.width + deltaX);
                card.style.width = `${newWidth}px`;
                card.style.left = `${this.resizeStart.left}px`;  // Keep left position fixed
                card.style.right = 'auto';  // Disable right anchoring
            }
        };

        // Update the mouseup handler
        const mouseUpHandler = () => {
            if (this.isResizing) {
                this.isResizing = false;
                this.currentHandle = null;
            }
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);

        card.appendChild(leftHandle);
        card.appendChild(rightHandle);

        // Create header (fixed)
        const header = document.createElement('div');
        header.className = 'article-assistant-card-header';
        Object.assign(header.style, {
            background: '#1A1A1A',
            padding: '16px 20px',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'move',
            flexShrink: '0'  // Prevent header from shrinking
        });
        
        // Add minimize button
        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'article-assistant-card-button';
        minimizeBtn.innerHTML = '−';
        minimizeBtn.title = 'Minimize';
        minimizeBtn.onclick = () => this.toggleMinimize();

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'article-assistant-card-button';
        closeBtn.innerHTML = '×';
        closeBtn.title = 'Close';
        closeBtn.style.marginLeft = '8px';
        closeBtn.onclick = () => this.removeFloatingCard();
        
        const title = document.createElement('div');
        title.className = 'article-assistant-card-title';
        title.textContent = 'Key Insights';
        Object.assign(title.style, {
            fontSize: '16px',
            fontWeight: '600',
            color: '#FFFFFF'
        });

        // Create a container for the buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            margin-left: auto !important;
        `;

        // Create ask question button for header
        const askButton = document.createElement('button');
        askButton.className = 'article-assistant-card-button';
        askButton.innerHTML = '❓';
        askButton.title = 'Ask a Question';
        askButton.style.cssText = `
            background: none !important;
            border: none !important;
            font-size: 18px !important;
            color: #FFFFFF !important;
            cursor: pointer !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 !important;
        `;
        askButton.onclick = () => {
            console.log('[ArticleAssistant] Header ask button clicked');
            if (this.onAskButtonClick) {
                this.onAskButtonClick();
            }
        };

        buttonContainer.appendChild(askButton);
        buttonContainer.appendChild(minimizeBtn);
        buttonContainer.appendChild(closeBtn);

        header.appendChild(title);
        header.appendChild(buttonContainer);
        
        // Add drag handlers to header
        this.addDragHandlers(header);

        // Create the ask question section (fixed)
        const askSection = document.createElement('div');
        askSection.style.cssText = `
            padding: 12px 20px !important;
            background-color: #F8F9FA !important;
            border-bottom: 1px solid #E5E5E5 !important;
            display: block !important;
            flex-shrink: 0 !important;  /* Prevent section from shrinking */
        `;

        const askButtonMain = document.createElement('button');
        askButtonMain.className = 'article-assistant-reveal-question-button';
        askButtonMain.textContent = '✨ Ask a Question About This Article';
        askButtonMain.style.cssText = `
            display: block !important;
            width: 100% !important;
            padding: 12px 20px !important;
            background-color: #1A73E8 !important;
            color: white !important;
            border: none !important;
            border-radius: 8px !important;
            font-weight: 500 !important;
            font-size: 15px !important;
            cursor: pointer !important;
            text-align: center !important;
            position: relative !important;
            z-index: 10001 !important;
            margin: 0 !important;
        `;
        
        askButtonMain.onclick = () => {
            console.log('[ArticleAssistant] Main ask button clicked');
            if (this.onAskButtonClick) {
                this.onAskButtonClick();
            }
        };

        askSection.appendChild(askButtonMain);
        
        // Create scrollable content container
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'article-assistant-card-content';
        Object.assign(contentWrapper.style, {
            flex: '1',
            overflowY: 'auto',
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column'
        });

        // Create content
        const content = document.createElement('div');
        Object.assign(content.style, {
            padding: '20px',
            flexGrow: '1'
        });
        
        // Parse and format the Q&A summary
        const qaSection = document.createElement('div');
        qaSection.className = 'article-assistant-qa-section';
        
        // Split the summary into Q&A pairs
        const qaContent = summary.split('💡 MAIN POINTS')[1] || summary;
        const qaPairs = qaContent.split(/Q:/).filter(pair => pair.trim());
        
        qaPairs.forEach((pair, index) => {
            const qaDiv = document.createElement('div');
            qaDiv.className = 'article-assistant-qa-pair';
            Object.assign(qaDiv.style, {
                marginBottom: '24px',
                padding: '16px',
                background: '#F8F9FA',
                borderRadius: '8px',
                border: '1px solid #E0E6ED'
            });
            
            const parts = pair.split(/A:/).map(p => p.trim());
            if (parts.length === 2) {
                const question = document.createElement('div');
                question.className = 'article-assistant-question';
                question.textContent = parts[0];
                Object.assign(question.style, {
                    fontWeight: '600',
                    color: '#1A1A1A',
                    marginBottom: '12px',
                    fontSize: '15px',
                    lineHeight: '1.5'
                });
                
                const answer = document.createElement('div');
                answer.className = 'article-assistant-answer';
                Object.assign(answer.style, {
                    color: '#333333',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                });

                answer.textContent = parts[1];
                
                qaDiv.appendChild(question);
                qaDiv.appendChild(answer);
                qaSection.appendChild(qaDiv);
            }
        });
        
        content.appendChild(qaSection);
        
        // Create supporting quotes section
        const quotesSection = document.createElement('div');
        quotesSection.className = 'article-assistant-quotes-section';
        Object.assign(quotesSection.style, {
            borderTop: '1px solid #E5E5E5',
            marginTop: '24px',
            paddingTop: '24px'
        });
        
        const quotesTitle = document.createElement('h3');
        quotesTitle.textContent = 'Supporting Evidence';
        Object.assign(quotesTitle.style, {
            fontSize: '15px',
            fontWeight: '600',
            color: '#1A1A1A',
            margin: '0 0 16px 0'
        });
        
        quotesSection.appendChild(quotesTitle);
        
        const quotesList = document.createElement('ul');
        quotesList.className = 'article-assistant-points';
        Object.assign(quotesList.style, {
            listStyle: 'none',
            padding: '0',
            margin: '0'
        });
        
        points.forEach((point, index) => {
            const li = document.createElement('li');
            li.className = 'article-assistant-point';
            li.textContent = point;
            Object.assign(li.style, {
                padding: '12px 16px',
                margin: '8px 0',
                background: '#F5F5F5',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#333333',
                cursor: 'pointer'
            });
            li.onclick = () => this.scrollToHighlight(index);
            quotesList.appendChild(li);
        });
        
        quotesSection.appendChild(quotesList);
        content.appendChild(quotesSection);
        
        // Assemble the card with new structure
        card.appendChild(header);
        card.appendChild(askSection);
        contentWrapper.appendChild(content);
        card.appendChild(contentWrapper);

        document.body.appendChild(card);
        this.floatingCard = card;
    }

    formatAnswerText(text) {
        // Remove markdown bold
        text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
        
        // Split into sentences and paragraphs
        const sentences = text.split(/(?<=[.!?])\s+/);
        const paragraphs = [];
        let currentParagraph = [];
        
        sentences.forEach((sentence, index) => {
            sentence = sentence.trim();
            if (!sentence) return;

            // Start a new paragraph for key points or after long sentences
            if (sentence.includes(':') || 
                (currentParagraph.length > 0 && 
                 (currentParagraph.join(' ').length > 150 || 
                  sentence.length > 100))) {
                if (currentParagraph.length > 0) {
                    paragraphs.push(currentParagraph.join(' '));
                }
                currentParagraph = [];
            }

            // Add special formatting for key points
            if (sentence.includes(':')) {
                if (currentParagraph.length > 0) {
                    paragraphs.push(currentParagraph.join(' '));
                    currentParagraph = [];
                }
                paragraphs.push(`<div class="key-point">${sentence}</div>`);
            } else {
                currentParagraph.push(sentence);
            }
        });

        // Add any remaining sentences
        if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join(' '));
        }

        // Wrap each paragraph in <p> tags
        return paragraphs
            .map(p => p.startsWith('<div') ? p : `<p>${p}</p>`)
            .join('\n');
    }

    addDragHandlers(header) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        header.onmousedown = (e) => {
            if (e.target.classList.contains('article-assistant-card-button')) {
                return; // Don't start drag if clicking the minimize button
            }
            
            isDragging = true;
            const card = this.floatingCard;
            const rect = card.getBoundingClientRect();
            
            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;
            
            card.style.cursor = 'grabbing';
            e.preventDefault();
        };
        
        document.onmousemove = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            // Keep card within viewport bounds
            const card = this.floatingCard;
            const maxX = window.innerWidth - card.offsetWidth;
            const maxY = window.innerHeight - card.offsetHeight;
            
            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));
            
            card.style.left = currentX + 'px';
            card.style.top = currentY + 'px';
        };
        
        document.onmouseup = () => {
            if (!isDragging) return;
            
            isDragging = false;
            this.floatingCard.style.cursor = 'default';
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
        console.log('[ArticleAssistant] Starting findTextRange with full text:', text);
        
        // Find the article container
        const articleElement = document.querySelector('article');
        if (!articleElement) {
            console.error('[ArticleAssistant] No article element found');
            return null;
        }

        // Get all text nodes in the article
        const textNodes = [];
        const walker = document.createTreeWalker(
            articleElement,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip hidden elements and unwanted content
                    const parent = node.parentElement;
                    if (!parent || 
                        parent.closest('script, style, noscript, .article-assistant-floating-card') ||
                        getComputedStyle(parent).display === 'none') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.SKIP;
                }
            }
        );

        let node;
        let fullText = '';
        while (node = walker.nextNode()) {
            const nodeText = node.textContent.trim();
            if (nodeText) {
                textNodes.push({
                    node: node,
                    startIndex: fullText.length,
                    text: nodeText
                });
                fullText += nodeText + ' ';
            }
        }

        // Normalize search text and full text
        const normalizeText = (str) => {
            return str.toLowerCase()
                     .replace(/[\u2018\u2019'']/g, "'")
                     .replace(/[\u201C\u201D""]/g, '"')
                     .replace(/\s+/g, ' ')
                     .trim();
        };

        const normalizedSearchText = normalizeText(text);
        const normalizedFullText = normalizeText(fullText);

        // Find the text position
        const textIndex = normalizedFullText.indexOf(normalizedSearchText);
        if (textIndex === -1) {
            console.log('[ArticleAssistant] Text not found:', {
                searchText: normalizedSearchText,
                fullTextSample: normalizedFullText.substring(0, 200)
            });
            return null;
        }

        // Find start and end nodes
        let startNode = null;
        let endNode = null;
        let startOffset = 0;
        let endOffset = 0;

        let currentIndex = 0;
        for (const nodeInfo of textNodes) {
            const nodeTextLength = nodeInfo.text.length + 1; // +1 for the space
            
            if (!startNode && currentIndex + nodeTextLength > textIndex) {
                startNode = nodeInfo.node;
                startOffset = textIndex - currentIndex;
            }
            
            if (!endNode && currentIndex + nodeTextLength > textIndex + normalizedSearchText.length) {
                endNode = nodeInfo.node;
                endOffset = textIndex + normalizedSearchText.length - currentIndex;
                break;
            }
            
            currentIndex += nodeTextLength;
        }

        if (!startNode || !endNode) {
            console.error('[ArticleAssistant] Could not find text boundaries');
            return null;
        }

        try {
            // Create the range
            const range = document.createRange();
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);

            // Create highlight with inline styles
            const highlight = document.createElement('mark');
            highlight.className = 'article-assistant-highlight';
            Object.assign(highlight.style, {
                backgroundColor: 'rgba(255, 255, 0, 0.3)',
                borderBottom: '1px solid rgba(255, 200, 0, 0.5)',
                padding: '2px 0',
                borderRadius: '2px',
                display: 'inline',
                position: 'relative',
                zIndex: '1'
            });

            try {
                range.surroundContents(highlight);
                console.log('[ArticleAssistant] Successfully created highlight');
                return range;
            } catch (surroundError) {
                console.error('[ArticleAssistant] Error surrounding range:', surroundError);
                
                // Fallback: Try to highlight each text node in the range separately
                const nodes = this.getTextNodesInRange(range);
                for (const node of nodes) {
                    const nodeRange = document.createRange();
                    nodeRange.selectNodeContents(node);
                    const nodeHighlight = highlight.cloneNode();
                    nodeRange.surroundContents(nodeHighlight);
                }
                
                return range;
            }
        } catch (error) {
            console.error('[ArticleAssistant] Error creating range:', error);
            return null;
        }
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

    // New helper method to analyze text structure
    analyzeTextStructure(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.textContent.trim().length > 0) {
                textNodes.push({
                    length: node.textContent.length,
                    parentTag: node.parentElement?.tagName,
                    depth: this.getNodeDepth(node),
                    preview: node.textContent.trim().substring(0, 30)
                });
            }
        }

        return {
            totalNodes: textNodes.length,
            averageLength: textNodes.reduce((sum, node) => sum + node.length, 0) / textNodes.length,
            depthDistribution: textNodes.reduce((acc, node) => {
                acc[node.depth] = (acc[node.depth] || 0) + 1;
                return acc;
            }, {}),
            parentTagDistribution: textNodes.reduce((acc, node) => {
                acc[node.parentTag] = (acc[node.parentTag] || 0) + 1;
                return acc;
            }, {})
        };
    }

    createAndShowQuestionBox() {
        // Get the main card's position
        const mainCard = this.floatingCard;
        const mainCardRect = mainCard.getBoundingClientRect();
        
        // Create question box
        const questionBox = document.createElement('div');
        questionBox.className = 'article-assistant-question-box';
        questionBox.style.cssText = `
            position: fixed !important;
            top: ${mainCardRect.bottom + 10}px !important;
            right: ${window.innerWidth - mainCardRect.right}px !important;
            width: ${mainCardRect.width}px !important;
            background: white !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            padding: 16px !important;
            z-index: 999999 !important;
        `;

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-bottom: 12px !important;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Ask a Question About This Article';
        title.style.cssText = `
            margin: 0 !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            color: #202124 !important;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: none !important;
            border: none !important;
            font-size: 20px !important;
            color: #5f6368 !important;
            cursor: pointer !important;
            padding: 4px 8px !important;
        `;
        closeBtn.onclick = () => questionBox.remove();

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Create textarea
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Type your question here...';
        textarea.style.cssText = `
            width: 100% !important;
            min-height: 100px !important;
            padding: 12px !important;
            border: 1px solid #dadce0 !important;
            border-radius: 8px !important;
            margin-bottom: 12px !important;
            font-family: inherit !important;
            font-size: 14px !important;
            resize: vertical !important;
            box-sizing: border-box !important;
        `;

        // Create submit button
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Submit Question';
        submitBtn.style.cssText = `
            background-color: #1a73e8 !important;
            color: white !important;
            border: none !important;
            padding: 12px 24px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
        `;

        submitBtn.onclick = async () => {
            const question = textarea.value.trim();
            if (!question) return;

            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;

            try {
                console.log('[ArticleAssistant] Sending question to background script:', question);
                
                // Get the article content
                const extractedContent = this.extractPageContent();
                if (!extractedContent.content) {
                    throw new Error('Could not extract article content. Please try reloading the page.');
                }
                
                console.log('[ArticleAssistant] Extracted content for question:', {
                    contentLength: extractedContent.content.length,
                    contentType: extractedContent.isArticle ? 'article' : 
                               extractedContent.isSelection ? 'selection' : 'body'
                });
                
                // Send message to background script
                const response = await chrome.runtime.sendMessage({
                    action: 'processQuestion',
                    content: question,
                    articleContent: extractedContent.content
                });

                console.log('[ArticleAssistant] Received response from background:', response);

                // Check if we got a response at all
                if (!response) {
                    throw new Error('No response received from background script');
                }

                // Check for error in response
                if (response.error) {
                    throw new Error(response.error);
                }

                // Check if we have an answer
                if (!response.answer) {
                    throw new Error('No answer received in response');
                }

                console.log('[ArticleAssistant] Adding Q&A to main card:', {
                    question: question,
                    answer: response.answer
                });

                // Add the Q&A to the main card
                this.addCustomQA(question, response.answer);
                
                // Remove the question box
                questionBox.remove();
            } catch (error) {
                console.error('[ArticleAssistant] Error processing question:', error);
                submitBtn.textContent = 'Error - Try Again';
                
                // Show error message to user
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.style.cssText = `
                    color: #d93025 !important;
                    font-size: 14px !important;
                    margin-top: 8px !important;
                    margin-bottom: 8px !important;
                `;
                errorMsg.textContent = error.message || 'Failed to process question. Please try again.';
                
                // Remove any existing error message
                const existingError = questionBox.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }
                
                // Add new error message before the submit button
                submitBtn.parentNode.insertBefore(errorMsg, submitBtn);
            } finally {
                submitBtn.disabled = false;
                if (submitBtn.textContent === 'Processing...') {
                    submitBtn.textContent = 'Submit Question';
                }
            }
        };

        // Assemble the box
        questionBox.appendChild(header);
        questionBox.appendChild(textarea);
        questionBox.appendChild(submitBtn);

        // Add to page
        document.body.appendChild(questionBox);

        // Focus the textarea
        setTimeout(() => textarea.focus(), 100);
    }

    addCustomQA(question, answer) {
        console.log('[ArticleAssistant] Adding custom Q&A:', { question, answer });
        
        // Find the content section (update selector to match new structure)
        const content = this.floatingCard.querySelector('.article-assistant-card-content > div');
        if (!content) {
            console.error('[ArticleAssistant] Could not find card content');
            return;
        }

        // Create or find the custom Q&A container
        let customQAContainer = content.querySelector('.article-assistant-custom-qa-container');
        if (!customQAContainer) {
            customQAContainer = document.createElement('div');
            customQAContainer.className = 'article-assistant-custom-qa-container';
            customQAContainer.style.cssText = `
                margin-top: 24px !important;
                padding-top: 24px !important;
                border-top: 1px solid #E5E5E5 !important;
            `;
            content.appendChild(customQAContainer);
        }

        // Create Q&A pair
        const qaDiv = document.createElement('div');
        qaDiv.className = 'article-assistant-qa-pair';
        qaDiv.style.cssText = `
            margin-bottom: 24px !important;
            padding: 16px !important;
            background: #F8F9FA !important;
            border-radius: 8px !important;
            border: 1px solid #E0E6ED !important;
        `;

        // Add question
        const questionEl = document.createElement('div');
        questionEl.className = 'article-assistant-question';
        questionEl.textContent = question;
        questionEl.style.cssText = `
            font-weight: 600 !important;
            color: #1A1A1A !important;
            margin-bottom: 12px !important;
            font-size: 15px !important;
            line-height: 1.5 !important;
        `;

        // Add answer
        const answerEl = document.createElement('div');
        answerEl.className = 'article-assistant-answer';
        answerEl.textContent = answer;
        answerEl.style.cssText = `
            color: #333333 !important;
            font-size: 14px !important;
            line-height: 1.6 !important;
            white-space: pre-wrap !important;
        `;

        // Assemble and add to container
        qaDiv.appendChild(questionEl);
        qaDiv.appendChild(answerEl);
        customQAContainer.appendChild(qaDiv);

        // Scroll the new Q&A into view
        qaDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        console.log('[ArticleAssistant] Successfully added Q&A to card');
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