import { getTextNodesInRange } from '../utils/dom.js';

export class TextHighlighter {
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

            return range;
        } catch (error) {
            console.error('[ArticleAssistant] Error creating range:', error);
            return null;
        }
    }

    highlightRange(range, index) {
        if (!range) return;

        try {
            // Get all text nodes in the range
            const nodes = getTextNodesInRange(range);
            const startNode = range.startContainer;
            const endNode = range.endContainer;
            const startOffset = range.startOffset;
            const endOffset = range.endOffset;

            // Create highlights for each text node
            for (const node of nodes) {
                const nodeText = node.textContent;
                let highlightStart = 0;
                let highlightEnd = nodeText.length;

                if (node === startNode) {
                    highlightStart = startOffset;
                }
                if (node === endNode) {
                    highlightEnd = endOffset;
                }

                if (highlightStart < highlightEnd) {
                    const nodeRange = document.createRange();
                    nodeRange.setStart(node, highlightStart);
                    nodeRange.setEnd(node, highlightEnd);

                    const highlightEl = document.createElement('span');
                    highlightEl.className = 'article-assistant-highlight';
                    nodeRange.surroundContents(highlightEl);

                    // Store the highlight element
                    if (!this.highlights.has(index)) {
                        this.highlights.set(index, []);
                    }
                    this.highlights.get(index).push(highlightEl);
                }
            }
        } catch (error) {
            console.error('[ArticleAssistant] Error creating highlight:', error);
        }
    }

    scrollToHighlight(index) {
        const highlights = this.highlights.get(index);
        if (highlights && highlights.length > 0) {
            highlights[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.updateActiveHighlight(index);
        }
    }

    updateActiveHighlight(activeIndex) {
        // Remove active class from all highlights
        this.highlights.forEach((highlights, index) => {
            highlights.forEach(el => {
                el.classList.toggle('active', index === activeIndex);
            });
        });
    }

    clearHighlights() {
        this.highlights.forEach(highlights => {
            highlights.forEach(el => {
                const parent = el.parentNode;
                if (parent) {
                    parent.replaceChild(document.createTextNode(el.textContent), el);
                    parent.normalize();
                }
            });
        });
        this.highlights.clear();
    }
} 