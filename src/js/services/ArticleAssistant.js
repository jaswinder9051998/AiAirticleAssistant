class ArticleAssistant {
    constructor() {
        this.floatingCard = null;
        this.highlights = new Highlights();
        this.initialized = false;
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

            // Create floating card first
            this.floatingCard = new FloatingCard();
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

    createAndShowQuestionBox() {
        if (!this.floatingCard) {
            console.error('[ArticleAssistant] No floating card available');
            return;
        }

        const questionBox = new QuestionBox(
            this.floatingCard,
            async (question) => {
                try {
                    console.log('[ArticleAssistant] Processing question:', question);
                    
                    // Get the article content
                    const extractedContent = TextProcessing.extractPageContent();
                    if (!extractedContent.content) {
                        throw new Error('Could not extract article content. Please try reloading the page.');
                    }
                    
                    // Send message to background script
                    const response = await chrome.runtime.sendMessage({
                        action: 'processQuestion',
                        content: question,
                        articleContent: extractedContent.content
                    });

                    if (!response) {
                        throw new Error('No response received from background script');
                    }

                    if (response.error) {
                        throw new Error(response.error);
                    }

                    if (!response.answer) {
                        throw new Error('No answer received in response');
                    }

                    // Add the Q&A to the main card
                    this.floatingCard.addCustomQA(question, response.answer);
                } catch (error) {
                    console.error('[ArticleAssistant] Error processing question:', error);
                    throw error;
                }
            }
        );

        questionBox.create();
    }

    clearHighlights() {
        this.highlights.clearHighlights();
        if (this.floatingCard) {
            this.floatingCard.remove();
            this.floatingCard = null;
        }
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
}

window.ArticleAssistant = ArticleAssistant; 