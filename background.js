let apiKey = '';
let currentModel = 'google/gemini-2.0-flash-001';

console.log('[ArticleAssistant] Script initialized - ' + new Date().toISOString());

// Initialize settings on startup
async function initializeSettings() {
    try {
        const settings = await chrome.storage.local.get(['apiKey', 'model']);
        if (settings.apiKey) {
            apiKey = settings.apiKey;
        }
        if (settings.model) {
            currentModel = settings.model;
            console.log('[ArticleAssistant] Model configuration loaded');
        }
    } catch (error) {
        console.error('[ArticleAssistant] Error loading settings');
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
    
    // Check if we have the right number of points
    if (data.points.length < 3 || data.points.length > 5) {
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processWithLLM') {
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
    } else if (request.action === 'processQuestion') {
        console.log('[ArticleAssistant] Processing question');
        if (!request.articleContent && currentArticleContent) {
            request.articleContent = currentArticleContent;
        }
        processQuestion(request.content, request.articleContent)
            .then(response => {
                console.log('[ArticleAssistant] Question processing completed');
                sendResponse({ answer: response });
            })
            .catch(error => {
                console.error('[ArticleAssistant] Error processing question');
                sendResponse({ error: error.message });
            });
        return true;
    } else if (request.action === 'setApiKey') {
        apiKey = request.apiKey;
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
            currentModel = changes.model.newValue;
            console.log('[ArticleAssistant] Model configuration updated');
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
        // Step 1: Generate Questions
        const questionsPrompt = `Based on the following article, generate exactly 3 essential questions.

        Format each question to be specific and focused.
        Article:
        ${content.content}
        
        Return ONLY the numbered questions, one per line.

        IMPORTANT GUIDELINES:
        - Provide exactly 3 questions
        - Make each question clear and direct
        - Do not use any ** in your response`;

        const questionsResponse = await callLLM(questionsPrompt);

        // Step 2: Generate Answers
        const answersPrompt = `Provide concise answers to these questions about the article. Keep each answer to 3-4 sentences maximum.
        
        Article:
        ${content.content}
        
        Questions:
        ${questionsResponse}
        
        Format your response exactly as follows:

        💡 MAIN POINTS
        Q: [Question]
        A: [3-4 sentence answer]

        Guidelines:
        - Keep answers focused but thorough (3-4 sentences)
        - Use clear, direct language
        - Avoid repetition
        - Include only the most important information`;

        const answersResponse = await callLLM(answersPrompt);

        // Step 3: Extract Quotes
        const quotesPrompt = `Based on the following article and answers, provide 3 exact quotes from the text that best support the key points discussed.

        Article:
        ${content.content}

        Analysis:
        ${answersResponse}

        Please provide exactly 3 quotes that are copied verbatim from the text. Each quote should be concise and directly support one of the main points.

        Format:
        1. "exact quote from text"
        2. "exact quote from text"
        3. "exact quote from text"`;

        const quotesResponse = await callLLM(quotesPrompt);

        // Format the final response as JSON
        const finalResponse = {
            points: extractQuotes(quotesResponse),
            summary: answersResponse
        };

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
        console.error('[ArticleAssistant] API request failed');
        throw new Error('API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
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
        
        Question: ${question}
        
        Article:
        ${content.content}
        
        Please provide a clear, concise, and accurate answer based solely on the information in the article.
        If the article doesn't contain information to answer the question, please state that clearly.
        
        Format your answer in 3-4 sentences maximum, using clear and direct language.`;

        const answer = await callLLM(customQuestionPrompt);

        return { answer };
    } catch (error) {
        relayLog('error', 'Error processing custom question:', error);
        throw error;
    }
}

// Update processQuestion to use article content
async function processQuestion(question, articleContent) {
    if (!apiKey) {
        throw new Error('OpenRouter API key not set');
    }

    if (!articleContent) {
        throw new Error('No article content available. Please reload the article and try again.');
    }

    try {
        const prompt = `You are a knowledgeable AI assistant helping to answer questions. Your goal is to provide accurate, balanced answers that combine your general knowledge with any relevant information from the provided article.

        Question: "${question}"

        Article content for reference:
        ${articleContent}

        Guidelines for your response:
        1. Prioritize your general knowledge and expertise first
        2. Reference the article only when it contains relevant, specific information that adds value
        3. Keep your answer concise but thorough - focus on quality over length
        4. Focus on answering the actual question being asked
        5. You don't need to explicitly state what comes from where - just provide a natural, informative answer

        Remember: You are a general AI assistant who happens to have access to this article, not an article-specific assistant.`;

        const response = await callLLM(prompt);
        return response.trim();
    } catch (error) {
        console.error('[ArticleAssistant] Error in question processing:', error);
        throw error;
    }
} 