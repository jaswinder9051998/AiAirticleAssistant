class Highlights {
    constructor() {
        this.highlights = new Map();
    }

    findTextRange(text) {
        console.log('[ArticleAssistant] Starting findTextRange with text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
        
        // Find the article container - try multiple selectors to improve chances of finding the content
        const selectors = ['article', '[role="main"]', 'main', '.article', '.post', '.content', '.article-content', '#article-body', '.story-body'];
        let articleElement = null;
        
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                articleElement = el;
                console.log('[ArticleAssistant] Found article container using selector:', selector);
                break;
            }
        }
        
        if (!articleElement) {
            console.error('[ArticleAssistant] No article element found using any selector');
            // Fallback to body as last resort
            articleElement = document.body;
        }

        // Normalize search text for more reliable matching
        const normalizeText = (str) => {
            return str.toLowerCase()
                     .replace(/[\u2018\u2019'']/g, "'")
                     .replace(/[\u201C\u201D""]/g, '"')
                     .replace(/\s+/g, ' ')
                     .replace(/\n/g, ' ') // Replace newlines with spaces
                     .replace(/\t/g, ' ') // Replace tabs with spaces
                     .replace(/\r/g, '') // Remove carriage returns
                     .trim();
        };
        
        const normalizedSearchText = normalizeText(text);
        console.log('[ArticleAssistant] Normalized search text:', normalizedSearchText.substring(0, 100) + (normalizedSearchText.length > 100 ? '...' : ''));

        // Try exact match first
        console.log('[ArticleAssistant] Attempting exact match...');
        const exactRange = this.findExactText(articleElement, normalizedSearchText);
        if (exactRange) {
            console.log('[ArticleAssistant] Exact match found!');
            return exactRange;
        }
        
        // If exact match fails, try fuzzy matching with different strategies
        console.log('[ArticleAssistant] Exact match failed, trying fuzzy match');
        const fuzzyRange = this.findFuzzyText(articleElement, normalizedSearchText);
        
        if (fuzzyRange) {
            console.log('[ArticleAssistant] Fuzzy match found!');
            return fuzzyRange;
        }
        
        console.log('[ArticleAssistant] All matching methods failed for text:', normalizedSearchText.substring(0, 100));
        return null;
    }
    
    findExactText(container, searchText) {
        // Get all text nodes in the article
        const textNodes = [];
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip hidden elements and unwanted content
                    const parent = node.parentElement;
                    if (!parent || 
                        parent.closest('script, style, noscript, .article-assistant-floating-card, nav, header:not(article header), footer:not(article footer)') ||
                        getComputedStyle(parent).display === 'none' ||
                        getComputedStyle(parent).visibility === 'hidden') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.SKIP;
                }
            }
        );

        let node;
        let fullText = '';
        while (node = walker.nextNode()) {
            const nodeText = node.textContent.trim();
            if (nodeText) {
                textNodes.push({
                    node: node,
                    startIndex: fullText.length,
                    text: nodeText
                });
                fullText += nodeText + ' ';
            }
        }

        // Normalize full text
        const normalizeText = (str) => {
            return str.toLowerCase()
                     .replace(/[\u2018\u2019'']/g, "'")
                     .replace(/[\u201C\u201D""]/g, '"')
                     .replace(/\s+/g, ' ')
                     .replace(/\n/g, ' ') // Replace newlines with spaces
                     .replace(/\t/g, ' ') // Replace tabs with spaces
                     .replace(/\r/g, '') // Remove carriage returns
                     .trim();
        };
        
        const normalizedFullText = normalizeText(fullText);

        // Find the text position
        const textIndex = normalizedFullText.indexOf(searchText);
        if (textIndex === -1) {
            console.log('[ArticleAssistant] Text not found in exact search:', {
                searchTextLength: searchText.length,
                searchTextSample: searchText.substring(0, 50) + (searchText.length > 50 ? '...' : ''),
                fullTextLength: normalizedFullText.length,
                fullTextSample: normalizedFullText.substring(0, 200) + (normalizedFullText.length > 200 ? '...' : '')
            });
            return null;
        }

        // Find start and end nodes
        let startNode = null;
        let endNode = null;
        let startOffset = 0;
        let endOffset = 0;

        let currentIndex = 0;
        for (const nodeInfo of textNodes) {
            const nodeTextLength = nodeInfo.text.length + 1; // +1 for the space
            
            if (!startNode && currentIndex + nodeTextLength > textIndex) {
                startNode = nodeInfo.node;
                startOffset = textIndex - currentIndex;
            }
            
            if (!endNode && currentIndex + nodeTextLength > textIndex + searchText.length) {
                endNode = nodeInfo.node;
                endOffset = Math.min(textIndex + searchText.length - currentIndex, nodeInfo.text.length);
                break;
            }
            
            currentIndex += nodeTextLength;
        }

        if (!startNode || !endNode) {
            console.error('[ArticleAssistant] Could not find text boundaries in exact search');
            return null;
        }

        try {
            // Create the range
            const range = document.createRange();
            
            // Make sure offsets are within valid bounds
            startOffset = Math.max(0, Math.min(startOffset, startNode.textContent.length));
            endOffset = Math.max(0, Math.min(endOffset, endNode.textContent.length));
            
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
            return range;
        } catch (error) {
            console.error('[ArticleAssistant] Error creating range in exact search:', error);
            return null;
        }
    }
    
    findFuzzyText(container, searchText) {
        // Try with different variations of paragraph breaks or line breaks
        const variations = [
            searchText,
            searchText.replace(/\.\s+/g, '. '),  // Normalize period + whitespace combinations
            searchText.replace(/\.\s+/g, '.'),   // Remove spaces after periods
            searchText.replace(/\s+/g, ' ')      // Normalize all whitespace
        ];
        
        for (const variant of variations) {
            const variantRange = this.findExactText(container, variant);
            if (variantRange) {
                console.log('[ArticleAssistant] Found variant match');
                return variantRange;
            }
        }
        
        // If search text is too long, try with segments
        if (searchText.length > 100) {
            // Try the first 100 characters
            const firstSegment = searchText.substring(0, 100);
            const firstRange = this.findExactText(container, firstSegment);
            
            if (firstRange) {
                console.log('[ArticleAssistant] Found first segment of long text');
                return this.expandRangeForBetterVisibility(firstRange, container);
            }
            
            // Try middle 100 characters
            if (searchText.length > 200) {
                const middleStart = Math.floor(searchText.length / 2) - 50;
                const middleSegment = searchText.substring(middleStart, middleStart + 100);
                const middleRange = this.findExactText(container, middleSegment);
                
                if (middleRange) {
                    console.log('[ArticleAssistant] Found middle segment of long text');
                    return this.expandRangeForBetterVisibility(middleRange, container);
                }
            }
            
            // Try last 100 characters
            const lastSegment = searchText.substring(searchText.length - 100);
            const lastRange = this.findExactText(container, lastSegment);
            
            if (lastRange) {
                console.log('[ArticleAssistant] Found last segment of long text');
                return this.expandRangeForBetterVisibility(lastRange, container);
            }
            
            // Try first 75% of the text
            const partialSegment = searchText.substring(0, Math.floor(searchText.length * 0.75));
            const partialRange = this.findExactText(container, partialSegment);
            
            if (partialRange) {
                console.log('[ArticleAssistant] Found partial segment of long text');
                return this.expandRangeForBetterVisibility(partialRange, container);
            }
            
            // Try larger chunks between 200-300 chars
            for (let i = 0; i < searchText.length - 200; i += 100) {
                const chunkSize = Math.min(300, searchText.length - i);
                const chunk = searchText.substring(i, i + chunkSize);
                const chunkRange = this.findExactText(container, chunk);
                
                if (chunkRange) {
                    console.log('[ArticleAssistant] Found chunk in long text at position', i);
                    return this.expandRangeForBetterVisibility(chunkRange, container);
                }
            }
        }
        
        // Split into chunks and try to match any chunk
        const words = searchText.split(' ');
        if (words.length > 5) {
            // Try different segments of the text with various window sizes
            const windowSizes = [10, 8, 5];
            
            for (const windowSize of windowSizes) {
                if (words.length <= windowSize) continue;
                
                // Try beginning, middle, and end sections
                const segments = [
                    words.slice(0, windowSize).join(' '),
                    words.slice(Math.floor(words.length/2) - Math.floor(windowSize/2), 
                                Math.floor(words.length/2) + Math.ceil(windowSize/2)).join(' '),
                    words.slice(-windowSize).join(' ')
                ];
                
                for (const segment of segments) {
                    if (segment.length < 15) continue; // Skip very short segments
                    
                    const segmentRange = this.findExactText(container, segment);
                    if (segmentRange) {
                        console.log('[ArticleAssistant] Found segment of text:', segment);
                        return this.expandRangeForBetterVisibility(segmentRange, container);
                    }
                }
                
                // Try sliding window approach
                if (words.length > windowSize * 2) {
                    for (let i = windowSize; i < words.length - windowSize; i += Math.ceil(windowSize/2)) {
                        const segment = words.slice(i, i + windowSize).join(' ');
                        if (segment.length < 15) continue;
                        
                        const segmentRange = this.findExactText(container, segment);
                        if (segmentRange) {
                            console.log('[ArticleAssistant] Found sliding window segment at position', i);
                            return this.expandRangeForBetterVisibility(segmentRange, container);
                        }
                    }
                }
            }
        }
        
        // If all else fails, try matching distinctive phrases of the quote
        // Find phrases that are 3-4 words long and unique
        for (let i = 0; i < words.length - 3; i++) {
            const phrase = words.slice(i, i + 4).join(' ');
            if (phrase.length > 15) { // Only use reasonably distinctive phrases
                const phraseRange = this.findExactText(container, phrase);
                if (phraseRange) {
                    console.log('[ArticleAssistant] Found distinctive phrase:', phrase);
                    return this.expandRangeForBetterVisibility(phraseRange, container);
                }
            }
        }
        
        console.log('[ArticleAssistant] Failed to find text with all fuzzy methods');
        return null;
    }
    
    // Expand the range to include more surrounding context for better visibility
    expandRangeForBetterVisibility(range, container) {
        try {
            // Get the common ancestor and examine siblings
            const ancestor = range.commonAncestorContainer;
            let startNode = range.startContainer;
            let endNode = range.endContainer;
            
            // If we're working with short text fragments, try to expand to paragraph level
            if (startNode === endNode && startNode.textContent.length < 100) {
                // Find the nearest paragraph or block element
                let blockParent = startNode.parentNode;
                while (blockParent && 
                       blockParent !== container && 
                       getComputedStyle(blockParent).display !== 'block') {
                    blockParent = blockParent.parentNode;
                }
                
                if (blockParent && blockParent !== container) {
                    const expandedRange = document.createRange();
                    expandedRange.selectNodeContents(blockParent);
                    console.log('[ArticleAssistant] Expanded range to block level');
                    return expandedRange;
                }
            }
            
            return range;
        } catch (error) {
            console.error('[ArticleAssistant] Error expanding range:', error);
            return range; // Return the original range if expansion fails
        }
    }

    getTextNodesInRange(range) {
        const nodes = [];
        
        // Handle the case where the range spans multiple blocks
        const commonAncestor = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentNode
            : range.commonAncestorContainer;
            
        console.log('[ArticleAssistant] Getting text nodes in range with common ancestor:', 
                   commonAncestor.nodeName, 
                   commonAncestor.className);
        
        const walker = document.createTreeWalker(
            commonAncestor,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip empty nodes and hidden content
                    if (!node.textContent.trim()) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    const parent = node.parentNode;
                    if (parent && 
                        (parent.closest('script, style, noscript, .article-assistant-floating-card') ||
                         getComputedStyle(parent).display === 'none')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    if (range.intersectsNode(node)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            nodes.push(node);
        }
        
        console.log('[ArticleAssistant] Found', nodes.length, 'text nodes in range');
        return nodes;
    }

    clearHighlights() {
        document.querySelectorAll('.article-assistant-highlight').forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });
        this.highlights.clear();
    }

    showTooltip(event) {
        const highlight = event.target;
        const summary = highlight.dataset.summary;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'article-assistant-tooltip';
        tooltip.textContent = summary;
        
        // Position the tooltip
        const rect = highlight.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        
        document.body.appendChild(tooltip);
        highlight.tooltip = tooltip;
    }

    hideTooltip(event) {
        const highlight = event.target;
        if (highlight.tooltip) {
            highlight.tooltip.remove();
            highlight.tooltip = null;
        }
    }

    // Add a new method to find all instances of a text
    findAllTextRanges(text) {
        console.log('[ArticleAssistant] Starting findAllTextRanges with text:', text);
        
        if (!text || text.trim().length === 0) {
            console.error('[ArticleAssistant] Empty text provided to findAllTextRanges');
            return [];
        }
        
        // Find the article container - try multiple selectors to improve chances of finding the content
        const selectors = ['article', '[role="main"]', 'main', '.article', '.post', '.content', '.article-content', '#article-body', '.story-body'];
        let articleElement = null;
        
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                articleElement = el;
                console.log('[ArticleAssistant] Found article container using selector:', selector);
                break;
            }
        }
        
        if (!articleElement) {
            console.error('[ArticleAssistant] No article element found using any selector');
            // Fallback to body as last resort
            articleElement = document.body;
        }

        // Normalize search text for more reliable matching
        const normalizeText = (str) => {
            return str.toLowerCase()
                     .replace(/[\u2018\u2019'']/g, "'")
                     .replace(/[\u201C\u201D""]/g, '"')
                     .replace(/\s+/g, ' ')
                     .replace(/\n/g, ' ') // Replace newlines with spaces
                     .replace(/\t/g, ' ') // Replace tabs with spaces
                     .replace(/\r/g, '') // Remove carriage returns
                     .trim();
        };
        
        const normalizedSearchText = normalizeText(text);
        console.log('[ArticleAssistant] Normalized search text:', normalizedSearchText);

        // Get all text nodes in the article
        const textNodes = [];
        const walker = document.createTreeWalker(
            articleElement,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip hidden elements and unwanted content
                    const parent = node.parentElement;
                    if (!parent || 
                        parent.closest('script, style, noscript, .article-assistant-floating-card, .article-assistant-vocab, nav, header:not(article header), footer:not(article footer)') ||
                        getComputedStyle(parent).display === 'none' ||
                        getComputedStyle(parent).visibility === 'hidden') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.SKIP;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        // Find all occurrences of the text
        const ranges = [];
        
        for (let i = 0; i < textNodes.length; i++) {
            const currentNode = textNodes[i];
            const normalizedNodeText = normalizeText(currentNode.textContent);
            
            // Check if this node contains the search text
            let startIndex = normalizedNodeText.indexOf(normalizedSearchText);
            
            // If found in this node
            while (startIndex !== -1) {
                try {
                    // Create a range for this occurrence
                    const range = document.createRange();
                    range.setStart(currentNode, startIndex);
                    range.setEnd(currentNode, startIndex + normalizedSearchText.length);
                    
                    // Add to our collection
                    ranges.push(range);
                    
                    // Look for next occurrence in this node
                    startIndex = normalizedNodeText.indexOf(normalizedSearchText, startIndex + 1);
                } catch (error) {
                    console.error('[ArticleAssistant] Error creating range in findAllTextRanges:', error);
                    break;
                }
            }
            
            // Check for text that spans multiple nodes
            if (normalizedSearchText.length > normalizedNodeText.length && i < textNodes.length - 1) {
                // Try to find text that spans across nodes
                let combinedText = normalizedNodeText;
                let endNodeIndex = i;
                let endOffset = 0;
                
                // Build up text across nodes until we have enough to match
                for (let j = i + 1; j < textNodes.length && combinedText.length < normalizedSearchText.length + 20; j++) {
                    const nextNodeText = normalizeText(textNodes[j].textContent);
                    combinedText += ' ' + nextNodeText;
                    
                    // Check if combined text contains our search text
                    startIndex = combinedText.indexOf(normalizedSearchText);
                    if (startIndex !== -1) {
                        // We found a match that spans nodes
                        try {
                            // Calculate which node contains the end of our text
                            let remainingLength = normalizedSearchText.length;
                            let currentStartIndex = startIndex;
                            let startNodeIndex = i;
                            let startOffset = 0;
                            
                            // Find start node and offset
                            for (let k = i; k <= j; k++) {
                                const nodeText = normalizeText(textNodes[k].textContent);
                                if (k === i) {
                                    // First node
                                    if (currentStartIndex < nodeText.length) {
                                        // Start is in this node
                                        startNodeIndex = k;
                                        startOffset = currentStartIndex;
                                        remainingLength -= (nodeText.length - currentStartIndex);
                                    } else {
                                        // Start is in a later node
                                        currentStartIndex -= nodeText.length + 1; // +1 for the space we added
                                    }
                                } else {
                                    // Subsequent nodes
                                    if (currentStartIndex <= nodeText.length) {
                                        // Start is in this node
                                        startNodeIndex = k;
                                        startOffset = currentStartIndex;
                                        remainingLength -= (nodeText.length - currentStartIndex);
                                        break;
                                    } else {
                                        // Start is in a later node
                                        currentStartIndex -= nodeText.length + 1; // +1 for the space we added
                                    }
                                }
                            }
                            
                            // Find end node and offset
                            for (let k = startNodeIndex; k <= j && remainingLength > 0; k++) {
                                const nodeText = normalizeText(textNodes[k].textContent);
                                if (k === startNodeIndex) {
                                    // Starting node
                                    if (remainingLength <= nodeText.length - startOffset) {
                                        // End is in this node
                                        endNodeIndex = k;
                                        endOffset = startOffset + remainingLength;
                                        remainingLength = 0;
                                        break;
                                    } else {
                                        // End is in a later node
                                        remainingLength -= (nodeText.length - startOffset);
                                    }
                                } else {
                                    // Subsequent nodes
                                    if (remainingLength <= nodeText.length) {
                                        // End is in this node
                                        endNodeIndex = k;
                                        endOffset = remainingLength;
                                        remainingLength = 0;
                                        break;
                                    } else {
                                        // End is in a later node
                                        remainingLength -= nodeText.length;
                                    }
                                }
                            }
                            
                            // Create the range if we found valid start and end points
                            if (remainingLength === 0) {
                                const multiNodeRange = document.createRange();
                                multiNodeRange.setStart(textNodes[startNodeIndex], startOffset);
                                multiNodeRange.setEnd(textNodes[endNodeIndex], endOffset);
                                ranges.push(multiNodeRange);
                            }
                        } catch (error) {
                            console.error('[ArticleAssistant] Error creating multi-node range:', error);
                        }
                    }
                }
            }
        }
        
        console.log(`[ArticleAssistant] Found ${ranges.length} occurrences of "${text}"`);
        return ranges;
    }
}

window.Highlights = Highlights; 