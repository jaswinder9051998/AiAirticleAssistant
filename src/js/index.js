// Start initialization
if (window.top === window) {
    console.log('[ArticleAssistant] Content script starting in main world');
    ArticleManager.initialize().catch(error => {
        console.error('[ArticleAssistant] Initial initialization failed:', error);
    });
} else {
    console.log('[ArticleAssistant] Content script running in iframe - skipping initialization');
}

// Set up message listener
console.log('[ArticleAssistant] Setting up message listener');
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'log') {
        // Write to console with consistent prefix
        console[request.logType]('[ArticleAssistant]', request.logData);
        return true;
    }
    // Handle the message and ensure we keep the message channel open
    ArticleManager.handleMessage(request, sender, sendResponse);
    return true; // Keep the message channel open
}); 