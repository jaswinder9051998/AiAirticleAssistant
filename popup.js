// Debug flag
const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) {
        console.log('[ArticleAssistant]', ...args);
    }
}

// Initialize popup when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    debugLog('Popup DOM loaded');

    // Cache DOM elements
    const elements = {
        apiKeyInput: document.getElementById('apiKey'),
        apiKeyInputGroup: document.getElementById('apiKeyInputGroup'),
        apiKeyDisplay: document.getElementById('apiKeyDisplay'),
        modelSelect: document.getElementById('model'),
        saveSettingsBtn: document.getElementById('saveSettings'),
        deleteKeyBtn: document.getElementById('deleteKey'),
        processBtn: document.getElementById('process'),
        clearBtn: document.getElementById('clear'),
        statusDiv: document.getElementById('status'),
        errorDiv: document.getElementById('error'),
        setupRequiredDiv: document.getElementById('setupRequired')
    };

    // Verify all elements are found
    Object.entries(elements).forEach(([name, element]) => {
        if (!element) {
            console.error(`[ArticleAssistant] Could not find element: ${name}`);
        }
    });

    debugLog('DOM elements cached');

    function updateUIWithApiKey(hasKey) {
        debugLog('Updating UI with API key state:', hasKey);
        if (hasKey) {
            elements.apiKeyInputGroup.classList.remove('visible');
            elements.apiKeyDisplay.classList.add('visible');
            elements.setupRequiredDiv.style.display = 'none';
            elements.processBtn.disabled = false;
        } else {
            elements.apiKeyInputGroup.classList.add('visible');
            elements.apiKeyDisplay.classList.remove('visible');
            elements.setupRequiredDiv.style.display = 'block';
            elements.processBtn.disabled = true;
        }
    }

    // Load saved settings
    try {
        debugLog('Loading saved settings');
        const settings = await chrome.storage.local.get(['apiKey', 'model']);
        debugLog('Settings loaded:', { hasApiKey: !!settings.apiKey, model: settings.model });
        
        // Initialize UI based on stored API key
        if (settings.apiKey) {
            elements.apiKeyInput.value = settings.apiKey;
            updateUIWithApiKey(true);
            
            // Also update the background script
            chrome.runtime.sendMessage({ 
                action: 'setApiKey', 
                apiKey: settings.apiKey 
            });
        } else {
            updateUIWithApiKey(false);
        }

        if (settings.model) {
            elements.modelSelect.value = settings.model;
        }
    } catch (error) {
        console.error('[ArticleAssistant] Error loading settings:', error);
        showError('Failed to load settings');
    }

    // Save settings
    elements.saveSettingsBtn.addEventListener('click', async () => {
        debugLog('Save settings clicked');
        const apiKey = elements.apiKeyInput.value.trim();
        const model = elements.modelSelect.value;

        if (!apiKey) {
            showError('Please enter an OpenRouter API key');
            return;
        }

        try {
            debugLog('Saving settings');
            await chrome.storage.local.set({ apiKey, model });
            
            // Update the background script with both API key and model
            await chrome.runtime.sendMessage({ 
                action: 'setApiKey', 
                apiKey: apiKey 
            });
            
            await chrome.runtime.sendMessage({
                action: 'setModel',
                model: model
            });
            
            debugLog('Settings saved successfully');
            updateUIWithApiKey(true);
            showStatus('Settings saved successfully');
        } catch (error) {
            console.error('[ArticleAssistant] Error saving settings:', error);
            showError('Failed to save settings');
        }
    });

    // Add immediate model update when selection changes
    elements.modelSelect.addEventListener('change', async () => {
        debugLog('Model selection changed');
        const model = elements.modelSelect.value;
        
        try {
            // Save to storage
            await chrome.storage.local.set({ model });
            
            // Update background script immediately
            await chrome.runtime.sendMessage({
                action: 'setModel',
                model: model
            });
            
            debugLog('Model updated successfully');
            showStatus('Model updated');
        } catch (error) {
            console.error('[ArticleAssistant] Error updating model:', error);
            showError('Failed to update model');
        }
    });

    // Delete API key
    elements.deleteKeyBtn.addEventListener('click', async () => {
        debugLog('Delete key clicked');
        try {
            await chrome.storage.local.remove('apiKey');
            elements.apiKeyInput.value = '';
            
            // Update the background script
            await chrome.runtime.sendMessage({ 
                action: 'setApiKey', 
                apiKey: '' 
            });
            
            updateUIWithApiKey(false);
            showStatus('API key deleted');
        } catch (error) {
            console.error('[ArticleAssistant] Error deleting API key:', error);
            showError('Failed to delete API key');
        }
    });

    // Process article
    elements.processBtn.addEventListener('click', async () => {
        debugLog('Process article clicked');
        
        try {
            elements.processBtn.disabled = true;
            showStatus('Processing article...');

            // Get the current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) {
                throw new Error('No active tab found');
            }

            debugLog('Sending processArticle message to content script');
            const response = await sendMessageWithTimeout(tab.id, { action: 'processArticle' }, 30000);
            debugLog('Received response:', response);

            if (response.error) {
                throw new Error(response.error);
            }

            showStatus('Article processed successfully');
        } catch (error) {
            console.error('[ArticleAssistant] Error processing article:', error);
            showError(error.message || 'Failed to process article');
        } finally {
            elements.processBtn.disabled = false;
        }
    });

    // Clear highlights
    elements.clearBtn.addEventListener('click', async () => {
        debugLog('Clear highlights clicked');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) {
                throw new Error('No active tab found');
            }

            debugLog('Sending clearHighlights message to content script');
            await sendMessageWithTimeout(tab.id, { action: 'clearHighlights' }, 5000);
            showStatus('Highlights cleared');
        } catch (error) {
            console.error('[ArticleAssistant] Error clearing highlights:', error);
            showError('Failed to clear highlights');
        }
    });

    function showStatus(message) {
        debugLog('Status:', message);
        elements.statusDiv.textContent = message;
        elements.errorDiv.textContent = '';
        setTimeout(() => {
            elements.statusDiv.textContent = '';
        }, 3000);
    }

    function showError(message) {
        debugLog('Error:', message);
        elements.errorDiv.textContent = message;
        elements.statusDiv.textContent = '';
    }

    // Helper function to send messages with timeout
    function sendMessageWithTimeout(tabId, message, timeout) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Message timeout'));
            }, timeout);

            chrome.tabs.sendMessage(tabId, message, response => {
                clearTimeout(timeoutId);
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response || {});
                }
            });
        });
    }
}); 