import { FloatingCard } from './ui/card.js';
import { QuestionCard } from './ui/questionCard.js';
import { TextHighlighter } from './ui/highlights.js';
import { extractTextContent, findLargestTextBlock } from './utils/text.js';

export class ArticleAssistant {
    constructor() {
        this.initialized = false;
        this.floatingCard = new FloatingCard();
        this.questionCard = new QuestionCard();
        this.highlighter = new TextHighlighter();
        this.articleContent = null;
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

    extractPageContent() {
        console.log('[ArticleAssistant] Starting content extraction');
        
        // Get selected text if any
        const selection = window.getSelection();
        let selectedText = '';
        if (selection && selection.rangeCount > 0) {
            selectedText = selection.toString().trim();
            console.log('[ArticleAssistant] Found selected text:', selectedText.substring(0, 100) + '...');
            return { content: selectedText, isSelection: true };
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
                content: extractTextContent(mainContent),
                isArticle: true
            };
        }

        // Final fallback: find largest text block
        const largestBlock = findLargestTextBlock();
        if (largestBlock) {
            return {
                content: largestBlock,
                isCleanedBody: true
            };
        }

        return { 
            content: document.body.innerText,
            isCleanedBody: true
        };
    }

    async processArticle() {
        const content = this.extractPageContent();
        // Store the article content for later use with custom questions
        this.articleContent = content;
        
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
            this.floatingCard.create(response.summary, response.points);
            this.floatingCard.setQuoteClickHandler(index => this.highlighter.scrollToHighlight(index));
            
            // Set up the question card handler
            this.floatingCard.onAskButtonClick = () => {
                const mainCardRect = this.floatingCard.card.getBoundingClientRect();
                this.questionCard.create(mainCardRect);
                this.questionCard.setAskQuestionHandler(question => this.handleCustomQuestion(question));
            };

            // Process highlights
            for (const [index, point] of response.points.entries()) {
                const range = this.highlighter.findTextRange(point);
                if (range) {
                    this.highlighter.highlightRange(range, index);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('[ArticleAssistant] Error processing article:', error);
            throw error;
        }
    }
    
    async handleCustomQuestion(question) {
        if (!this.articleContent) {
            console.error('[ArticleAssistant] No article content available for custom question');
            return Promise.reject(new Error('No article content available'));
        }
        
        try {
            console.log('[ArticleAssistant] Processing custom question:', question);
            
            // Create a custom prompt for the question
            const customQuestionPrompt = {
                action: 'askCustomQuestion',
                content: this.articleContent,
                question: question
            };
            
            // Send the question to the background script
            const response = await chrome.runtime.sendMessage(customQuestionPrompt);
            
            if (response.error) {
                console.error('[ArticleAssistant] Error processing custom question:', response.error);
                throw new Error(response.error);
            }
            
            // Add the Q&A to the floating card
            this.floatingCard.addCustomQA(question, response.answer);
            
            return response;
        } catch (error) {
            console.error('[ArticleAssistant] Error handling custom question:', error);
            throw error;
        }
    }

    clearHighlights() {
        this.highlighter.clearHighlights();
        this.floatingCard.remove();
    }
} 