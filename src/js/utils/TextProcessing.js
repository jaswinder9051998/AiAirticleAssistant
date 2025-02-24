class TextProcessing {
    static extractPageContent() {
        console.log('[ArticleAssistant] Starting content extraction');
        
        // Get selected text if any
        const selection = window.getSelection();
        let selectedText = '';
        if (selection && selection.rangeCount > 0) {
            selectedText = selection.toString().trim();
            if (selectedText) {
                console.log('[ArticleAssistant] Found selected text:', selectedText.substring(0, 100) + '...');
                return { content: selectedText, isSelection: true };
            }
        }

        // Use Readability for article extraction
        try {
            // Clone the document to avoid modifying the original
            const documentClone = document.cloneNode(true);
            
            // Create a new Readability object
            const reader = new Readability(documentClone, {
                debug: false,
                charThreshold: 20
            });
            
            // Parse the content
            const article = reader.parse();
            
            if (article && article.textContent) {
                console.log('[ArticleAssistant] Successfully extracted article:', {
                    title: article.title,
                    byline: article.byline,
                    length: article.textContent.length
                });
                
                return {
                    content: article.textContent,
                    isArticle: true,
                    metadata: {
                        title: article.title,
                        byline: article.byline,
                        excerpt: article.excerpt
                    }
                };
            }
        } catch (error) {
            console.error('[ArticleAssistant] Readability extraction failed:', error);
        }

        // Fallback to basic content extraction
        console.log('[ArticleAssistant] Falling back to basic content extraction');
        const mainContent = document.querySelector('article') || 
                          document.querySelector('main') || 
                          document.querySelector('[role="main"]');
        
        if (mainContent) {
            return { 
                content: this.extractTextContent(mainContent),
                isArticle: true
            };
        }

        // Final fallback to body content
        return { 
            content: document.body.innerText,
            isCleanedBody: true
        };
    }

    static extractTextContent(element) {
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

        // Extract text content while preserving structure
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

    static findLargestTextBlock() {
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
                    depth: this.getNodeDepth(node)
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
            return this.extractTextContent(blocks[0].element);
        }
        return null;
    }

    static getNodeDepth(node) {
        let depth = 0;
        let current = node;
        while (current.parentNode) {
            depth++;
            current = current.parentNode;
        }
        return depth;
    }

    static cleanPageContent(element) {
        // Clone the element to avoid modifying the actual page
        const clone = element.cloneNode(true);
        
        // Log initial state
        console.log('[ArticleAssistant] Cleaning page content:', {
            originalLength: element.innerText.length,
            elementsToRemove: [
                'script', 'style', 'nav', 'header', 'footer', 
                'iframe', 'noscript', '.ad', '.advertisement',
                '.social-share', '.comments', '.sidebar'
            ].join(', ')
        });
        
        // Remove unwanted elements
        const selectorsToRemove = [
            'script', 'style', 'nav', 'header', 'footer', 
            'iframe', 'noscript', '.ad', '.advertisement',
            '.social-share', '.comments', '.sidebar'
        ];
        
        let removedCount = 0;
        selectorsToRemove.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => {
                el.remove();
                removedCount++;
            });
        });

        console.log('[ArticleAssistant] Content cleaning complete:', {
            elementsRemoved: removedCount,
            finalLength: clone.innerText.length
        });

        return clone.innerText;
    }
}

window.TextProcessing = TextProcessing; 