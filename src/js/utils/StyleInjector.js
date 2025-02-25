class StyleInjector {
    static injectStyles() {
        const styles = `
            /* Modern color scheme */
            :root {
                --primary-gradient-start: #4361ee;
                --primary-gradient-end: #7209b7;
                --secondary-gradient-start: #3a0ca3;
                --secondary-gradient-end: #4cc9f0;
                --card-bg: #ffffff;
                --card-bg-secondary: #f8fafc;
                --card-shadow: 0 10px 25px rgba(35, 58, 159, 0.1), 0 6px 12px rgba(35, 58, 159, 0.08);
                --card-shadow-hover: 0 14px 30px rgba(35, 58, 159, 0.15), 0 8px 16px rgba(35, 58, 159, 0.1);
                --text-primary: #1e293b;
                --text-secondary: #475569;
                --text-light: #94a3b8;
                --border-color: rgba(226, 232, 240, 0.8);
                --accent-color: #4f46e5;
                --highlight-color: rgba(236, 252, 255, 0.8);
                --highlight-border: rgba(190, 242, 255, 0.8);
            }

            /* Animations */
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes slideIn {
                from { transform: translateX(20px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            .article-assistant-floating-card {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 500px;
                background: var(--card-bg);
                border-radius: 20px;
                box-shadow: var(--card-shadow);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                z-index: 999999;
                resize: none;
                overflow: hidden;
                min-height: 200px;
                transition: box-shadow 0.3s ease, transform 0.3s ease;
                border: 1px solid var(--border-color);
                backdrop-filter: blur(10px);
                animation: fadeIn 0.4s ease-out;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                transform: translateZ(0);
                will-change: box-shadow;
            }
            
            .article-assistant-floating-card:hover {
                box-shadow: var(--card-shadow-hover);
            }

            .article-assistant-card-header {
                background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
                padding: 18px 24px;
                border-radius: 20px 20px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
                z-index: 2;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .article-assistant-card-title {
                font-size: 20px;
                font-weight: 700;
                color: #FFFFFF;
                letter-spacing: -0.01em;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .article-assistant-card-title::before {
                content: "💡";
                font-size: 22px;
            }

            .article-assistant-card-content {
                padding: 0;
                overflow-y: auto;
                max-height: calc(85vh - 60px);
                scrollbar-width: thin;
                scrollbar-color: var(--text-light) var(--card-bg-secondary);
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, var(--card-bg) 100%);
            }
            
            .article-assistant-card-content::-webkit-scrollbar {
                width: 6px;
            }
            
            .article-assistant-card-content::-webkit-scrollbar-track {
                background: var(--card-bg-secondary);
                border-radius: 0 0 20px 0;
            }
            
            .article-assistant-card-content::-webkit-scrollbar-thumb {
                background-color: var(--text-light);
                border-radius: 20px;
                border: 2px solid var(--card-bg-secondary);
            }

            .article-assistant-qa-pair {
                margin: 0 24px 20px 24px;
                padding: 22px;
                background: var(--card-bg);
                border-radius: 16px;
                border: 1px solid var(--border-color);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
                transition: box-shadow 0.15s ease;
                position: relative;
                overflow: hidden;
                animation: fadeIn 0.3s ease-out;
                animation-fill-mode: both;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                transform: translateZ(0);
                will-change: box-shadow, border-color;
            }
            
            .article-assistant-qa-pair:hover {
                box-shadow: 0 6px 12px rgba(35, 58, 159, 0.06);
                border-color: rgba(79, 70, 229, 0.2);
            }
            
            .article-assistant-qa-pair:first-of-type {
                margin-top: 24px;
            }
            
            .article-assistant-qa-pair::after {
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                width: 4px;
                height: 100%;
                background: linear-gradient(to bottom, var(--primary-gradient-start), var(--primary-gradient-end));
                border-radius: 2px 0 0 2px;
                opacity: 0.8;
            }

            .article-assistant-question {
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 16px;
                font-size: 17px;
                line-height: 1.5;
                letter-spacing: -0.01em;
                padding-left: 24px;
                position: relative;
                text-rendering: optimizeLegibility;
            }
            
            .article-assistant-question::before {
                content: "Q";
                position: absolute;
                left: 0;
                color: var(--primary-gradient-start);
                font-weight: 800;
                margin-right: 8px;
            }

            .article-assistant-answer {
                color: var(--text-secondary);
                font-size: 16px;
                line-height: 1.6;
                white-space: pre-wrap;
                font-weight: 400;
                padding-left: 24px;
                position: relative;
                text-rendering: optimizeLegibility;
            }
            
            .article-assistant-answer::before {
                content: "A";
                position: absolute;
                left: 0;
                color: var(--primary-gradient-end);
                font-weight: 800;
                margin-right: 8px;
            }

            .article-assistant-quotes-section {
                border-top: 1px solid var(--border-color);
                margin: 16px 24px 0 24px;
                padding-top: 28px;
                padding-bottom: 28px;
            }

            .article-assistant-quotes-section h3 {
                font-size: 17px;
                font-weight: 700;
                color: var(--text-primary);
                margin: 0 0 18px 0;
                letter-spacing: -0.01em;
                display: flex;
                align-items: center;
                gap: 8px;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            .article-assistant-quotes-section h3::before {
                content: "✨";
                font-size: 18px;
            }

            .article-assistant-points {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .article-assistant-point {
                padding: 18px 22px;
                margin: 14px 0;
                background: var(--card-bg-secondary);
                border-radius: 14px;
                font-size: 15px;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.25s ease;
                border: 1px solid var(--border-color);
                position: relative;
                overflow: hidden;
                animation: slideIn 0.3s ease-out;
                animation-fill-mode: both;
                animation-delay: calc(var(--item-index, 0) * 0.08s);
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.01);
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                transform: translateZ(0);
                will-change: box-shadow, border-color, background;
            }

            .article-assistant-point:hover {
                background: linear-gradient(45deg, rgba(79, 70, 229, 0.03), rgba(66, 153, 225, 0.03));
                color: var(--text-primary);
                border-color: rgba(79, 70, 229, 0.2);
                box-shadow: 0 6px 12px rgba(35, 58, 159, 0.08);
            }
            
            .article-assistant-point:active {
                transform: translateZ(0) scale(0.99);
            }
            
            .article-assistant-point::before {
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                width: 4px;
                background: linear-gradient(to bottom, var(--primary-gradient-start), var(--secondary-gradient-end));
                opacity: 0;
            }
            
            .article-assistant-point::after {
                content: "🔍";
                position: absolute;
                right: 16px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 16px;
                opacity: 0;
                transition: opacity 0.2s ease, transform 0.2s ease;
            }
            
            .article-assistant-point:hover::after {
                opacity: 1;
                transform: translateY(-50%) translateX(-4px);
            }

            .article-assistant-highlight {
                background: var(--highlight-color);
                border-bottom: 1px solid var(--highlight-border);
                padding: 2px 0;
                border-radius: 3px;
                transition: background-color 0.15s ease;
                box-shadow: 0 1px 2px rgba(35, 58, 159, 0.05);
            }
            
            .article-assistant-highlight:hover {
                background: rgba(190, 242, 255, 0.6);
            }

            .article-assistant-card-button {
                background: rgba(255, 255, 255, 0.15);
                border: none;
                color: #FFFFFF;
                font-size: 18px;
                cursor: pointer;
                padding: 8px;
                border-radius: 10px;
                transition: all 0.15s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                backdrop-filter: blur(10px);
            }

            .article-assistant-card-button:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: translateY(-2px);
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
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
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                padding: 18px 24px;
                background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
                color: white;
                border: none;
                border-radius: 16px;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                text-align: center;
                position: relative;
                z-index: 10001;
                margin: 12px 0;
                box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25);
                transition: all 0.25s ease;
                letter-spacing: 0.01em;
                overflow: hidden;
            }
            
            .article-assistant-reveal-question-button::before {
                content: "✦";
                font-size: 18px;
                opacity: 0.8;
            }
            
            .article-assistant-reveal-question-button::after {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, 
                    rgba(255, 255, 255, 0) 0%, 
                    rgba(255, 255, 255, 0.1) 50%, 
                    rgba(255, 255, 255, 0) 100%);
                transform: translateX(-100%);
                transition: transform 0.6s ease;
                z-index: -1;
            }
            
            .article-assistant-reveal-question-button:hover {
                background: linear-gradient(135deg, var(--secondary-gradient-start), var(--secondary-gradient-end));
                box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35);
                transform: translateY(-2px) scale(1.01);
            }
            
            .article-assistant-reveal-question-button:hover::after {
                transform: translateX(100%);
            }
            
            .article-assistant-reveal-question-button:active {
                transform: translateY(1px) scale(0.99);
                box-shadow: 0 4px 8px rgba(79, 70, 229, 0.2);
            }
            
            /* Question Box Styles */
            .article-assistant-question-box {
                position: fixed !important;
                background: var(--card-bg) !important;
                border-radius: 20px !important;
                box-shadow: var(--card-shadow-hover) !important;
                padding: 0 !important;
                z-index: 2147483647 !important; /* Maximum z-index */
                overflow-y: auto !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
                transition: transform 0.3s ease-out, opacity 0.3s ease-out !important;
                border: 1px solid var(--border-color) !important;
                max-width: 450px !important;
                min-width: 320px !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                margin: 0 auto !important;
                animation: fadeIn 0.3s ease-out !important;
            }
            
            /* Added Textarea and Button Styles */
            .article-assistant-question-box textarea {
                width: 100% !important;
                min-height: 100px !important;
                padding: 16px !important;
                border: 1px solid var(--border-color) !important;
                border-radius: 12px !important;
                margin-bottom: 16px !important;
                font-family: inherit !important;
                font-size: 16px !important;
                line-height: 1.5 !important;
                color: var(--text-primary) !important;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02) inset !important;
                transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
                resize: vertical !important;
            }
            
            .article-assistant-question-box textarea:focus {
                outline: none !important;
                border-color: var(--primary-gradient-start) !important;
                box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.15) !important;
            }
            
            .article-assistant-question-box textarea::placeholder {
                color: var(--text-light) !important;
            }
            
            .article-assistant-question-box button.article-assistant-submit-button {
                background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end)) !important;
                color: white !important;
                border: none !important;
                padding: 14px 20px !important;
                border-radius: 12px !important;
                font-weight: 600 !important;
                font-size: 16px !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                display: block !important;
                width: 100% !important;
                text-align: center !important;
                box-shadow: 0 4px 12px rgba(67, 97, 238, 0.2) !important;
            }
            
            .article-assistant-question-box button.article-assistant-submit-button:hover {
                background: linear-gradient(135deg, var(--secondary-gradient-start), var(--secondary-gradient-end)) !important;
                box-shadow: 0 6px 16px rgba(67, 97, 238, 0.3) !important;
                transform: translateY(-2px) !important;
            }
            
            .article-assistant-question-box button.article-assistant-submit-button:active {
                transform: translateY(1px) !important;
                box-shadow: 0 2px 8px rgba(67, 97, 238, 0.2) !important;
            }
            
            /* Question Box Header */
            .article-assistant-question-box > div:first-child {
                background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end)) !important;
                padding: 18px 24px !important;
                border-radius: 20px 20px 0 0 !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                color: white !important;
                font-weight: 700 !important;
                font-size: 18px !important;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            }
            
            /* Question Box Close Button */
            .article-assistant-question-box > div:first-child button {
                background: rgba(255, 255, 255, 0.15) !important;
                border: none !important;
                color: white !important;
                font-size: 16px !important;
                width: 32px !important;
                height: 32px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 10px !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                backdrop-filter: blur(8px) !important;
            }
            
            .article-assistant-question-box > div:first-child button:hover {
                background: rgba(255, 255, 255, 0.25) !important;
                transform: translateY(-2px) !important;
            }
            
            /* Question Box Content */
            .article-assistant-question-box > div:not(:first-child) {
                padding: 24px !important;
            }
        `;

        const styleSheet = document.createElement("style");
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

window.StyleInjector = StyleInjector; 