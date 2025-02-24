import { manager } from './manager.js';

// Set up message listener
console.log('[ArticleAssistant] Content script loaded - ' + new Date().toISOString());

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'log') {
        // Write to console with consistent prefix
        console[request.logType]('[ArticleAssistant]', request.logData);
        return true;
    }
    // Handle the message and ensure we keep the message channel open
    manager.handleMessage(request, sender, sendResponse);
    return true;
});

// Start initialization if in main world
if (window.top === window) {
    console.log('[ArticleAssistant] Content script starting in main world');
    manager.initialize().catch(error => {
        console.error('[ArticleAssistant] Initial initialization failed:', error);
    });
} else {
    console.log('[ArticleAssistant] Content script running in iframe - skipping initialization');
} 