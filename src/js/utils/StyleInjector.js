class StyleInjector {
    static injectStyles() {
        const styles = `
            .article-assistant-floating-card {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 500px;
                background: #FFFFFF;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                z-index: 999999;
                resize: none;
                overflow: hidden;
                min-height: 200px;
            }

            .article-assistant-card-header {
                background: #1A1A1A;
                padding: 16px 20px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .article-assistant-card-title {
                font-size: 16px;
                font-weight: 600;
                color: #FFFFFF;
            }

            .article-assistant-card-content {
                padding: 20px;
                overflow-y: auto;
                max-height: calc(85vh - 60px);
            }

            .article-assistant-qa-pair {
                margin-bottom: 24px;
                padding: 16px;
                background: #F8F9FA;
                border-radius: 8px;
                border: 1px solid #E0E6ED;
            }

            .article-assistant-question {
                font-weight: 600;
                color: #1A1A1A;
                margin-bottom: 12px;
                font-size: 15px;
                line-height: 1.5;
            }

            .article-assistant-answer {
                color: #333333;
                font-size: 14px;
                line-height: 1.6;
                white-space: pre-wrap;
            }

            .article-assistant-quotes-section {
                border-top: 1px solid #E5E5E5;
                margin-top: 24px;
                padding-top: 24px;
            }

            .article-assistant-quotes-section h3 {
                font-size: 15px;
                font-weight: 600;
                color: #1A1A1A;
                margin: 0 0 16px 0;
            }

            .article-assistant-points {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .article-assistant-point {
                padding: 12px 16px;
                margin: 8px 0;
                background: #F5F5F5;
                border-radius: 6px;
                font-size: 14px;
                color: #333333;
                cursor: pointer;
                transition: background 0.2s ease;
            }

            .article-assistant-point:hover {
                background: #EEEEEE;
            }

            .article-assistant-highlight {
                background: rgba(255, 255, 0, 0.3);
                border-bottom: 1px solid rgba(255, 200, 0, 0.5);
            }

            .article-assistant-card-button {
                background: none;
                border: none;
                color: #FFFFFF;
                font-size: 18px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
            }

            .article-assistant-card-button:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .article-assistant-resize-handle {
                position: absolute;
                top: 0;
                width: 10px;
                height: 100%;
                cursor: ew-resize;
                z-index: 1000000;
                background: transparent;
                opacity: 0;
            }

            .article-assistant-resize-handle.left {
                left: -5px;
            }

            .article-assistant-resize-handle.right {
                right: -5px;
            }
        `;

        const styleSheet = document.createElement("style");
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

window.StyleInjector = StyleInjector; 