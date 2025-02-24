export function injectStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .article-assistant-floating-card {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-width: 90vw;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            max-height: 80vh;
            overflow: hidden;
            transition: height 0.3s ease;
        }
        
        .article-assistant-card-header {
            padding: 16px 20px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #e5e5e5;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            user-select: none;
            z-index: 10000;
        }
        
        .article-assistant-card-title {
            font-size: 16px;
            font-weight: 600;
            color: #202124;
            margin: 0;
        }
        
        .article-assistant-card-content {
            padding: 20px;
            overflow-y: auto;
            flex-grow: 1;
        }
        
        .article-assistant-card-footer {
            padding: 12px 20px;
            background-color: #f8f9fa;
            border-top: 1px solid #e5e5e5;
            display: block !important;
            position: relative;
            z-index: 10000;
        }
        
        .article-assistant-reveal-question-button {
            display: block !important;
            width: 100%;
            padding: 12px 20px;
            background-color: #1a73e8;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 15px;
            cursor: pointer;
            text-align: center;
            position: relative;
            z-index: 10001;
        }
        
        .article-assistant-reveal-question-button:hover {
            background-color: #1765cc;
        }
        
        .article-assistant-question-input-container {
            padding: 20px;
            border-top: 1px solid #e5e5e5;
            display: none;
        }
        
        .article-assistant-question-input-title {
            font-size: 16px;
            font-weight: 600;
            color: #202124;
            margin: 0 0 12px 0;
        }
        
        .article-assistant-question-textarea {
            width: 100%;
            min-height: 80px;
            padding: 12px;
            border: 1px solid #dadce0;
            border-radius: 8px;
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
            margin-bottom: 12px;
            box-sizing: border-box;
        }
        
        .article-assistant-question-textarea:focus {
            outline: none;
            border-color: #1a73e8;
            box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
        }
        
        .article-assistant-submit-question-button {
            padding: 10px 16px;
            background-color: #1a73e8;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            cursor: pointer;
        }
        
        .article-assistant-submit-question-button:hover {
            background-color: #1765cc;
        }
        
        .article-assistant-submit-question-button:disabled {
            background-color: #dadce0;
            cursor: not-allowed;
        }
        
        .article-assistant-custom-qa-container {
            margin-top: 20px;
            border-top: 1px solid #e5e5e5;
            padding-top: 20px;
        }
        
        .article-assistant-custom-qa-pair {
            margin-bottom: 20px;
            padding: 16px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #1a73e8;
        }
        
        .article-assistant-custom-question {
            font-weight: 600;
            color: #202124;
            margin: 0 0 12px 0;
        }
        
        .article-assistant-custom-answer {
            color: #5f6368;
            line-height: 1.5;
            margin: 0;
            white-space: pre-wrap;
        }
        
        .article-assistant-qa-pair {
            margin-bottom: 20px;
        }
        
        .article-assistant-question {
            font-weight: 600;
            color: #202124;
            margin: 0 0 8px 0;
        }
        
        .article-assistant-answer {
            color: #5f6368;
            line-height: 1.5;
            margin: 0;
        }
        
        .article-assistant-quotes-section {
            margin-top: 24px;
        }
        
        .article-assistant-quotes-title {
            font-size: 16px;
            font-weight: 600;
            color: #202124;
            margin: 0 0 12px 0;
        }
        
        .article-assistant-quotes-list {
            list-style-type: none;
            padding: 0;
            margin: 0;
        }
        
        .article-assistant-quote-item {
            padding: 12px 16px;
            background-color: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .article-assistant-quote-item:hover {
            background-color: #e8f0fe;
        }
        
        .article-assistant-quote-text {
            color: #5f6368;
            line-height: 1.5;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .article-assistant-highlight {
            background-color: rgba(255, 213, 0, 0.3);
            cursor: pointer;
        }
        
        .article-assistant-highlight.active {
            background-color: rgba(255, 213, 0, 0.6);
        }
        
        .article-assistant-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 6px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #5f6368;
            transition: background-color 0.2s;
        }
        
        .article-assistant-button:hover {
            background-color: rgba(95, 99, 104, 0.1);
        }
        
        .article-assistant-resize-handle {
            position: absolute;
            width: 10px;
            height: 100%;
            top: 0;
            cursor: ew-resize;
        }
        
        .article-assistant-resize-handle-left {
            left: 0;
        }
        
        .article-assistant-resize-handle-right {
            right: 0;
        }
    `;
    document.head.appendChild(styleElement);
    console.log('[ArticleAssistant] Styles injected');
} 