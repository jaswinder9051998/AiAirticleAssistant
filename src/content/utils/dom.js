// Get node depth in DOM tree
export function getNodeDepth(node) {
    let depth = 0;
    let current = node;
    while (current.parentNode) {
        depth++;
        current = current.parentNode;
    }
    return depth;
}

// Get all text nodes in a range
export function getTextNodesInRange(range) {
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

// Analyze text structure of an element
export function analyzeTextStructure(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent.trim().length > 0) {
            textNodes.push({
                length: node.textContent.length,
                parentTag: node.parentElement?.tagName,
                depth: getNodeDepth(node),
                preview: node.textContent.trim().substring(0, 30)
            });
        }
    }

    return {
        totalNodes: textNodes.length,
        averageLength: textNodes.reduce((sum, node) => sum + node.length, 0) / textNodes.length,
        depthDistribution: textNodes.reduce((acc, node) => {
            acc[node.depth] = (acc[node.depth] || 0) + 1;
            return acc;
        }, {}),
        parentTagDistribution: textNodes.reduce((acc, node) => {
            acc[node.parentTag] = (acc[node.parentTag] || 0) + 1;
            return acc;
        }, {})
    };
}

// Clean page content
export function cleanPageContent(element) {
    const clone = element.cloneNode(true);
    
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

    return clone.innerText;
} 