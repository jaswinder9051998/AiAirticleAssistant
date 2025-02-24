class Highlights {
    constructor() {
        this.highlights = new Map();
    }

    findTextRange(text) {
        console.log('[ArticleAssistant] Starting findTextRange with full text:', text);
        
        // Find the article container
        const articleElement = document.querySelector('article');
        if (!articleElement) {
            console.error('[ArticleAssistant] No article element found');
            return null;
        }

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
                        parent.closest('script, style, noscript, .article-assistant-floating-card') ||
                        getComputedStyle(parent).display === 'none') {
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

        // Normalize search text and full text
        const normalizeText = (str) => {
            return str.toLowerCase()
                     .replace(/[\u2018\u2019'']/g, "'")
                     .replace(/[\u201C\u201D""]/g, '"')
                     .replace(/\s+/g, ' ')
                     .trim();
        };

        const normalizedSearchText = normalizeText(text);
        const normalizedFullText = normalizeText(fullText);

        // Find the text position
        const textIndex = normalizedFullText.indexOf(normalizedSearchText);
        if (textIndex === -1) {
            console.log('[ArticleAssistant] Text not found:', {
                searchText: normalizedSearchText,
                fullTextSample: normalizedFullText.substring(0, 200)
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
            
            if (!endNode && currentIndex + nodeTextLength > textIndex + normalizedSearchText.length) {
                endNode = nodeInfo.node;
                endOffset = textIndex + normalizedSearchText.length - currentIndex;
                break;
            }
            
            currentIndex += nodeTextLength;
        }

        if (!startNode || !endNode) {
            console.error('[ArticleAssistant] Could not find text boundaries');
            return null;
        }

        try {
            // Create the range
            const range = document.createRange();
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);

            // Create highlight with inline styles
            const highlight = document.createElement('mark');
            highlight.className = 'article-assistant-highlight';
            Object.assign(highlight.style, {
                backgroundColor: 'rgba(255, 255, 0, 0.3)',
                borderBottom: '1px solid rgba(255, 200, 0, 0.5)',
                padding: '2px 0',
                borderRadius: '2px',
                display: 'inline',
                position: 'relative',
                zIndex: '1'
            });

            try {
                range.surroundContents(highlight);
                console.log('[ArticleAssistant] Successfully created highlight');
                return range;
            } catch (surroundError) {
                console.error('[ArticleAssistant] Error surrounding range:', surroundError);
                
                // Fallback: Try to highlight each text node in the range separately
                const nodes = this.getTextNodesInRange(range);
                for (const node of nodes) {
                    const nodeRange = document.createRange();
                    nodeRange.selectNodeContents(node);
                    const nodeHighlight = highlight.cloneNode();
                    nodeRange.surroundContents(nodeHighlight);
                }
                
                return range;
            }
        } catch (error) {
            console.error('[ArticleAssistant] Error creating range:', error);
            return null;
        }
    }

    getTextNodesInRange(range) {
        const nodes = [];
        const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
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
}

window.Highlights = Highlights; 