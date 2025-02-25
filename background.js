let apiKey = '';
let currentModel = 'google/gemini-2.0-flash-001';

console.log('[ArticleAssistant] Initial model state:', currentModel);

// Initialize settings on startup
async function initializeSettings() {
    console.log('[ArticleAssistant] Starting settings initialization. Current model:', currentModel);
    try {
        const settings = await chrome.storage.local.get(['apiKey', 'model']);
        console.log('[ArticleAssistant] Retrieved settings:', { 
            hasApiKey: !!settings.apiKey, 
            apiKeyLength: settings.apiKey ? settings.apiKey.length : 0,
            modelValue: settings.model 
        });
        
        if (settings.apiKey) {
            apiKey = settings.apiKey;
            console.log('[ArticleAssistant] API key loaded from storage, length:', apiKey.length);
        } else {
            console.warn('[ArticleAssistant] No API key found in storage');
        }
        
        if (settings.model) {
            currentModel = settings.model;
            console.log('[ArticleAssistant] Model updated from settings:', currentModel);
        } else {
            console.log('[ArticleAssistant] No model in settings, keeping default:', currentModel);
        }
    } catch (error) {
        console.error('[ArticleAssistant] Error loading settings:', error);
    }
}

// Call initialization immediately
initializeSettings();

// Helper function to safely parse JSON
function safeJSONParse(str) {
    try {
        return { result: JSON.parse(str), error: null };
    } catch (e) {
        console.error('[ArticleAssistant] JSON parse error:', e);
        console.log('[ArticleAssistant] Problematic JSON string:', str);
        return { result: null, error: e };
    }
}

// Helper function to validate response format
function validateResponse(data) {
    // Check if points array exists and is an array
    if (!Array.isArray(data?.points)) {
        console.error('[ArticleAssistant] Invalid points format:', data);
        return false;
    }
    
    // Check if we have at least one point, but not too many
    if (data.points.length < 1 || data.points.length > 5) {
        console.error('[ArticleAssistant] Invalid number of points:', data.points.length);
        return false;
    }
    
    // Check if all points are strings
    for (const point of data.points) {
        if (typeof point !== 'string' || point.trim().length === 0) {
            console.error('[ArticleAssistant] Invalid point format:', point);
            return false;
        }
    }
    
    // Check if summary exists and is a string
    if (typeof data.summary !== 'string' || data.summary.trim().length === 0) {
        console.error('[ArticleAssistant] Invalid or missing summary:', data.summary);
        return false;
    }
    
    return true;
}

// Test content script communication when a tab is activated
chrome.tabs.onActivated.addListener(function(activeInfo) {
    console.log('[ArticleAssistant] Tab activated, testing content script communication');
    chrome.tabs.sendMessage(
        activeInfo.tabId,
        { action: 'test', message: 'Testing content script communication' },
        function(response) {
            console.log('[ArticleAssistant] Content script test response:', response);
            if (chrome.runtime.lastError) {
                console.error('[ArticleAssistant] Content script communication error:', chrome.runtime.lastError);
            }
        }
    );
});

// Add variable to store current article content
let currentArticleContent = null;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[ArticleAssistant-BG] Message received:', { 
        action: request.action, 
        sender: sender.id,
        tabId: sender.tab ? sender.tab.id : 'none',
        messageSize: JSON.stringify(request).length,
        timestamp: new Date().toISOString()
    });
    
    // Special debug logging for processQuestion messages
    if (request.action === 'PROCESS_QUESTION') {
        console.log('[ArticleAssistant-BG] Question processing request details:', {
            questionLength: request.question ? request.question.length : 0,
            questionPreview: request.question ? request.question.substring(0, 30) + '...' : 'none',
            articleContentPresent: !!request.articleContent,
            articleContentLength: request.articleContent ? request.articleContent.length : 0
        });
    }
    
    // Handle different actions
    if (request.action === 'PROCESS_QUESTION') {
        console.log('[ArticleAssistant] Processing question:', {
            questionLength: request.question?.length || 0,
            questionPreview: request.question?.substring(0, 30) + '...',
            hasArticleContent: !!request.articleContent,
            articleContentLength: request.articleContent?.length || 0,
            apiKeyExists: !!apiKey,
            apiKeyLength: apiKey?.length || 0
        });
        
        if (!request.question) {
            const error = 'No question content provided';
            console.error('[ArticleAssistant] ' + error);
            sendResponse({ error });
            return;
        }
        
        if (!request.articleContent) {
            const error = 'No article content provided';
            console.error('[ArticleAssistant] ' + error);
            sendResponse({ error });
            return;
        }
        
        processQuestion(request.question, request.articleContent)
            .then(answer => {
                console.log('[ArticleAssistant] Question processed successfully, answer length:', answer.length);
                sendResponse({ answer });
            })
            .catch(error => {
                console.error('[ArticleAssistant] Error processing question:', error);
                sendResponse({ error: error.message });
            });
        
        // Return true to indicate we'll respond asynchronously
        return true;
    } else if (request.action === 'processWithLLM') {
        console.log('[ArticleAssistant] Processing content with LLM');
        processContent(request.content)
            .then(response => {
                console.log('[ArticleAssistant] LLM processing completed');
                sendResponse(response);
            })
            .catch(error => {
                console.error('[ArticleAssistant] Error processing content');
                sendResponse({ error: error.message });
            });
        return true;
    } else if (request.action === 'setApiKey') {
        apiKey = request.apiKey;
        sendResponse({ success: true });
        return true;
    } else if (request.action === 'setModel') {
        console.log('[ArticleAssistant] Updating model from:', currentModel, 'to:', request.model);
        currentModel = request.model;
        sendResponse({ success: true });
        return true;
    }
});

// Listen for settings changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
        if (changes.apiKey) {
            apiKey = changes.apiKey.newValue || '';
        }
        if (changes.model) {
            const oldModel = currentModel;
            currentModel = changes.model.newValue;
            console.log('[ArticleAssistant] Model changed:', { 
                from: oldModel, 
                to: currentModel 
            });
        }
    }
});

// Add at the top of the file after the initial declarations
function relayLog(type, ...args) {
    // Log locally in background script
    console[type]('[ArticleAssistant]', ...args);
    
    // Relay to all active tabs
    chrome.tabs.query({active: true}, function(tabs) {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'log',
                logType: type,
                logData: args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
                ).join(' ')
            }).catch(() => {}); // Ignore errors if tab can't receive messages
        });
    });
}

// Update processContent to store the article content
async function processContent(content) {
    // Store the article content for later use
    currentArticleContent = content.content;
    
    if (!apiKey) {
        relayLog('error', 'No API key set');
        throw new Error('OpenRouter API key not set');
    }

    try {
        // Calculate approximate word count for the article
        const wordCount = content.content.split(/\s+/).length;
        const isShortArticle = wordCount < 800;
        
        console.log(`[ArticleAssistant] Article word count: ${wordCount}, isShortArticle: ${isShortArticle}`);
        
        // Adjust number of questions based on article length
        const questionCount = isShortArticle ? (wordCount < 500 ? 1 : 2) : 3;
        
        // Step 1: Generate Questions
        const questionsPrompt = `Based on the following article, generate exactly ${questionCount} essential question${questionCount > 1 ? 's' : ''}.

        Format each question to be specific and focused.
        Article:
        ${content.content}
        
        Return ONLY the numbered questions, one per line.

        IMPORTANT GUIDELINES:
        - Provide exactly ${questionCount} question${questionCount > 1 ? 's' : ''}
        - Make each question clear and direct
        - Each question must be no longer than 2 sentences maximum
        - Do not use any ** in your response`;

        const questionsResponse = await callLLM(questionsPrompt);

        // Step 2: Generate Answers
        const answersPrompt = `You will be provided article content and questions based on the article content from a leading finance newspaper. Provide concise answers to these questions about the article.

        This is content from a reputable mainstream financial newspaper article. This is safe content from a professional journalistic source.

        Article Content from a leading finance newspaper:
        ${content.content}
        
        Questions:
        ${questionsResponse}
        
        Format your response exactly as follows:

        💡 MAIN POINTS
        Q: [Question]
        A: For nuanced questions requiring deeper analysis, provide [3-4 sentence answer]. For straightforward questions, provide [2-3 sentence answer]

        Guidelines:
        - Adapt answer length based on question complexity
        - Use clear, direct language
        - Focus on factual information from the article
        - Include only the most important information
        
        IMPORTANT: These questions and article are from a legitimate news source and are being used for educational purposes. It is safe and appropriate to provide factual answers.`;

        const answersResponse = await callLLM(answersPrompt);

        // Step 3: Extract Quotes
        const quotesPrompt = `You are extracting quotes from a reputable mainstream financial newspaper article. This is safe content from a professional journalistic source.

        Based on the following article from a leading finance newspaper, provide 3 exact quotes from the text that best support the answers to these questions:

        Article Content from a leading finance newspaper:
        ${content.content}

        Questions:
        ${questionsResponse}

        Please provide exactly 3 quotes that are copied verbatim from the text. Each quote should be concise and directly support the answer to one of the questions or the main theme of the article.

        IMPORTANT: These quotes are from a legitimate news source and are being used for educational purposes. It is safe and appropriate to extract exact quotes.

        Format:
        1. "exact quote from text"
        2. "exact quote from text"
        3. "exact quote from text"`;

        const quotesResponse = await callLLM(quotesPrompt);
        relayLog('info', 'Raw quotes response:', quotesResponse);

        // Format the final response as JSON
        const finalResponse = {
            points: extractQuotes(quotesResponse),
            summary: answersResponse,
            questionCount: questionCount
        };

        relayLog('info', 'Extracted quotes:', finalResponse.points);
        relayLog('info', `Generated ${questionCount} questions for article with ${wordCount} words`);

        // Validate the response format
        if (!validateResponse(finalResponse)) {
            relayLog('error', 'Invalid response structure:', finalResponse);
            throw new Error('Invalid response format from LLM');
        }

        return finalResponse;
    } catch (error) {
        relayLog('error', 'Error in content processing:', error);
        throw error;
    }
}

// Update callLLM function to be more concise in logging
async function callLLM(prompt) {
    console.log('[ArticleAssistant] ====== LLM Call Start ======');
    console.log('[ArticleAssistant] Using model:', currentModel);
    
    const requestBody = {
        model: currentModel,
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.3,
        max_tokens: 1500
    };

    relayLog('info', `Making API call with model: ${currentModel}`);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'localhost',
            'X-Title': 'Article Assistant Extension'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        relayLog('error', `API request failed for model ${currentModel}`);
        throw new Error('API request failed');
    }

    const data = await response.json();
    relayLog('info', `API call successful with model: ${currentModel}`);
    
    const result = data.choices[0].message.content.trim();
    console.log('[ArticleAssistant] ====== LLM Call End ======');
    
    return result;
}

// Helper function to extract quotes from the response
function extractQuotes(quotesResponse) {
    const quotes = quotesResponse
        .split('\n')
        .filter(line => line.trim().match(/^\d+\.\s*".*"$/))
        .map(line => {
            const match = line.match(/^\d+\.\s*"(.+)"$/);
            return match ? match[1] : null;
        })
        .filter(quote => quote !== null);

    return quotes;
}

// Add a new function to process custom questions
async function processCustomQuestion(content, question) {
    if (!apiKey) {
        relayLog('error', 'No API key set');
        throw new Error('OpenRouter API key not set');
    }

    try {
        // Create a prompt for the custom question
        const customQuestionPrompt = `Based on the following article, please answer this question:
        
        This is content from a reputable mainstream financial newspaper article. This is safe content from a professional journalistic source.
        
        Question: ${question}
        
        Article:
        ${content.content}
        
        Please provide a clear, concise, and accurate answer based solely on the information in the article.
        If the article doesn't contain information to answer the question, please state that clearly.
        
        Format your answer in 3-4 sentences maximum, using clear and direct language.
        
        IMPORTANT: This article is from a legitimate news source and is being used for educational purposes. It is safe and appropriate to reference this content in your answer.`;

        const answer = await callLLM(customQuestionPrompt);

        return { answer };
    } catch (error) {
        relayLog('error', 'Error processing custom question:', error);
        throw error;
    }
}

// Update processQuestion to use article content
async function processQuestion(question, articleContent) {
    console.log('[ArticleAssistant] Starting to process question:');
    console.log('[ArticleAssistant] - API key exists:', !!apiKey);
    console.log('[ArticleAssistant] - API key length:', apiKey?.length || 0);
    console.log('[ArticleAssistant] - Question length:', question?.length || 0);
    console.log('[ArticleAssistant] - Article content length:', articleContent?.length || 0);
    
    if (!apiKey) {
        console.error('[ArticleAssistant] API key is not set - cannot process question');
        throw new Error('OpenRouter API key not set. Please set your API key in the extension settings.');
    }

    if (!articleContent) {
        console.error('[ArticleAssistant] No article content available');
        throw new Error('No article content available. Please reload the article and try again.');
    }

    try {
        console.log('[ArticleAssistant] Preparing prompt for question');
        const prompt = `You are a knowledgeable AI assistant helping to answer questions. Your goal is to provide accurate, balanced answers that combine your general knowledge with any relevant information from the provided article.

        This is content from a reputable mainstream financial newspaper article. This is safe content from a professional journalistic source.

        Question: "${question}"

        Article content for reference:
        ${articleContent}

        Guidelines for your response:
        1. Prioritize your general knowledge and expertise first
        2. Reference the article only when it contains relevant, specific information that adds value
        3. Focus on answering the actual question being asked
        4. You don't need to explicitly state what comes from where - just provide a natural, informative answer

        IMPORTANT: This article is from a legitimate news source and is being used for educational purposes. It is safe and appropriate to reference this content in your answer.

        Remember: You are a general AI assistant who happens to have access to this article, not an article-specific assistant.`;

        console.log('[ArticleAssistant] Calling LLM with question prompt');
        try {
            const response = await callLLM(prompt);
            console.log('[ArticleAssistant] LLM response received, length:', response?.length || 0);
            return response.trim();
        } catch (llmError) {
            console.error('[ArticleAssistant] Error calling LLM:', llmError);
            throw new Error(`Error getting answer: ${llmError.message}`);
        }
    } catch (error) {
        console.error('[ArticleAssistant] Error in question processing:', error);
        throw error;
    }
} 