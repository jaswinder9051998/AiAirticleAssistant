let apiKey = '';
let currentModel = 'google/gemini-2.0-flash-001';

console.log('[Background] Script initialized - ' + new Date().toISOString());

// Initialize settings on startup
async function initializeSettings() {
    console.log('[Background] Initializing settings');
    try {
        const settings = await chrome.storage.local.get(['apiKey', 'model']);
        if (settings.apiKey) {
            apiKey = settings.apiKey;
            console.log('[Background] API key loaded');
        }
        if (settings.model) {
            currentModel = settings.model;
            console.log('[Background] Model set to:', currentModel);
        }
    } catch (error) {
        console.error('[Background] Error loading settings:', error);
    }
}

// Call initialization immediately
initializeSettings();

// Helper function to safely parse JSON
function safeJSONParse(str) {
    try {
        return { result: JSON.parse(str), error: null };
    } catch (e) {
        console.error('[Background] JSON parse error:', e);
        console.log('[Background] Problematic JSON string:', str);
        return { result: null, error: e };
    }
}

// Helper function to validate response format
function validateResponse(data) {
    // Check if points array exists and is an array
    if (!Array.isArray(data?.points)) {
        console.error('[Background] Invalid points format:', data);
        return false;
    }
    
    // Check if we have the right number of points
    if (data.points.length < 3 || data.points.length > 5) {
        console.error('[Background] Invalid number of points:', data.points.length);
        return false;
    }
    
    // Check if all points are strings
    for (const point of data.points) {
        if (typeof point !== 'string' || point.trim().length === 0) {
            console.error('[Background] Invalid point format:', point);
            return false;
        }
    }
    
    // Check if summary exists and is a string
    if (typeof data.summary !== 'string' || data.summary.trim().length === 0) {
        console.error('[Background] Invalid or missing summary:', data.summary);
        return false;
    }
    
    return true;
}

// Test content script communication when a tab is activated
chrome.tabs.onActivated.addListener(function(activeInfo) {
    console.log('[Background] Tab activated, testing content script communication');
    chrome.tabs.sendMessage(
        activeInfo.tabId,
        { action: 'test', message: 'Testing content script communication' },
        function(response) {
            console.log('[Background] Content script test response:', response);
            if (chrome.runtime.lastError) {
                console.error('[Background] Content script communication error:', chrome.runtime.lastError);
            }
        }
    );
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background] Received message:', request.action, 'from tab:', sender.tab?.id);
    
    if (request.action === 'processWithLLM') {
        console.log('[Background] Processing content with LLM, model:', currentModel);
        processContent(request.content)
            .then(response => {
                console.log('[Background] LLM processing successful:', response);
                sendResponse(response);
            })
            .catch(error => {
                console.error('[Background] Error processing content:', error);
                sendResponse({ error: error.message });
            });
        return true;
    } else if (request.action === 'setApiKey') {
        console.log('[Background] Setting API key');
        apiKey = request.apiKey;
        // No need to save to storage here as it's already done in popup.js
        sendResponse({ success: true });
        return true;
    }
});

// Listen for settings changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
        console.log('[Background] Settings changed:', changes);
        if (changes.apiKey) {
            apiKey = changes.apiKey.newValue || '';
            console.log('[Background] API key updated');
        }
        if (changes.model) {
            currentModel = changes.model.newValue;
            console.log('[Background] Model updated to:', currentModel);
        }
    }
});

async function processContent(content) {
    if (!apiKey) {
        console.error('[Background] No API key set');
        throw new Error('OpenRouter API key not set');
    }

    try {
        console.log('[Background] Sending request to OpenRouter API');
        console.log('[Background] Content length:', content.content.length);
        
        // More explicit system prompt with examples
        const systemPrompt = `You are a JSON-only response assistant that helps identify important points in articles and provides a summary.
You must ALWAYS respond with valid JSON only, using this EXACT format:

{
    "points": [
        "The United States has committed an additional $1.2 billion in military aid to Ukraine, marking the largest single package this year",
        "European allies have pledged to match U.S. contributions, bringing the total support to over $2.5 billion",
        "The aid package includes advanced air defense systems and artillery ammunition, addressing Ukraine's critical battlefield needs"
    ],
    "summary": "The article discusses a significant increase in Western military support for Ukraine, with the U.S. leading a coordinated effort alongside European allies to provide comprehensive military assistance, focusing on air defense and artillery capabilities."
}

Critical Formatting Rules:
1. Start your response with { and end with } - NO OTHER CHARACTERS ALLOWED
2. DO NOT wrap response in code blocks (no \`\`\`)
3. DO NOT add language indicators (no 'json' prefix)
4. DO NOT add any markdown formatting
5. Points must be EXACT QUOTES from the article
6. Include 3-5 most important points
7. Summary should be 1-2 sentences
8. Use double quotes (") for all strings
9. Response must be pure JSON that can be parsed by JSON.parse()

What your response should NOT include:
❌ \`\`\`json
❌ \`\`\`
❌ markdown formatting
❌ type prefixes
❌ single quotes
❌ additional text or explanations
❌ line numbers
❌ bullet points or numbering

Your response must start with { and end with } - nothing else!`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'localhost',
                'X-Title': 'Article Assistant Extension'
            },
            body: JSON.stringify({
                model: currentModel,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: content.content
                    }
                ],
                temperature: 0.3, // Lower temperature for more consistent formatting
                max_tokens: 1500  // Ensure enough tokens for response
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[Background] API request failed:', errorData);
            throw new Error(errorData.error?.message || 'API request failed');
        }

        // Enhanced cleaning function
        function cleanResponse(response) {
            console.log('[Background] Starting response cleaning');
            console.log('[Background] Original response:', response);
            
            let cleaned = response;
            
            // Remove markdown code blocks and language indicators
            cleaned = cleaned.replace(/\`\`\`json\s*/g, '');  // Remove ```json
            cleaned = cleaned.replace(/\`\`\`\s*/g, '');      // Remove ```
            cleaned = cleaned.replace(/^json\s*/, '');        // Remove json prefix without backticks
            
            // Remove any leading/trailing whitespace
            cleaned = cleaned.trim();
            
            // If response is wrapped in quotes, remove them
            if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                cleaned = cleaned.slice(1, -1);
            }
            
            // Find the first { and last }
            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1) {
                cleaned = cleaned.slice(firstBrace, lastBrace + 1);
            }
            
            console.log('[Background] Cleaned response:', cleaned);
            
            // Verify the cleaned response starts with { and ends with }
            if (!cleaned.startsWith('{') || !cleaned.endsWith('}')) {
                console.error('[Background] Cleaning failed to produce valid JSON structure');
                throw new Error('Failed to clean response into valid JSON format');
            }
            
            return cleaned;
        }

        // Update the response cleaning section
        const rawResponseText = await response.text();
        console.log('[Background] Raw OpenRouter response text:', rawResponseText);
        
        // Add detailed format analysis logging
        console.log('[Background] Response prefix check:', {
            firstFiveChars: rawResponseText.substring(0, 5),
            hasJsonPrefix: rawResponseText.startsWith('json'),
            hasQuotedJsonPrefix: rawResponseText.startsWith('"json'),
            hasCodeBlock: rawResponseText.includes('```'),
            firstCurlyBrace: rawResponseText.indexOf('{'),
            lastCurlyBrace: rawResponseText.lastIndexOf('}'),
            firstValidJSONChar: rawResponseText.search(/[{[]/)
        });

        // Clean the response
        let cleanedResponse = cleanResponse(rawResponseText);
        console.log('[Background] Cleaned response for parsing:', cleanedResponse);
        
        // Parse the cleaned response text
        let data;
        try {
            data = JSON.parse(cleanedResponse);
            console.log('[Background] Successfully parsed cleaned response');
        } catch (error) {
            console.error('[Background] Parse error after cleaning:', error);
            console.log('[Background] Failed to parse cleaned response:', {
                startsWithCurlyBrace: cleanedResponse.trimStart().startsWith('{'),
                endsWithCurlyBrace: cleanedResponse.trimEnd().endsWith('}'),
                length: cleanedResponse.length,
                firstFewChars: cleanedResponse.substring(0, 20),
                lastFewChars: cleanedResponse.slice(-20)
            });
            throw new Error('Failed to parse OpenRouter response');
        }
        
        console.log('[Background] Parsed OpenRouter response:', data);
        
        // Extract and clean the LLM response
        const llmResponse = data.choices[0].message.content.trim();
        console.log('[Background] Raw LLM response:', llmResponse);
        
        // Check if response starts and ends with curly braces
        if (!llmResponse.startsWith('{') || !llmResponse.endsWith('}')) {
            console.error('[Background] Response is not JSON formatted:', llmResponse);
            throw new Error('LLM response is not in JSON format');
        }

        // Try to parse the response as JSON
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(llmResponse);
            console.log('[Background] Successfully parsed JSON:', parsedResponse);
        } catch (error) {
            console.error('[Background] JSON parse error:', error);
            console.log('[Background] Failed JSON string:', llmResponse);
            
            // Try to clean the response
            const cleanedResponse = llmResponse
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
                .replace(/\\'/g, "'")                          // Fix escaped single quotes
                .replace(/\\"/g, '"')                         // Fix escaped double quotes
                .replace(/`/g, '"')                           // Replace backticks with double quotes
                .replace(/\n/g, ' ');                         // Remove newlines
            
            console.log('[Background] Cleaned response:', cleanedResponse);
            
            try {
                parsedResponse = JSON.parse(cleanedResponse);
                console.log('[Background] Successfully parsed cleaned JSON:', parsedResponse);
            } catch (secondError) {
                console.error('[Background] Failed to parse cleaned JSON:', secondError);
                throw new Error('Failed to parse LLM response as JSON');
            }
        }

        // Validate the response format
        if (!validateResponse(parsedResponse)) {
            console.error('[Background] Invalid response structure:', parsedResponse);
            throw new Error('Invalid response format from LLM');
        }

        console.log('[Background] Final validated response:', {
            points: parsedResponse.points,
            summary: parsedResponse.summary
        });
        
        return {
            points: parsedResponse.points,
            summary: parsedResponse.summary
        };
    } catch (error) {
        console.error('[Background] Error calling OpenRouter API:', error);
        throw error;
    }
} 