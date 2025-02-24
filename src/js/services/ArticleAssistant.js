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
                const range = this.highlights.findTextRange(point);
                if (range) {
                    try {
                        // Always highlight using individual text nodes within the range
                        const nodes = this.highlights.getTextNodesInRange(range);
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
}

window.ArticleAssistant = ArticleAssistant; 