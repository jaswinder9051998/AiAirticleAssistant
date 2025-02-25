class ArticleAssistant {
    constructor() {
        this.floatingCard = null;
        this.highlights = new Highlights();
        this.initialized = false;
        this.cardWasClosed = false;
        this.lastCardData = null;
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
                points: response.points
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
                () => this.createAndShowQuestionBox()
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
                        () => this.createAndShowQuestionBox()
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
                        () => this.createAndShowQuestionBox()
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
}

window.ArticleAssistant = ArticleAssistant; 