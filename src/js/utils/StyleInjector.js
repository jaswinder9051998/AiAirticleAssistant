class StyleInjector {
    static injectStyles() {
        const styles = `
            .article-assistant-floating-card {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 500px;
                background: #FFFFFF;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.1);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                z-index: 999999;
                resize: none;
                overflow: hidden;
                min-height: 200px;
                transition: box-shadow 0.3s ease, transform 0.2s ease;
                border: 1px solid rgba(0, 0, 0, 0.05);
            }
            
            .article-assistant-floating-card:hover {
                box-shadow: 0 12px 36px rgba(0, 0, 0, 0.14), 0 5px 10px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1);
            }

            .article-assistant-card-header {
                background: linear-gradient(to right, #1E1E1E, #2D2D2D);
                padding: 16px 24px;
                border-radius: 16px 16px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                position: relative;
                z-index: 2;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }

            .article-assistant-card-title {
                font-size: 18px;
                font-weight: 600;
                color: #FFFFFF;
                letter-spacing: -0.01em;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            }

            .article-assistant-card-content {
                padding: 0;
                overflow-y: auto;
                max-height: calc(85vh - 60px);
                scrollbar-width: thin;
                scrollbar-color: #D1D5DB #F3F4F6;
            }
            
            .article-assistant-card-content::-webkit-scrollbar {
                width: 8px;
            }
            
            .article-assistant-card-content::-webkit-scrollbar-track {
                background: #F3F4F6;
                border-radius: 0 0 16px 0;
            }
            
            .article-assistant-card-content::-webkit-scrollbar-thumb {
                background-color: #D1D5DB;
                border-radius: 20px;
                border: 2px solid #F3F4F6;
            }

            .article-assistant-qa-pair {
                margin: 0 24px 24px 24px;
                padding: 20px;
                background: #F9FAFB;
                border-radius: 12px;
                border: 1px solid rgba(0, 0, 0, 0.06);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
                transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            
            .article-assistant-qa-pair:hover {
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.04);
                transform: translateY(-1px);
            }
            
            .article-assistant-qa-pair:first-of-type {
                margin-top: 24px;
            }

            .article-assistant-question {
                font-weight: 700;
                color: #111827;
                margin-bottom: 14px;
                font-size: 16px;
                line-height: 1.5;
                letter-spacing: -0.01em;
            }

            .article-assistant-answer {
                color: #4B5563;
                font-size: 15px;
                line-height: 1.6;
                white-space: pre-wrap;
                font-weight: 400;
            }

            .article-assistant-quotes-section {
                border-top: 1px solid rgba(0, 0, 0, 0.06);
                margin: 12px 24px 0 24px;
                padding-top: 24px;
                padding-bottom: 24px;
            }

            .article-assistant-quotes-section h3 {
                font-size: 16px;
                font-weight: 700;
                color: #111827;
                margin: 0 0 16px 0;
                letter-spacing: -0.01em;
            }

            .article-assistant-points {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .article-assistant-point {
                padding: 16px 20px;
                margin: 12px 0;
                background: #F3F4F6;
                border-radius: 10px;
                font-size: 15px;
                color: #4B5563;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid transparent;
                position: relative;
                overflow: hidden;
            }

            .article-assistant-point:hover {
                background: #E5E7EB;
                color: #111827;
                border-color: rgba(0, 0, 0, 0.08);
                transform: translateY(-2px);
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.04);
            }
            
            .article-assistant-point:active {
                transform: translateY(0);
            }
            
            .article-assistant-point::before {
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                width: 4px;
                background: #6366F1;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .article-assistant-point:hover::before {
                opacity: 1;
            }

            .article-assistant-highlight {
                background: rgba(255, 246, 133, 0.4);
                border-bottom: 1px solid rgba(255, 213, 86, 0.5);
                padding: 2px 0;
                border-radius: 2px;
                transition: background-color 0.15s ease;
            }
            
            .article-assistant-highlight:hover {
                background: rgba(255, 246, 133, 0.6);
            }

            .article-assistant-card-button {
                background: none;
                border: none;
                color: #FFFFFF;
                font-size: 18px;
                cursor: pointer;
                padding: 6px 10px;
                border-radius: 8px;
                transition: all 0.15s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
            }

            .article-assistant-card-button:hover {
                background: rgba(255, 255, 255, 0.12);
                transform: translateY(-1px);
            }
            
            .article-assistant-card-button:active {
                transform: translateY(0);
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
            
            .article-assistant-reveal-question-button {
                display: block;
                width: 100%;
                padding: 14px 24px;
                background: linear-gradient(to right, #4F46E5, #6366F1);
                color: white;
                border: none;
                border-radius: 10px;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                text-align: center;
                position: relative;
                z-index: 10001;
                margin: 0;
                box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25);
                transition: all 0.2s ease;
                letter-spacing: 0.01em;
            }
            
            .article-assistant-reveal-question-button:hover {
                background: linear-gradient(to right, #4338CA, #4F46E5);
                box-shadow: 0 6px 10px rgba(99, 102, 241, 0.3);
                transform: translateY(-1px);
            }
            
            .article-assistant-reveal-question-button:active {
                transform: translateY(1px);
                box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
            }
            
            /* Question Box Styles */
            .article-assistant-question-box {
                position: fixed !important;
                background: white !important;
                border-radius: 12px !important;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08) !important;
                padding: 0 !important;
                z-index: 2147483647 !important; /* Maximum z-index */
                overflow-y: auto !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
                transition: transform 0.2s ease-out, opacity 0.2s ease-out !important;
                border: 1px solid rgba(0, 0, 0, 0.08) !important;
                max-width: 450px !important;
                min-width: 300px !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                top: 100px !important; /* Default position if calculations fail */
                left: 50% !important; /* Center horizontally */
                transform: translateX(-50%) !important; /* Center horizontally */
                margin: 0 auto !important;
            }
        `;

        const styleSheet = document.createElement("style");
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

window.StyleInjector = StyleInjector; 