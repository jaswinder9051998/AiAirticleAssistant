class ArticleAssistant {
    constructor() {
        this.floatingCard = null;
        this.highlights = new Highlights();
        this.initialized = false;
        this.cardWasClosed = false;
        this.lastCardData = null;
        this.vocabularyTerms = null; // Store vocabulary terms
    }

    async initializeAsync() {
        try {
            StyleInjector.injectStyles();
            this.initialized = true;
            console.log('[ArticleAssistant] Async initialization complete');
        } catch (error) {
            console.error('[ArticleAssistant] Async initialization failed:', error);
            throw error;
        }
    }

    async processArticle() {
        const content = TextProcessing.extractPageContent();
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

            // Store the card data for potential reopening later
            this.lastCardData = {
                summary: response.summary,
                points: response.points,
                executiveSummary: response.executiveSummary || "This article discusses key economic and market trends affecting investor behavior."
            };
            
            // Reset the closed state when creating a new card
            this.cardWasClosed = false;

            // Create floating card first
            this.floatingCard = new FloatingCard();
            
            // Add a method to track when the card is closed
            const originalRemove = this.floatingCard.remove;
            this.floatingCard._originalRemove = originalRemove; // Store for later use
            this.floatingCard.remove = () => {
                console.log('[ArticleAssistant] Floating card being removed, setting cardWasClosed flag');
                this.cardWasClosed = true;
                originalRemove.call(this.floatingCard);
            };
            
            this.floatingCard.create(
                response.summary, 
                response.points,
                () => this.createAndShowQuestionBox(),
                response.executiveSummary
            );

            // Process highlights
            for (const point of response.points) {
                console.log('[ArticleAssistant] Processing highlight for:', point.substring(0, 50) + (point.length > 50 ? '...' : ''));
                const range = this.highlights.findTextRange(point);
                if (range) {
                    try {
                        // Create highlight element
                        const highlight = document.createElement('mark');
                        highlight.className = 'article-assistant-highlight';
                        highlight.dataset.quote = point; // Store the full quote for reference
                        Object.assign(highlight.style, {
                            backgroundColor: 'rgba(255, 255, 0, 0.3)',
                            borderBottom: '1px solid rgba(255, 200, 0, 0.5)',
                            padding: '2px 0',
                            borderRadius: '2px',
                            display: 'inline',
                            position: 'relative',
                            zIndex: '1'
                        });
                        
                        // Try to surround the entire range first
                        try {
                            range.surroundContents(highlight);
                            console.log('[ArticleAssistant] Successfully created single highlight');
                        } catch (surroundError) {
                            console.log('[ArticleAssistant] Could not create single highlight, using multi-node approach:', surroundError.message);
                            
                            // Fallback: Highlight each text node in the range separately
                            const nodes = this.highlights.getTextNodesInRange(range);
                            console.log('[ArticleAssistant] Found', nodes.length, 'text nodes to highlight');
                            
                            if (nodes.length === 0) {
                                throw new Error('No text nodes found in range');
                            }
                            
                            for (const node of nodes) {
                                try {
                                    // Make sure node has content
                                    if (!node.textContent.trim()) continue;
                                    
                                    const nodeRange = document.createRange();
                                    nodeRange.selectNodeContents(node);
                                    const nodeHighlight = highlight.cloneNode();
                                    nodeHighlight.dataset.quote = point; // Store the full quote for reference
                                    nodeRange.surroundContents(nodeHighlight);
                                } catch (nodeError) {
                                    console.error('[ArticleAssistant] Error highlighting node:', nodeError);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('[ArticleAssistant] Error creating highlight:', error);
                        
                        // Last resort: try to find and highlight any portion of the quote
                        this.tryAlternativeHighlighting(point);
                    }
                } else {
                    console.error('[ArticleAssistant] Could not find range for quote:', point.substring(0, 50) + (point.length > 50 ? '...' : ''));
                    
                    // Try alternative highlighting methods
                    this.tryAlternativeHighlighting(point);
                }
            }

            // Process vocabulary after highlights are done
            this.processVocabulary(content.content);

            return { success: true };
        } catch (error) {
            console.error('[ArticleAssistant] Error processing article:', error);
            throw error;
        }
    }

    createAndShowQuestionBox(selectedText = null) {
        try {
            // Check for globally stored selected text if none was passed
            if (!selectedText && window.articleAssistantSelectedText) {
                selectedText = window.articleAssistantSelectedText;
                console.log('[ArticleAssistant] Retrieved selected text from global storage:', selectedText.substring(0, 50) + '...');
            }
            
            console.log('[ArticleAssistant] Creating question box with selected text:', selectedText ? 'yes, length: ' + selectedText.length : 'no');
            
            // Store the selected text for later use
            this.currentSelectedText = selectedText;
            
            // Check if the floating card was closed and needs to be reopened
            if (this.cardWasClosed || !this.floatingCard) {
                console.log('[ArticleAssistant] Card was closed or doesn\'t exist, reopening it');
                
                if (this.lastCardData) {
                    console.log('[ArticleAssistant] Recreating card with stored data');
                    this.floatingCard = new FloatingCard();
                    
                    // Add a method to track when the card is closed
                    const originalRemove = this.floatingCard.remove;
                    this.floatingCard._originalRemove = originalRemove; // Store for later use
                    this.floatingCard.remove = () => {
                        console.log('[ArticleAssistant] Floating card being removed, setting cardWasClosed flag');
                        this.cardWasClosed = true;
                        originalRemove.call(this.floatingCard);
                    };
                    
                    this.floatingCard.create(
                        this.lastCardData.summary,
                        this.lastCardData.points,
                        () => this.createAndShowQuestionBox(),
                        this.lastCardData.executiveSummary
                    );
                    
                    // Reset the closed state
                    this.cardWasClosed = false;
                } else {
                    console.error('[ArticleAssistant] No card data available for reopening');
                    // Create a minimal card if we don't have the previous data
                    this.floatingCard = new FloatingCard();
                    this.floatingCard.create(
                        "Article Assistant",
                        [],
                        () => this.createAndShowQuestionBox(),
                        "No summary available for this article."
                    );
                }
            }
            
            // Remove existing question box if any
            if (this.questionBox) {
                console.log('[ArticleAssistant] Removing existing question box');
                this.questionBox.remove();
                this.questionBox = null;
            }
            
            // Define the submit handler
            const onSubmitHandler = (question, contextText = null) => {
                console.log('[ArticleAssistant] Question submitted:', question);
                
                // Use either the context text passed from the question box, the stored selected text, or the global variable
                const finalContextText = contextText || this.currentSelectedText || window.articleAssistantSelectedText;
                console.log('[ArticleAssistant] Context text for processing:', finalContextText ? 'yes, length: ' + finalContextText.length : 'no');
                
                // Hide the question box
                if (this.questionBox) {
                    console.log('[ArticleAssistant] Hiding question box');
                    this.questionBox.remove();
                    this.questionBox = null;
                }
                
                // Process the question with the context
                this.processQuestion(question, finalContextText);
                
                return true;
            };
            
            // Also check for any orphaned question boxes in the DOM
            const existingBoxes = document.querySelectorAll('.article-assistant-question-box');
            if (existingBoxes.length > 0) {
                console.log(`[ArticleAssistant] Found ${existingBoxes.length} orphaned question boxes, removing them`);
                existingBoxes.forEach(box => box.parentNode && box.parentNode.removeChild(box));
            }
            
            // Create and show the question box
            console.log('[ArticleAssistant] Creating QuestionBox with onSubmitHandler and selectedText:', selectedText ? 'yes' : 'no');
            this.questionBox = new QuestionBox(this.floatingCard, onSubmitHandler, selectedText);
            
            // Verify the question box was created
            if (!this.questionBox) {
                throw new Error('Failed to create question box instance');
            }
            
            console.log('[ArticleAssistant] QuestionBox created, showing...');
            this.questionBox.show();
            
            // Verify the box element exists and is in the DOM
            if (this.questionBox.box) {
                console.log('[ArticleAssistant] Question box element created:', {
                    inDOM: document.body.contains(this.questionBox.box),
                    styles: {
                        display: this.questionBox.box.style.display,
                        visibility: this.questionBox.box.style.visibility,
                        opacity: this.questionBox.box.style.opacity,
                        zIndex: this.questionBox.box.style.zIndex
                    },
                    dimensions: this.questionBox.box.getBoundingClientRect()
                });
                
                // Force the question box to be visible in case there are CSS conflicts
                setTimeout(() => {
                    if (this.questionBox && this.questionBox.box) {
                        const boxEl = this.questionBox.box;
                        boxEl.style.setProperty('display', 'block', 'important');
                        boxEl.style.setProperty('visibility', 'visible', 'important');
                        boxEl.style.setProperty('opacity', '1', 'important');
                        boxEl.style.setProperty('z-index', '2147483647', 'important');
                        console.log('[ArticleAssistant] Forced question box visibility after timeout');
                    }
                }, 200);
            } else {
                console.error('[ArticleAssistant] Question box element not created after show()');
            }
            
            console.log('[ArticleAssistant] QuestionBox show process completed');
        } catch (error) {
            console.error('[ArticleAssistant] Error creating/showing question box:', error);
        }
    }

    processQuestion(question, contextText = null) {
        console.log('[ArticleAssistant] Processing question:', question);
        console.log('[ArticleAssistant] Context text provided:', contextText ? 'yes, length: ' + contextText.length : 'no');
        
        // Show loading state in the card
        if (this.floatingCard) {
            // TODO: Add loading state to the card
        }
        
        // Extract page content
        const pageContent = this.extractPageContent();
        console.log('[ArticleAssistant] Extracted page content (first 200 chars):', 
            pageContent ? pageContent.substring(0, 200) + '...' : 'No content extracted');
        
        // Prepare the prompt with context if available
        let prompt = question;
        if (contextText) {
            prompt = `Question: ${question}\n\nContext from selected text: ${contextText}\n\nPlease answer the question specifically in relation to this selected text.`;
            console.log('[ArticleAssistant] Using context for question. Full prompt:', prompt);
        } else {
            console.log('[ArticleAssistant] No context text provided, using standard prompt');
        }
        
        // Call the API to get the answer
        this.callAPI(prompt, pageContent)
            .then(response => {
                console.log('[ArticleAssistant] API response:', response);
                
                // Add the Q&A to the card
                if (this.floatingCard) {
                    this.floatingCard.addCustomQA(question, response);
                }
            })
            .catch(error => {
                console.error('[ArticleAssistant] Error processing question:', error);
                
                // Show error in the card
                if (this.floatingCard) {
                    this.floatingCard.addCustomQA(question, 'Sorry, there was an error processing your question. Please try again.');
                }
            });
    }

    callAPI(prompt, pageContent) {
        return new Promise((resolve, reject) => {
            console.log('[ArticleAssistant] Calling API with prompt:', prompt.substring(0, 100) + '...');
            
            if (!pageContent) {
                console.log('[ArticleAssistant] No page content provided, extracting now...');
                pageContent = this.extractPageContent();
            }
            
            console.log('[ArticleAssistant] Page content length for API call:', pageContent ? pageContent.length : 0);
            
            if (!pageContent) {
                reject(new Error('Failed to extract page content'));
                return;
            }
            
            console.log('[ArticleAssistant] Sending message to background: PROCESS_QUESTION');
            chrome.runtime.sendMessage({
                action: 'PROCESS_QUESTION',
                question: prompt,
                articleContent: pageContent
            }, (response) => {
                console.log('[ArticleAssistant] Received response from background:', response);
                
                if (!response) {
                    reject(new Error('No response from background script'));
                    return;
                }
                
                if (response.error) {
                    reject(new Error(response.error));
                    return;
                }
                
                resolve(response.answer);
            });
        });
    }

    clearHighlights() {
        this.highlights.clearHighlights();
        if (this.floatingCard) {
            // Don't call the overridden remove method to avoid setting cardWasClosed
            // Instead, call the original FloatingCard.prototype.remove method
            if (typeof this.floatingCard._originalRemove === 'function') {
                this.floatingCard._originalRemove();
            } else {
                this.floatingCard.remove();
            }
            this.floatingCard = null;
        }
        // Reset the closed state since we're explicitly clearing everything
        this.cardWasClosed = false;
    }

    // New method to attempt alternative ways of highlighting when the main method fails
    tryAlternativeHighlighting(quote) {
        console.log('[ArticleAssistant] Attempting alternative highlighting for quote');
        
        try {
            // Split the quote into sentences or paragraphs and try to highlight each one
            const sentences = quote.split(/(?<=[.!?])\s+/);
            let foundAny = false;
            
            for (const sentence of sentences) {
                if (sentence.length < 15) continue; // Skip very short segments
                
                const range = this.highlights.findTextRange(sentence);
                if (range) {
                    foundAny = true;
                    try {
                        const highlight = document.createElement('mark');
                        highlight.className = 'article-assistant-highlight';
                        highlight.dataset.quote = quote; // Store the full quote for reference
                        highlight.dataset.partial = 'true'; // Mark as a partial highlight
                        
                        Object.assign(highlight.style, {
                            backgroundColor: 'rgba(255, 255, 0, 0.3)',
                            borderBottom: '1px solid rgba(255, 200, 0, 0.5)',
                            padding: '2px 0',
                            borderRadius: '2px',
                            display: 'inline',
                            position: 'relative',
                            zIndex: '1'
                        });
                        
                        range.surroundContents(highlight);
                        console.log('[ArticleAssistant] Successfully created partial highlight for sentence:', 
                                   sentence.substring(0, 30) + (sentence.length > 30 ? '...' : ''));
                    } catch (error) {
                        console.error('[ArticleAssistant] Error creating partial highlight:', error);
                    }
                }
            }
            
            if (!foundAny) {
                // As a last resort, try to find distinctive phrases in the quote
                const words = quote.split(' ');
                for (let i = 0; i < words.length - 3; i += 2) {
                    const phrase = words.slice(i, i + 4).join(' ');
                    if (phrase.length < 15) continue; // Skip short phrases
                    
                    const range = this.highlights.findTextRange(phrase);
                    if (range) {
                        try {
                            const highlight = document.createElement('mark');
                            highlight.className = 'article-assistant-highlight';
                            highlight.dataset.quote = quote; // Store the full quote
                            highlight.dataset.partial = 'true'; // Mark as a partial highlight
                            
                            Object.assign(highlight.style, {
                                backgroundColor: 'rgba(255, 255, 0, 0.3)',
                                borderBottom: '1px solid rgba(255, 200, 0, 0.5)',
                                padding: '2px 0',
                                borderRadius: '2px',
                                display: 'inline',
                                position: 'relative',
                                zIndex: '1'
                            });
                            
                            range.surroundContents(highlight);
                            console.log('[ArticleAssistant] Created phrase highlight:', phrase);
                            
                            // Just find a few phrases to avoid cluttering the article
                            if (i > 10) break;
                        } catch (error) {
                            console.error('[ArticleAssistant] Error creating phrase highlight:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[ArticleAssistant] Alternative highlighting failed:', error);
        }
    }

    // Add extractPageContent method
    extractPageContent() {
        console.log('[ArticleAssistant] Extracting page content using TextProcessing...');
        try {
            const result = TextProcessing.extractPageContent();
            console.log('[ArticleAssistant] Content extraction result:', {
                success: !!result,
                hasContent: result && result.content && result.content.length > 0,
                contentLength: result?.content?.length || 0,
                contentType: result?.isArticle ? 'article' : 
                            result?.isSelection ? 'selection' : 
                            result?.isCleanedBody ? 'cleaned body' : 'unknown'
            });
            
            if (!result || !result.content) {
                console.error('[ArticleAssistant] No content extracted');
                return null;
            }
            
            return result.content;
        } catch (error) {
            console.error('[ArticleAssistant] Error in extractPageContent:', error);
            return null;
        }
    }

    // Add a new method to process vocabulary
    async processVocabulary(content) {
        try {
            console.log('[ArticleAssistant] Processing vocabulary for article');
            
            // Send request to background script to identify difficult vocabulary
            const response = await chrome.runtime.sendMessage({
                action: 'identifyVocabulary',
                content: content
            });
            
            if (response.error) {
                console.error('[ArticleAssistant] Error identifying vocabulary:', response.error);
                return;
            }
            
            if (!response.vocabulary || !Array.isArray(response.vocabulary)) {
                console.error('[ArticleAssistant] Invalid vocabulary response format:', response);
                return;
            }
            
            // Store vocabulary terms for later use
            this.vocabularyTerms = response.vocabulary;
            console.log('[ArticleAssistant] Identified vocabulary terms:', this.vocabularyTerms);
            
            // Highlight vocabulary terms in the article
            this.highlightVocabularyTerms();
            
        } catch (error) {
            console.error('[ArticleAssistant] Error processing vocabulary:', error);
        }
    }
    
    // Method to highlight vocabulary terms in the article
    highlightVocabularyTerms() {
        if (!this.vocabularyTerms || this.vocabularyTerms.length === 0) {
            console.log('[ArticleAssistant] No vocabulary terms to highlight');
            return;
        }
        
        console.log('[ArticleAssistant] Highlighting vocabulary terms:', this.vocabularyTerms.length);
        
        // Sort terms by length (descending) to prioritize longer phrases
        const sortedTerms = [...this.vocabularyTerms].sort((a, b) => 
            b.word.length - a.word.length
        );
        
        // Cache tooltips for better performance
        const tooltipCache = new Map();
        
        for (const term of sortedTerms) {
            try {
                // Log the term to verify it has both definitions
                console.log(`[ArticleAssistant] Processing vocabulary term:`, {
                    word: term.word,
                    formal_definition: term.formal_definition,
                    simple_definition: term.simple_definition
                });
                
                // Find all instances of the term in the document
                const ranges = this.highlights.findAllTextRanges(term.word);
                
                if (ranges.length === 0) {
                    console.log(`[ArticleAssistant] No matches found for vocabulary term: ${term.word}`);
                    continue;
                }
                
                console.log(`[ArticleAssistant] Found ${ranges.length} matches for vocabulary term: ${term.word}`);
                
                // Highlight each instance
                for (const range of ranges) {
                    try {
                        // Create vocabulary highlight element
                        const vocabHighlight = document.createElement('span');
                        vocabHighlight.className = 'article-assistant-vocab';
                        vocabHighlight.setAttribute('title', `${term.word}: ${term.formal_definition} | ${term.simple_definition}`); // Fallback tooltip
                        
                        // Create tooltip
                        const tooltip = document.createElement('div');
                        tooltip.className = 'article-assistant-vocab-tooltip';
                        tooltip.style.zIndex = '10002'; // Ensure high z-index
                        
                        // Add word and definitions to tooltip
                        const wordEl = document.createElement('div');
                        wordEl.className = 'article-assistant-vocab-word';
                        wordEl.textContent = term.word;
                        
                        const formalDefinitionEl = document.createElement('div');
                        formalDefinitionEl.className = 'article-assistant-vocab-definition formal';
                        formalDefinitionEl.innerHTML = `<strong>1.</strong> ${term.formal_definition}`;
                        
                        const simpleDefinitionEl = document.createElement('div');
                        simpleDefinitionEl.className = 'article-assistant-vocab-definition simple';
                        simpleDefinitionEl.innerHTML = `<strong>2.</strong> ${term.simple_definition}`;
                        
                        // Add a separator between definitions
                        const separator = document.createElement('div');
                        separator.className = 'article-assistant-vocab-separator';
                        
                        // Append all elements to the tooltip
                        tooltip.appendChild(wordEl);
                        tooltip.appendChild(formalDefinitionEl);
                        tooltip.appendChild(separator);
                        tooltip.appendChild(simpleDefinitionEl);
                        
                        // Log the tooltip structure
                        console.log(`[ArticleAssistant] Created tooltip for ${term.word} with:`, {
                            wordElement: wordEl.textContent,
                            formalDefinition: formalDefinitionEl.textContent,
                            simpleDefinition: simpleDefinitionEl.textContent,
                            childNodes: tooltip.childNodes.length
                        });
                        
                        // Add tooltip to highlight
                        vocabHighlight.appendChild(tooltip);
                        
                        // Store in cache for reference
                        const tooltipId = `tooltip-${Math.random().toString(36).substring(2, 9)}`;
                        vocabHighlight.dataset.tooltipId = tooltipId;
                        tooltipCache.set(tooltipId, tooltip);
                        
                        // Try to surround the range with the highlight
                        try {
                            range.surroundContents(vocabHighlight);
                            
                            // Add event listeners for hover with debugging
                            vocabHighlight.addEventListener('mouseenter', (event) => {
                                console.log(`[ArticleAssistant] Mouse enter on vocab: ${term.word}`);
                                this.adjustTooltipPosition(vocabHighlight, tooltip);
                                tooltip.style.opacity = '1';
                                tooltip.style.visibility = 'visible';
                                tooltip.style.pointerEvents = 'auto'; // Enable pointer events on tooltip
                                
                                // Debug tooltip visibility and content
                                console.log(`[ArticleAssistant] Tooltip visibility: ${getComputedStyle(tooltip).visibility}`);
                                console.log(`[ArticleAssistant] Tooltip opacity: ${getComputedStyle(tooltip).opacity}`);
                                console.log(`[ArticleAssistant] Tooltip z-index: ${getComputedStyle(tooltip).zIndex}`);
                                console.log(`[ArticleAssistant] Tooltip children:`, {
                                    count: tooltip.childNodes.length,
                                    html: tooltip.innerHTML
                                });
                            });
                            
                            vocabHighlight.addEventListener('mouseleave', (event) => {
                                console.log(`[ArticleAssistant] Mouse leave from vocab: ${term.word}`);
                                // Check if we're moving to the tooltip itself
                                const relatedTarget = event.relatedTarget;
                                if (tooltip.contains(relatedTarget)) {
                                    console.log('[ArticleAssistant] Moving to tooltip, keeping visible');
                                    return; // Don't hide if moving to tooltip
                                }
                                
                                tooltip.style.opacity = '0';
                                tooltip.style.visibility = 'hidden';
                            });
                            
                            // Add event listeners to the tooltip itself
                            tooltip.addEventListener('mouseleave', () => {
                                console.log(`[ArticleAssistant] Mouse leave from tooltip for: ${term.word}`);
                                tooltip.style.opacity = '0';
                                tooltip.style.visibility = 'hidden';
                            });
                            
                        } catch (surroundError) {
                            console.log(`[ArticleAssistant] Could not create single vocab highlight for "${term.word}", using multi-node approach:`, surroundError.message);
                            
                            // Fallback: Highlight each text node in the range separately
                            const nodes = this.highlights.getTextNodesInRange(range);
                            
                            if (nodes.length === 0) {
                                throw new Error('No text nodes found in range');
                            }
                            
                            for (const node of nodes) {
                                try {
                                    // Make sure node has content
                                    if (!node.textContent.trim()) continue;
                                    
                                    const nodeRange = document.createRange();
                                    nodeRange.selectNodeContents(node);
                                    
                                    // Clone the vocab highlight for each node
                                    const nodeVocabHighlight = vocabHighlight.cloneNode(true);
                                    const nodeTooltip = nodeVocabHighlight.querySelector('.article-assistant-vocab-tooltip');
                                    
                                    // Ensure the tooltip has all the necessary elements
                                    if (!nodeTooltip.querySelector('.article-assistant-vocab-separator')) {
                                        const wordEl = document.createElement('div');
                                        wordEl.className = 'article-assistant-vocab-word';
                                        wordEl.textContent = term.word;
                                        
                                        const formalDefinitionEl = document.createElement('div');
                                        formalDefinitionEl.className = 'article-assistant-vocab-definition formal';
                                        formalDefinitionEl.innerHTML = `<strong>1.</strong> ${term.formal_definition}`;
                                        
                                        const separator = document.createElement('div');
                                        separator.className = 'article-assistant-vocab-separator';
                                        
                                        const simpleDefinitionEl = document.createElement('div');
                                        simpleDefinitionEl.className = 'article-assistant-vocab-definition simple';
                                        simpleDefinitionEl.innerHTML = `<strong>2.</strong> ${term.simple_definition}`;
                                        
                                        // Clear and rebuild the tooltip
                                        nodeTooltip.innerHTML = '';
                                        nodeTooltip.appendChild(wordEl);
                                        nodeTooltip.appendChild(formalDefinitionEl);
                                        nodeTooltip.appendChild(separator);
                                        nodeTooltip.appendChild(simpleDefinitionEl);
                                    }
                                    
                                    // Generate unique ID for this tooltip
                                    const nodeTooltipId = `tooltip-${Math.random().toString(36).substring(2, 9)}`;
                                    nodeVocabHighlight.dataset.tooltipId = nodeTooltipId;
                                    tooltipCache.set(nodeTooltipId, nodeTooltip);
                                    
                                    // Add event listeners for hover with debugging
                                    nodeVocabHighlight.addEventListener('mouseenter', (event) => {
                                        console.log(`[ArticleAssistant] Mouse enter on vocab (multi-node): ${term.word}`);
                                        this.adjustTooltipPosition(nodeVocabHighlight, nodeTooltip);
                                        nodeTooltip.style.opacity = '1';
                                        nodeTooltip.style.visibility = 'visible';
                                        nodeTooltip.style.pointerEvents = 'auto';
                                        
                                        // Debug tooltip visibility and content
                                        console.log(`[ArticleAssistant] Multi-node tooltip visibility: ${getComputedStyle(nodeTooltip).visibility}`);
                                        console.log(`[ArticleAssistant] Multi-node tooltip opacity: ${getComputedStyle(nodeTooltip).opacity}`);
                                        console.log(`[ArticleAssistant] Multi-node tooltip children:`, {
                                            count: nodeTooltip.childNodes.length,
                                            html: nodeTooltip.innerHTML
                                        });
                                    });
                                    
                                    nodeVocabHighlight.addEventListener('mouseleave', (event) => {
                                        console.log(`[ArticleAssistant] Mouse leave from vocab (multi-node): ${term.word}`);
                                        // Check if we're moving to the tooltip itself
                                        const relatedTarget = event.relatedTarget;
                                        if (nodeTooltip.contains(relatedTarget)) {
                                            console.log('[ArticleAssistant] Moving to tooltip, keeping visible');
                                            return; // Don't hide if moving to tooltip
                                        }
                                        
                                        nodeTooltip.style.opacity = '0';
                                        nodeTooltip.style.visibility = 'hidden';
                                    });
                                    
                                    // Add event listeners to the tooltip itself
                                    nodeTooltip.addEventListener('mouseleave', () => {
                                        console.log(`[ArticleAssistant] Mouse leave from tooltip (multi-node) for: ${term.word}`);
                                        nodeTooltip.style.opacity = '0';
                                        nodeTooltip.style.visibility = 'hidden';
                                    });
                                    
                                    nodeRange.surroundContents(nodeVocabHighlight);
                                } catch (nodeError) {
                                    console.error(`[ArticleAssistant] Error highlighting vocab node for "${term.word}":`, nodeError);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`[ArticleAssistant] Error creating vocab highlight for "${term.word}":`, error);
                    }
                }
            } catch (error) {
                console.error(`[ArticleAssistant] Error processing vocabulary term "${term.word}":`, error);
            }
        }
    }
    
    // Method to adjust tooltip position based on viewport
    adjustTooltipPosition(vocabElement, tooltip) {
        if (!vocabElement || !tooltip) {
            console.error('[ArticleAssistant] Missing element or tooltip in adjustTooltipPosition');
            return;
        }
        
        const rect = vocabElement.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        console.log('[ArticleAssistant] Adjusting tooltip position:', {
            vocabRect: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            },
            tooltipRect: {
                width: tooltipRect.width,
                height: tooltipRect.height
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
        
        // Reset classes
        tooltip.classList.remove('tooltip-below', 'tooltip-left', 'tooltip-right');
        
        // Check if tooltip would go off the top of the screen
        if (rect.top < tooltipRect.height + 10) {
            tooltip.classList.add('tooltip-below');
            console.log('[ArticleAssistant] Positioning tooltip below element');
        } else {
            console.log('[ArticleAssistant] Positioning tooltip above element');
        }
        
        // Check if tooltip would go off the left or right of the screen
        const viewportWidth = window.innerWidth;
        const tooltipCenter = rect.left + (rect.width / 2);
        const tooltipHalfWidth = tooltipRect.width / 2;
        
        if (tooltipCenter - tooltipHalfWidth < 10) {
            tooltip.classList.add('tooltip-right');
            console.log('[ArticleAssistant] Aligning tooltip to the right');
        } else if (tooltipCenter + tooltipHalfWidth > viewportWidth - 10) {
            tooltip.classList.add('tooltip-left');
            console.log('[ArticleAssistant] Aligning tooltip to the left');
        } else {
            console.log('[ArticleAssistant] Centering tooltip');
        }
        
        // Force reflow to ensure tooltip is properly positioned
        tooltip.style.display = 'none';
        tooltip.offsetHeight; // Force reflow
        tooltip.style.display = '';
    }
}

window.ArticleAssistant = ArticleAssistant; 