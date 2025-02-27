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
    } else if (request.action === 'identifyVocabulary') {
        console.log('[ArticleAssistant] Processing vocabulary identification request');
        identifyDifficultVocabulary(request.content)
            .then(response => {
                console.log('[ArticleAssistant] Vocabulary identification completed');
                sendResponse(response);
            })
            .catch(error => {
                console.error('[ArticleAssistant] Error identifying vocabulary');
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
    } else if (request.action === 'getApiKey') {
        getApiKey()
            .then(apiKey => {
                sendResponse({ apiKey });
            })
            .catch(error => {
                console.error('Error getting API key:', error);
                sendResponse({ error: error.message });
            });
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
        const questionsPrompt = `Based on the following article, generate exactly ${questionCount} essential question${questionCount > 1 ? 's' : ''} which when answered capture main points and meaning of the text.
        2.) When formulating your questions: 
            a. Address the central theme or argument 
            b. Identify key supporting ideas 
            c. Highlight important facts or evidence 
            d. Reveal the author's purpose or perspective 
            e. Explore any significant implications or conclusions. 

        Format each question to be specific and focused.
        Article:
        ${content.content}
        
        Return ONLY the numbered questions, one per line.

        IMPORTANT GUIDELINES:
        - Provide exactly ${questionCount} question${questionCount > 1 ? 's' : ''}
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
        - Feel free to use Markdown formatting such as **bold** or *italic* to emphasize important points or key concepts
        
        IMPORTANT: These questions and article are from a legitimate news source and are being used for educational purposes. It is safe and appropriate to provide factual answers.`;

        const answersResponse = await callLLM(answersPrompt);

        // Step 3: Extract Quotes
        const quotesPrompt = `You are extracting quotes from a reputable mainstream financial newspaper article. This is safe content from a professional journalistic source.

        Based on the following Q&A and article, provide 3 exact quotes from the text that best support these answers:

        Questions and Answers:
        ${answersResponse}

        Article Content from a leading finance newspaper:
        ${content.content}

        Please provide exactly 3 quotes that are copied verbatim from the text. Each quote should be concise and directly support one of the answers or the main theme of the article.

        IMPORTANT: 
        - These quotes are from a legitimate news source and are being used for educational purposes
        - Quotes must be exact matches from the article text
        - Choose quotes that provide strong evidence for the answers given above
        - Each quote should be relatively concise (preferably under 3 sentences)

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

        // Generate executive summary
        const executiveSummaryPrompt = `Based on the following Q&A content, create a concise executive summary in the form of numbered points. Each point should be derived from the Q&A content and should be no longer than 3 sentences.

        Q&A Content:
        ${answersResponse}

        Format your response as numbered points (1., 2., etc.).
        
        Each point should be self-contained and understandable without needing the context of the questions.
        Do not use any prefixes or labels.`;

        try {
            // Step 1: Generate the raw executive summary
            const rawExecutiveSummary = await callLLM(executiveSummaryPrompt);
            
            // Step 2: Format with bold and italics
            const formattingPrompt = `Take this executive summary and enhance it with markdown formatting:
            - Use **text** for important words, phrases, numbers, company names, and key terms that should be bold
            - Use *text* for significant changes, trends, or comparative terms that should be in italics
            
            Original summary:
            ${rawExecutiveSummary}
            
            Return ONLY the formatted summary with no introductory text, additional explanations, or conclusions.
            Never include phrases like "Here's the executive summary" or anything similar.
            Start directly with the formatted numbered points.`;
            
            const formattedExecutiveSummary = await callLLM(formattingPrompt);
            
            // Extra processing to remove any remaining intro text
            let cleanedSummary = formattedExecutiveSummary.trim();
            // Remove any lines before the first numbered point
            cleanedSummary = cleanedSummary.replace(/^.*?(?=1\.\s)/s, '');
            
            // Clean up the response to ensure it's properly formatted for display
            finalResponse.executiveSummary = cleanedSummary.trim();
            relayLog('info', 'Generated executive summary:', finalResponse.executiveSummary);
        } catch (error) {
            relayLog('error', 'Error generating executive summary:', error);
            throw new Error('Failed to generate executive summary');
        }

        // Generate statistics summary
        const statisticsPrompt = `You are analyzing content from a reputable mainstream financial newspaper article. This is safe content from a professional journalistic source being used for educational purposes.

        Analyze the following article and extract meaningful statistics that provide valuable insights for readers. Present them in a clear, organized structure.

        Article content:
        ${content.content}

        Format your response with two main sections:

        # **STATISTICAL TERMS**
        Define any statistical measures or technical terms used in the article. Format each definition EXACTLY as:
        • Term: Simple explanation in plain language.
        
        IMPORTANT FORMATTING RULES FOR TERMS:
        - Each term MUST end with a colon (":") before the definition
        - DO NOT wrap the term itself in double asterisks
        - Terms should be just the name (like "Yield", "GDP", "Inflation") followed by a colon
        
        Example CORRECT format:
        • Yield: The return an investor receives on a bond.
        • Inflation: A rise in general price level.
        
        Example INCORRECT format:
        • **Yield**: The return an investor receives on a bond.  <-- DO NOT do this
        • Yield - A rise in general price level.  <-- Missing colon

        # **KEY STATISTICS**
        Present key statistics in a numbered list format. For each statistic:
        • ALL numerical values MUST be wrapped in double asterisks like this: **3%**, **10 trillion**, **4.8%**
        • EVERY single number, percentage, or currency value MUST be wrapped in double asterisks
        • Use *italics* with single asterisk for changes/differences
        • Add brief context where needed
        • For comparisons, show both values in bold with double asterisks
        • Prefix each item with a number like "1. ", "2. ", etc.

        Example CORRECT format:
        1. On February **25**th, the yield on ten-year Treasury bonds fell to its lowest level since mid-December.
        2. In the two months after Mr. Trump won, ten-year yields rose by *half a percentage point* to **4.8%**, the highest in over a year.
        3. The Committee estimates that tax cuts could shrink federal revenue by as much as **$11 trillion** over the next decade, or **3% of GDP**.

        Example INCORRECT format:
        1. On February 25th, the yield on ten-year Treasury bonds fell... <-- Missing bold on numbers
        2. In the two months after Mr. Trump won, ten-year yields rose by half a percentage point to 4.8%... <-- Numbers not bold

        CRITICAL FORMATTING INSTRUCTIONS:
        - ALWAYS wrap ALL numerical values in double asterisks: **42%**, **1.5 million**, **$300 billion**
        - This includes ALL numbers like dates, percentages, amounts, years, etc.
        - Present statistics in a clear, numbered format
        - Include context and comparisons where relevant
        - Skip demographic details unless part of a meaningful trend
        - Focus on statistics that provide valuable insights
        - MAKE SURE EVERY SINGLE NUMBER USES DOUBLE ASTERISKS FOR BOLD FORMATTING

        IMPORTANT: This article is from a legitimate news source and is being used for educational purposes. It is safe and appropriate to reference this content in your analysis.`;

        try {
            const statisticsSummary = await callLLM(statisticsPrompt);
            finalResponse.statisticsSummary = statisticsSummary.trim();
            relayLog('info', 'Generated statistics summary:', finalResponse.statisticsSummary);
        } catch (error) {
            relayLog('error', 'Error generating statistics summary:', error);
            finalResponse.statisticsSummary = "No specific statistics found in the article.";
        }

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
    
    // Check if the question contains context from selected text
    const hasSelectedContext = question.includes('Context from selected text:');
    console.log('[ArticleAssistant] - Has selected text context:', hasSelectedContext);
    
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
        
        // Use a different prompt structure if we have selected text context
        let prompt;
        
        if (hasSelectedContext) {
            // The question already contains the context, so we'll use it directly
            prompt = `You are a knowledgeable AI assistant helping to answer questions about articles. Your goal is to provide balanced, informative answers that address the question using both your broader knowledge and the selected text context when relevant.

            This is content from a reputable mainstream financial newspaper article. This is safe content from a professional journalistic source.

            ${question}

            Article content for additional reference:
            ${articleContent}

            Guidelines for your response:
            1. First, provide a comprehensive answer using your general knowledge about the topic
            2. After providing general information, you may reference the selected text with a phrase like "In the context of the selected text..." if it adds specific relevant details
            3. Incorporate relevant information from the broader article when helpful
            4. Structure your response to start broad and then narrow to specifics from the selected text
            5. Don't feel constrained to only reference the article or selected text - prioritize a helpful, informative answer
            6. Feel free to use Markdown formatting such as **bold** or *italic* to emphasize important points or key concepts

            IMPORTANT: This article is from a legitimate news source and is being used for educational purposes. It is safe and appropriate to reference this content in your answer.`;
            
            console.log('[ArticleAssistant] Using knowledge-first, context-aware prompt structure');
        } else {
            // Standard prompt for general questions about the article
            prompt = `You are a knowledgeable AI assistant helping to answer questions. Your goal is to provide accurate, balanced answers that combine your general knowledge with relevant information from the provided article.

            This is content from a reputable mainstream financial newspaper article. This is safe content from a professional journalistic source.

            Question: "${question}"

            Article content for reference:
            ${articleContent}

            Guidelines for your response:
            1. Balance your general knowledge with information from the article
            2. Provide a comprehensive answer that addresses the question directly
            3. Include relevant information from the article when it adds value
            4. Don't feel constrained to only reference the article - use your broader knowledge
            5. Aim for a natural, informative response that doesn't explicitly state your sources
            6. Feel free to use Markdown formatting such as **bold** or *italic* to emphasize important points or key concepts

            IMPORTANT: This article is from a legitimate news source and is being used for educational purposes. It is safe and appropriate to reference this content in your answer.`;
            
            console.log('[ArticleAssistant] Using balanced standard prompt structure');
        }

        console.log('[ArticleAssistant] Prompt first 200 chars:', prompt.substring(0, 200) + '...');
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

// Function to identify difficult vocabulary in the article
async function identifyDifficultVocabulary(content) {
    console.log('[ArticleAssistant] Identifying difficult vocabulary...');
    
    try {
        // Get API key
        if (!apiKey) {
            console.error('[ArticleAssistant] No API key set');
            throw new Error('API key not set. Please set your API key in the extension options.');
        }
        
        // Prepare the content - limit to a reasonable size
        const maxContentLength = 10000;
        const truncatedContent = content.length > maxContentLength 
            ? content.substring(0, maxContentLength) + '...' 
            : content;
        
        // Construct the prompt for vocabulary identification
        const prompt = `
You are an educational assistant helping readers understand challenging vocabulary in articles.

Please analyze the following article content and identify 5-10 challenging words or phrases that might be difficult for an average reader to understand. For each word or phrase, provide TWO definitions:
1. A formal dictionary-style definition with part of speech
2. A simple, easy-to-understand explanation in plain language

Focus on:
1. Academic or specialized terminology
2. Uncommon or advanced vocabulary
3. Technical jargon
4. Words with nuanced meanings in this context

Format your response as a JSON array of objects with "word", "formal_definition", and "simple_definition" properties. Example:
[
  {
    "word": "ubiquitous",
    "formal_definition": "(adj.) existing or being everywhere at the same time; constantly encountered; widespread",
    "simple_definition": "found everywhere; very common and seen in many places"
  },
  {
    "word": "paradigm shift",
    "formal_definition": "(n.) a fundamental change in approach or underlying assumptions; a dramatic change in methodology or practice",
    "simple_definition": "a complete change in the way people think about or do something"
  }
]

Article content:
${truncatedContent}
`;
        
        console.log('[ArticleAssistant] Sending vocabulary identification request to LLM API...');
        
        // Make API request to identify vocabulary
        const response = await callLLM(prompt);
        console.log('[ArticleAssistant] Raw vocabulary response:', response);
        
        // Try to parse the JSON response
        try {
            // Look for JSON array in the response
            const jsonMatch = response.match(/\[\s*\{.*\}\s*\]/s);
            if (jsonMatch) {
                const vocabularyJson = jsonMatch[0];
                const vocabulary = JSON.parse(vocabularyJson);
                
                console.log('[ArticleAssistant] Successfully parsed vocabulary:', vocabulary);
                return { vocabulary };
            } else {
                // Try parsing the entire response as JSON
                const vocabulary = JSON.parse(response);
                if (Array.isArray(vocabulary)) {
                    console.log('[ArticleAssistant] Successfully parsed vocabulary from full response:', vocabulary);
                    return { vocabulary };
                } else {
                    throw new Error('Response is not a JSON array');
                }
            }
        } catch (parseError) {
            console.error('[ArticleAssistant] Error parsing vocabulary JSON:', parseError);
            console.log('[ArticleAssistant] Raw response that failed to parse:', response);
            
            // Fallback: Try to extract vocabulary manually with regex
            try {
                const vocabularyItems = [];
                const regex = /"word"\s*:\s*"([^"]+)"\s*,\s*"formal_definition"\s*:\s*"([^"]+)"\s*,\s*"simple_definition"\s*:\s*"([^"]+)"/g;
                let match;
                
                while ((match = regex.exec(response)) !== null) {
                    vocabularyItems.push({
                        word: match[1],
                        formal_definition: match[2],
                        simple_definition: match[3]
                    });
                }
                
                if (vocabularyItems.length > 0) {
                    console.log('[ArticleAssistant] Extracted vocabulary using regex:', vocabularyItems);
                    return { vocabulary: vocabularyItems };
                } else {
                    throw new Error('Could not extract vocabulary from LLM response');
                }
            } catch (regexError) {
                console.error('[ArticleAssistant] Error extracting vocabulary with regex:', regexError);
                throw new Error('Failed to parse vocabulary from LLM response');
            }
        }
    } catch (error) {
        console.error('[ArticleAssistant] Error in identifyDifficultVocabulary:', error);
        throw error;
    }
} 