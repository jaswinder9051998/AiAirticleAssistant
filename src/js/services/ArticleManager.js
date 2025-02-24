class ArticleManager {
    static instance = null;
    static initialized = false;
    static initializationPromise = null;

    static async initialize() {
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
    }

    static async handleMessage(request, sender, sendResponse) {
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
}

window.ArticleManager = ArticleManager; 