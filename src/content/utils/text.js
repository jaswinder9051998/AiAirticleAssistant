// Format answer text with proper styling
export function formatAnswerText(text) {
    // Remove markdown bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    
    // Split into sentences and paragraphs
    const sentences = text.split(/(?<=[.!?])\s+/);
    const paragraphs = [];
    let currentParagraph = [];
    
    sentences.forEach((sentence, index) => {
        sentence = sentence.trim();
        if (!sentence) return;

        // Start a new paragraph for key points or after long sentences
        if (sentence.includes(':') || 
            (currentParagraph.length > 0 && 
             (currentParagraph.join(' ').length > 150 || 
              sentence.length > 100))) {
            if (currentParagraph.length > 0) {
                paragraphs.push(currentParagraph.join(' '));
            }
            currentParagraph = [];
        }

        // Add special formatting for key points
        if (sentence.includes(':')) {
            if (currentParagraph.length > 0) {
                paragraphs.push(currentParagraph.join(' '));
                currentParagraph = [];
            }
            paragraphs.push(`<div class="key-point">${sentence}</div>`);
        } else {
            currentParagraph.push(sentence);
        }
    });

    // Add any remaining sentences
    if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
    }

    // Wrap each paragraph in <p> tags
    return paragraphs
        .map(p => p.startsWith('<div') ? p : `<p>${p}</p>`)
        .join('\n');
}

// Extract text content from an element
export function extractTextContent(element) {
    // Clone to avoid modifying the page
    const clone = element.cloneNode(true);
    
    // Remove unwanted elements
    const selectorsToRemove = [
        'script', 'style', 'noscript', 'iframe',
        'nav', 'header:not(article header)', 'footer:not(article footer)',
        '.ad', '.advertisement', '.social-share',
        '.comments', '.sidebar', '.related-articles',
        'button', '[role="button"]', '[data-ad]',
        '.newsletter', '.subscription', '.popup',
        'aside', '.aside', '[aria-hidden="true"]'
    ];
    
    selectorsToRemove.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Extract text content while preserving some structure
    const textParts = [];
    const walker = document.createTreeWalker(
        clone,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        null,
        false
    );

    let node;
    let lastWasBlock = false;
    while (node = walker.nextNode()) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const display = window.getComputedStyle(node).display;
            if (display === 'block' || display === 'list-item') {
                if (!lastWasBlock) {
                    textParts.push('\n');
                    lastWasBlock = true;
                }
            }
        } else if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                textParts.push(text);
                lastWasBlock = false;
            }
        }
    }

    return textParts.join(' ').replace(/\s+/g, ' ').trim();
}

// Find largest text block in the document
export function findLargestTextBlock() {
    const blocks = [];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
    );

    let node;
    while (node = walker.nextNode()) {
        // Skip hidden elements
        if (node.offsetParent === null) continue;
        
        // Get direct text content
        const text = Array.from(node.childNodes)
            .filter(child => child.nodeType === Node.TEXT_NODE)
            .map(child => child.textContent.trim())
            .join(' ');
            
        if (text.length > 100) { // Minimum threshold for a text block
            blocks.push({
                element: node,
                textLength: text.length,
                depth: getNodeDepth(node)
            });
        }
    }

    // Sort by text length and depth (prefer shallower nodes with more text)
    blocks.sort((a, b) => {
        const lengthDiff = b.textLength - a.textLength;
        if (lengthDiff !== 0) return lengthDiff;
        return a.depth - b.depth;
    });

    if (blocks.length > 0) {
        return extractTextContent(blocks[0].element);
    }
    return null;
} 